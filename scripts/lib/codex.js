import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

export async function generateWithCodex(prompt, { cwd, label }) {
  if (process.env.CODEX_DRY_RUN === '1') {
    return dryRunResponse(label, prompt);
  }

  const outputPath = path.join(os.tmpdir(), `kdp-codex-${Date.now()}-${Math.random().toString(16).slice(2)}.txt`);
  const codexCommands = resolveCodexCommands();
  const args = [
    '--ask-for-approval',
    'never',
    'exec',
    '-C',
    cwd,
    '--skip-git-repo-check',
    '--sandbox',
    'read-only',
    '--ephemeral',
    '--color',
    'never',
    '--output-last-message',
    outputPath,
    '-',
  ];

  const failures = [];
  try {
    await runFirstWorkingCommand(codexCommands, args, { cwd, input: prompt, failures });
  } catch (err) {
    err.prompt = prompt;
    err.outputPath = outputPath;
    err.failures = failures;
    throw err;
  }

  const text = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
  fs.rmSync(outputPath, { force: true });
  if (!text.trim()) {
    throw new Error('Codex CLI returned an empty response.');
  }
  return text.trim();
}

async function runFirstWorkingCommand(commands, args, options) {
  let lastError = null;
  for (const command of commands) {
    try {
      await runCommand(command, args, options);
      return;
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

  throw lastError || new Error('Codex CLI 실행 파일을 찾지 못했습니다.');
}

function isSpawnAccessError(err) {
  return err?.code === 'ENOENT' || err?.code === 'EPERM' || /spawn EPERM|spawn ENOENT/i.test(err?.message || '');
}

function resolveCodexCommands() {
  const commands = [];

  const fromCmd = findFromWhere('codex.cmd');
  if (fromCmd) commands.push(fromCmd);

  const fromNpmGlobal = findNpmGlobalCodexCmd();
  if (fromNpmGlobal) commands.push(fromNpmGlobal);

  if (process.env.CODEX_CLI) {
    commands.push(process.env.CODEX_CLI);
  }

  const fromExe = findFromWhere('codex.exe');
  if (fromExe) commands.push(fromExe);

  const fromWhere = findFromWhere();
  if (fromWhere) commands.push(fromWhere);

  const fromWindowsApps = findWindowsAppAlias();
  if (fromWindowsApps) commands.push(fromWindowsApps);

  const fromAppx = findFromAppxPackage();
  if (fromAppx) commands.push(fromAppx);

  commands.push('codex');
  return [...new Set(commands.filter(Boolean))];
}

function findFromWhere(command = 'codex') {
  const result = spawnSync('where.exe', [command], {
    encoding: 'utf8',
    shell: false,
  });
  if (result.status !== 0) return '';

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean) || '';
}

function findWindowsAppAlias() {
  if (process.platform !== 'win32') return '';
  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) return '';

  const candidate = path.join(localAppData, 'Microsoft', 'WindowsApps', 'codex.exe');
  return fs.existsSync(candidate) ? candidate : '';
}

function findNpmGlobalCodexCmd() {
  if (process.platform !== 'win32') return '';
  const appData = process.env.APPDATA;
  if (!appData) return '';

  const candidate = path.join(appData, 'npm', 'codex.cmd');
  return fs.existsSync(candidate) ? candidate : '';
}

function findFromAppxPackage() {
  if (process.platform !== 'win32') return '';

  const result = spawnSync('powershell', [
    '-NoProfile',
    '-Command',
    '(Get-AppxPackage OpenAI.Codex | Select-Object -First 1 -ExpandProperty InstallLocation)',
  ], {
    encoding: 'utf8',
    shell: false,
  });

  if (result.status !== 0) return '';

  const installLocation = result.stdout.trim();
  if (!installLocation) return '';

  const candidate = path.join(installLocation, 'app', 'resources', 'codex.exe');
  return fs.existsSync(candidate) ? candidate : '';
}

function runCommand(command, args, options) {
  return new Promise((resolve, reject) => {
    const spawnTarget = prepareSpawnTarget(command, args);
    const child = spawn(spawnTarget.command, spawnTarget.args, {
      cwd: options.cwd,
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
        err.message = [
          `Codex CLI 실행 파일을 찾지 못했습니다: ${command}`,
          '',
          '해결 방법:',
          '1. PowerShell에서 & "$env:APPDATA\\npm\\codex.cmd" --version 실행 확인',
          '2. 로그인 확인: & "$env:APPDATA\\npm\\codex.cmd" login',
          '3. CODEX_CLI가 WindowsApps 보호 경로를 가리키면 제거',
          '   예: reg delete HKCU\\Environment /v CODEX_CLI /f',
        ].join('\n');
      }
      reject(err);
    });

    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      if (code === 0) {
        resolve();
      } else {
        const error = new Error(`Codex CLI failed with exit code ${code}.\n${stderr.trim() || stdout.trim()}`);
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

function dryRunResponse(label, prompt) {
  const lines = prompt
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .slice(0, 8)
    .map((line) => `- ${line.trim().slice(0, 120)}`);

  return [
    `# ${label} dry-run 결과`,
    '',
    'CODEX_DRY_RUN=1 상태라 실제 Codex 호출은 생략했습니다.',
    '',
    '프롬프트 요약:',
    ...lines,
  ].join('\n');
}
