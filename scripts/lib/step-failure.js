import fs from 'node:fs';
import path from 'node:path';
import { appendNote } from './result-writer.js';

const UTF8_BOM = '\uFEFF';

export function writeClaudeFailure(context, stepTitle, err) {
  const stamp = Date.now();
  const logPath = path.join(context.logsDir, `error-${stamp}.log`);
  const promptPath = path.join(context.logsDir, `prompt-${stamp}.md`);

  const detail = [
    `Step: ${stepTitle}`,
    `Exit code: ${err.exitCode ?? 'unknown'}`,
    `Command: ${err.command || 'unknown'}`,
    '',
    '[stderr]',
    err.stderr?.trim() || '(empty)',
    '',
    '[stdout]',
    err.stdout?.trim() || '(empty)',
    '',
    '[message]',
    err.message || '(empty)',
    '',
    '[attempts]',
    renderAttempts(err.failures),
    '',
  ].join('\n');

  fs.mkdirSync(context.logsDir, { recursive: true });
  fs.writeFileSync(logPath, `${UTF8_BOM}${detail}`, 'utf8');
  if (err.prompt) {
    fs.writeFileSync(promptPath, `${UTF8_BOM}${err.prompt}`, 'utf8');
  }

  appendNote(
    context.resultPath,
    `실패 상세: ${stepTitle}`,
    [
      'Claude CLI 호출에 실패했습니다.',
      '',
      `오류 로그: ${logPath}`,
      err.prompt ? `전달 프롬프트: ${promptPath}` : '',
      '',
      '확인 사항:',
      '- Claude CLI 경로 진단: `node scripts/check-claude.js`',
      '- WindowsApps 보호로 실행 불가 시 npm 경로를 환경변수로 지정:',
      '  set CLAUDE_CLI=%APPDATA%\\npm\\claude.cmd',
      '- 로그인 확인: `claude login` (API 키 불필요, 계정 기반 인증)',
      '- 방화벽, 보안 프로그램, 회사 네트워크가 `api.anthropic.com` 연결을 차단하지 않는지 확인',
    ]
      .filter(Boolean)
      .join('\n')
  );
}

function renderAttempts(failures) {
  if (!failures?.length) return '(none)';

  return failures
    .map((failure, index) => {
      return [
        `#${index + 1}`,
        `command=${failure.command}`,
        `code=${failure.code || '(none)'}`,
        `exitCode=${failure.exitCode || '(none)'}`,
        `message=${failure.message || '(empty)'}`,
      ].join('\n');
    })
    .join('\n\n');
}
