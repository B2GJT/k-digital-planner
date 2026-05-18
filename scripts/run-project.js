import { spawnSync } from 'node:child_process';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { repoRoot, resolveProjectDir, ensureProjectLayout } from './lib/paths.js';
import { appendNote, resetResult } from './lib/result-writer.js';
import { loadSettings } from './lib/settings.js';

const projectArg = process.argv[2];
const projectDir = resolveProjectDir(projectArg);
const layout = ensureProjectLayout(projectDir);
const projectName = path.basename(projectDir);
const settings = loadSettings(projectDir);

resetResult(layout.resultPath, projectName);

// [label, script, outputFile, appendCompletionOnly, settingsKey]
const steps = [
  ['CR xlsx 추출',           'scripts/extract-cr.js',            'extracted/cr.txt',               true,  'CR추출'],
  ['AOP 페이지 추출',         'scripts/extract-aop.js',           'extracted/aop.txt',              true,  'AOP추출'],
  ['CR 분석 결과 생성',       'scripts/step-00-cr-analysis.js',   'results/01-cr-analysis.md',      false, 'CR분석'],
  ['AOP 분석 결과 생성',      'scripts/step-00-aop-analysis.js',  'results/02-aop-analysis.md',     false, 'AOP분석'],
  ['시장조사 결과 생성',      'scripts/step-01-research.js',      'results/03-market-research.md',  false, '시장조사'],
  ['Edge 추출 결과 생성',     'scripts/step-03-edge.js',          'results/04-edge.md',             false, 'Edge추출'],
  ['기획안 요소 구성 결과 생성', 'scripts/step-04-final-materials.js', 'results/05-plan-materials.md', false, '기획안구성'],
];

for (let i = 0; i < steps.length; i += 1) {
  const [label, script, outputFile, appendCompletionOnly, settingsKey] = steps[i];
  const outputPath = path.join(projectDir, outputFile);

  // settings.txt 에서 비활성화된 단계는 건너뜀
  if (!settings[settingsKey]) {
    console.log(`\n[${i + 1}/${steps.length}] ${label} — settings.txt에 의해 스킵됨`);
    appendNote(
      layout.resultPath,
      `${label} — 스킵`,
      `settings.txt 설정에 따라 이 단계(${settingsKey})가 비활성화되었습니다. 이전에 생성된 파일이 있다면 다음 단계에서 그대로 사용됩니다.`
    );
    continue;
  }

  console.log(`\n[${i + 1}/${steps.length}] ${label}`);

  const result = spawnSync(process.execPath, [script, projectArg], {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: false,
    env: process.env,
  });

  if (result.status !== 0) {
    appendNote(
      layout.resultPath,
      `실패: ${label}`,
      [
        '단계 실행 중 오류가 발생했습니다.',
        `확인 파일: ${outputPath}`,
        `종료 코드: ${result.status ?? 1}`,
      ].join('\n')
    );
    process.exit(result.status ?? 1);
  }

  console.log(`확인 파일: ${outputPath}`);

  if (appendCompletionOnly) {
    appendNote(
      layout.resultPath,
      `${label} 완료`,
      [
        `생성 파일: ${outputPath}`,
        '이 단계는 원본 추출 단계입니다. 분석 내용은 이후 Claude 분석 단계에서 추가됩니다.',
      ].join('\n')
    );
  }

  // 다음 활성화된 단계를 찾아 확인 프롬프트 표시
  const nextEnabledIndex = steps.findIndex((s, j) => j > i && settings[s[4]]);
  if (nextEnabledIndex !== -1) {
    const shouldContinue = await confirmNext(steps[nextEnabledIndex][0]);
    if (!shouldContinue) {
      appendNote(
        layout.resultPath,
        '사용자 중단',
        `다음 단계 "${steps[nextEnabledIndex][0]}" 진입 전 사용자가 중단했습니다.`
      );
      console.log(`중단했습니다. 현재까지의 누적 결과: ${layout.resultPath}`);
      process.exit(0);
    }
  }
}

console.log(`\n완료: ${layout.resultPath}`);

async function confirmNext(nextLabel) {
  if (process.env.CLAUDE_AUTO_YES === '1' || !process.stdin.isTTY) return true;

  const rl = readline.createInterface({ input, output });
  try {
    const answer = await rl.question(`다음 단계 "${nextLabel}"로 계속 진행할까요? (Y/n): `);
    return !/^n(o)?$/i.test(answer.trim());
  } finally {
    rl.close();
  }
}
