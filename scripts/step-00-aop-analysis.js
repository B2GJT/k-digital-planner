import { resolveProjectDir } from './lib/paths.js';
import { loadContext } from './lib/context.js';
import { generateWithCodex } from './lib/codex.js';
import { aopAnalysisPrompt } from './lib/prompts.js';
import { writeStep } from './lib/result-writer.js';
import { writeCodexFailure } from './lib/step-failure.js';

async function main() {
  const projectDir = resolveProjectDir(process.argv[2]);
  const context = loadContext(projectDir);

  let body;
  try {
    body = await generateWithCodex(aopAnalysisPrompt(context), {
      cwd: projectDir,
      label: 'AOP 분석',
    });
  } catch (err) {
    writeCodexFailure(context, 'AOP 분석 결과 생성', err);
    throw err;
  }

  writeStep(context.resultsDir, context.resultPath, '02-aop-analysis.md', '02. AOP 분석 결과', body);
  console.log('Step complete: results/02-aop-analysis.md');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
