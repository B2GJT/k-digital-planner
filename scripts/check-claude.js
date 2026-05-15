/**
 * Claude CLI 설치 경로 진단 스크립트
 * 실행: node scripts/check-claude.js
 *
 * Windows App 설치(WindowsApps 경로)는 spawn EPERM 오류가 발생할 수 있습니다.
 * 그런 경우 npm으로 별도 설치 후 CLAUDE_CLI 환경변수로 경로를 지정하세요.
 *   npm install -g @anthropic-ai/claude-code
 *   set CLAUDE_CLI=%APPDATA%\npm\claude.cmd
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

function ok(msg) { console.log(`${GREEN}[OK]${RESET}  ${msg}`); }
function warn(msg) { console.log(`${YELLOW}[??]${RESET}  ${msg}`); }
function fail(msg) { console.log(`${RED}[NG]${RESET}  ${msg}`); }
function info(msg) { console.log(`      ${msg}`); }

console.log(`\n${BOLD}Claude CLI 경로 진단${RESET}`);
console.log('='.repeat(50));

// ── 1. 환경변수 CLAUDE_CLI ──────────────────────────────────
console.log('\n[1] 환경변수 CLAUDE_CLI');
const envCli = process.env.CLAUDE_CLI;
if (envCli) {
  if (fs.existsSync(envCli)) {
    ok(`CLAUDE_CLI=${envCli}`);
  } else {
    fail(`CLAUDE_CLI 지정됨 → 파일 없음: ${envCli}`);
    info('존재하지 않는 경로이므로 무시됩니다.');
  }
} else {
  warn('CLAUDE_CLI 환경변수가 설정되지 않음 (자동 탐색 사용)');
}

// ── 2. npm 글로벌 경로 ─────────────────────────────────────
console.log('\n[2] npm 글로벌 설치 (Windows: %APPDATA%\\npm\\claude.cmd)');
const appData = process.env.APPDATA;
if (appData) {
  const npmCmd = path.join(appData, 'npm', 'claude.cmd');
  if (fs.existsSync(npmCmd)) {
    ok(npmCmd);
    testVersion(npmCmd, ['/d', '/c', npmCmd, '--version'], true);
  } else {
    fail(`없음: ${npmCmd}`);
    info('설치: npm install -g @anthropic-ai/claude-code');
  }
} else {
  warn('%APPDATA% 환경변수 없음 (비-Windows 환경?)');
}

// ── 3. where.exe 탐색 ──────────────────────────────────────
console.log('\n[3] PATH 탐색 (where.exe claude.cmd / claude.exe / claude)');
for (const name of ['claude.cmd', 'claude.exe', 'claude']) {
  const result = spawnSync('where.exe', [name], { encoding: 'utf8', shell: false });
  if (result.status === 0) {
    const found = result.stdout.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    for (const p of found) {
      ok(`where ${name} → ${p}`);
      testVersion(p, buildTestArgs(p), false);
    }
  } else {
    fail(`where.exe ${name} → 찾지 못함`);
  }
}

// ── 4. Windows App 별칭 경로 ───────────────────────────────
console.log('\n[4] WindowsApps 별칭 경로 (spawn EPERM 위험)');
const localAppData = process.env.LOCALAPPDATA;
if (localAppData) {
  const waPath = path.join(localAppData, 'Microsoft', 'WindowsApps', 'claude.exe');
  if (fs.existsSync(waPath)) {
    warn(`존재: ${waPath}`);
    info('WindowsApps 경로는 spawn EPERM 오류를 유발할 수 있습니다.');
    info('→ npm 설치 후 CLAUDE_CLI 환경변수로 경로를 명시하세요.');
  } else {
    info(`없음: ${waPath} (정상)`);
  }
} else {
  info('%LOCALAPPDATA% 없음');
}

// ── 5. 계정 로그인 상태 ────────────────────────────────────
// Claude CLI는 API 키가 아닌 계정(claude login) 기반으로 동작합니다.
// ANTHROPIC_API_KEY는 웹앱 서버리스 함수(api/*.js)용이며 CLI와는 무관합니다.
console.log('\n[5] 계정 로그인 상태 (claude login)');
info('Claude CLI는 API 키 불필요 — 계정 기반 인증 사용');
info('미로그인 시: claude login (브라우저 OAuth 인증)');

// ── 6. 실제 동작 테스트 ─────────────────────────────────────
console.log('\n[6] Claude CLI 동작 테스트 (--version)');
const testCommands = [];

if (envCli && fs.existsSync(envCli)) testCommands.push(envCli);
if (appData) {
  const npmCmd = path.join(appData, 'npm', 'claude.cmd');
  if (fs.existsSync(npmCmd)) testCommands.push(npmCmd);
}
const whereResult = spawnSync('where.exe', ['claude.cmd'], { encoding: 'utf8', shell: false });
if (whereResult.status === 0) {
  const found = whereResult.stdout.split(/\r?\n/).map(l => l.trim()).filter(Boolean)[0];
  if (found) testCommands.push(found);
}
testCommands.push('claude');

let anyWorked = false;
const seen = new Set();
for (const cmd of testCommands) {
  if (seen.has(cmd)) continue;
  seen.add(cmd);
  const args = buildTestArgs(cmd);
  const r = spawnSync(args[0], args.slice(1), { encoding: 'utf8', shell: false, timeout: 10000 });
  if (r.status === 0) {
    ok(`성공: ${cmd}`);
    info(`버전: ${(r.stdout || r.stderr).trim().split('\n')[0]}`);
    anyWorked = true;
    break;
  }
}
if (!anyWorked) {
  fail('동작하는 Claude CLI를 찾지 못했습니다.');
  info('npm install -g @anthropic-ai/claude-code 후 재실행하세요.');
}

// ── 권장 설정 요약 ─────────────────────────────────────────
console.log('\n' + '='.repeat(50));
if (anyWorked) {
  console.log(`${GREEN}${BOLD}CLI 설치 확인됨${RESET} — 미로그인 시 claude login 후 run-project.bat 실행하세요.`);
} else {
  console.log(`${YELLOW}${BOLD}추가 설정 필요${RESET}`);
  info('→ npm install -g @anthropic-ai/claude-code');
  info('→ 설치 후: claude login  (브라우저 OAuth)');
  info('→ WindowsApps 경로 문제 시: set CLAUDE_CLI=%APPDATA%\\npm\\claude.cmd');
}
console.log('');

// ── 헬퍼 ───────────────────────────────────────────────────
function buildTestArgs(cmd) {
  if (process.platform === 'win32' && /\.(cmd|bat)$/i.test(cmd)) {
    return [process.env.ComSpec || 'cmd.exe', '/d', '/c', cmd, '--version'];
  }
  return [cmd, '--version'];
}

function testVersion(displayCmd, args, isCmdWrapper) {
  const spawnCmd = args[0];
  const spawnArgs = args.slice(1);
  const r = spawnSync(spawnCmd, spawnArgs, { encoding: 'utf8', shell: false, timeout: 8000 });
  if (r.status === 0) {
    const ver = (r.stdout || r.stderr).trim().split('\n')[0];
    info(`→ 버전: ${ver}`);
  } else if (r.error?.code === 'EPERM') {
    info(`→ spawn EPERM — WindowsApps 보호 경로, 직접 실행 불가`);
  } else {
    info(`→ --version 실패 (exit ${r.status}): ${(r.stderr || r.error?.message || '').slice(0, 80)}`);
  }
}
