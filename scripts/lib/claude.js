import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

export async function generateWithClaude(prompt, { label }) {
  if (process.env.CLAUDE_DRY_RUN === '1') {
    return dryRunResponse(label, prompt);
  }

  const claudeCommands = resolveClaudeCommands();
  // claude -p: print mode (non-interactive), prompt via stdin
  const args = ['--print', '--output-format', 'text'];

  const failures = [];
  let output = '';
  try {
    output = await runFirstWorkingCommand(claudeCommands, args, { input: prompt, failures });
  } catch (err) {
    err.prompt = prompt;
    err.failures = failures;
    throw err;
  }

  if (!output.trim()) {
    throw new Error('Claude CLI returned an empty response.');
  }
  return output.trim();
}

async function runFirstWorkingCommand(commands, args, options) {
  let lastError = null;
  for (const command of commands) {
    try {
      const result = await runCommand(command, args, options);
      return result;
    } catch (err) {
      lastError = err;
      options.failures?.push({
        command,
        code: err.code || '',
        exitCode: err.exitCode ?? '',
        message: err.message || '',
        stderr: err.stderr || '',
        stdout: err.stdout || '',
      });

      if (!isSpawnAccessError(err)) {
        throw err;
      }
    }
  }

  throw lastError || new Error('Claude CLI 실행 파일을 찾지 못했습니다.');
}

function isSpawnAccessError(err) {
  return err?.code === 'ENOENT' || err?.code === 'EPERM' || /spawn EPERM|spawn ENOENT/i.test(err?.message || '');
}

function resolveClaudeCommands() {
  const commands = [];

  // 1. 사용자 지정 경로 (환경변수 CLAUDE_CLI)
  if (process.env.CLAUDE_CLI) {
    commands.push(process.env.CLAUDE_CLI);
  }

  // 2. npm 글로벌 .cmd 래퍼 (Windows: %APPDATA%\npm\claude.cmd)
  const fromNpmCmd = findNpmGlobalClaudeCmd();
  if (fromNpmCmd) commands.push(fromNpmCmd);

  // 3. where.exe로 PATH 검색 (claude.cmd 우선)
  const fromWhereCmd = findFromWhere('claude.cmd');
  if (fromWhereCmd) commands.push(fromWhereCmd);

  // 4. where.exe로 PATH 검색 (claude.exe)
  const fromWhereExe = findFromWhere('claude.exe');
  if (fromWhereExe) commands.push(fromWhereExe);

  // 5. Windows App 별칭 경로 (설치 방식에 따라 존재할 수 있음)
  const fromWindowsApps = findWindowsAppAlias();
  if (fromWindowsApps) commands.push(fromWindowsApps);

  // 6. 최후 수단: PATH에서 bare 명령어
  const fromWhere = findFromWhere('claude');
  if (fromWhere) commands.push(fromWhere);

  commands.push('claude');

  return [...new Set(commands.filter(Boolean))];
}

function findFromWhere(command) {
  const result = spawnSync('where.exe', [command], {
    encoding: 'utf8',
    shell: false,
  });
  if (result.status !== 0) return '';

  return (
    result.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) || ''
  );
}

function findWindowsAppAlias() {
  if (process.platform !== 'win32') return '';
  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) return '';

  const candidate = path.join(localAppData, 'Microsoft', 'WindowsApps', 'claude.exe');
  return fs.existsSync(candidate) ? candidate : '';
}

function findNpmGlobalClaudeCmd() {
  if (process.platform !== 'win32') return '';
  const appData = process.env.APPDATA;
  if (!appData) return '';

  const candidate = path.join(appData, 'npm', 'claude.cmd');
  return fs.existsSync(candidate) ? candidate : '';
}

function runCommand(command, args, options) {
  return new Promise((resolve, reject) => {
    const spawnTarget = prepareSpawnTarget(command, args);
    const child = spawn(spawnTarget.command, spawnTarget.args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false,
    });

    let stderr = '';
    let stdout = '';
    let settled = false;

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.stdin?.end(options.input);

    child.on('error', (err) => {
      if (settled) return;
      settled = true;
      err.command = command;
      err.stderr = stderr;
      err.stdout = stdout;
      if (err.code === 'ENOENT') {
        err.message = buildNotFoundMessage(command);
      }
      reject(err);
    });

    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      if (code === 0) {
        resolve(stdout);
      } else {
        const error = new Error(`Claude CLI failed with exit code ${code}.\n${stderr.trim() || stdout.trim()}`);
        error.command = command;
        error.exitCode = code;
        error.stderr = stderr;
        error.stdout = stdout;
        reject(error);
      }
    });
  });
}

function prepareSpawnTarget(command, args) {
  if (process.platform !== 'win32' || !/\.(cmd|bat)$/i.test(command)) {
    return { command, args };
  }

  const comSpec = process.env.ComSpec || 'cmd.exe';
  return {
    command: comSpec,
    args: ['/d', '/c', command, ...args],
  };
}

function buildNotFoundMessage(command) {
  return [
    `Claude CLI 실행 파일을 찾지 못했습니다: ${command}`,
    '',
    '해결 방법:',
    '1. Claude CLI 설치 확인: npm install -g @anthropic-ai/claude-code',
    '2. 설치 후 로그인: claude login  (API 키 불필요, 계정 기반 인증)',
    '3. 경로 진단: node scripts/check-claude.js',
    '4. WindowsApps 보호로 실행 불가 시 npm 설치 경로를 환경변수로 지정:',
    '   set CLAUDE_CLI=%APPDATA%\\npm\\claude.cmd',
  ].join('\n');
}

function dryRunResponse(label, prompt) {
  const lines = prompt
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .slice(0, 8)
    .map((line) => `- ${line.trim().slice(0, 120)}`);

  return [
    `# ${label} dry-run 결과`,
    '',
    'CLAUDE_DRY_RUN=1 상태라 실제 Claude 호출은 생략했습니다.',
    '',
    '프롬프트 요약:',
    ...lines,
  ].join('\n');
}
