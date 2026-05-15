import { resolveProjectDir } from './lib/paths.js';
import { loadContext } from './lib/context.js';
import { generateWithCodex } from './lib/codex.js';
import { finalMaterialsPrompt } from './lib/prompts.js';
import { writeStep } from './lib/result-writer.js';
import { writeCodexFailure } from './lib/step-failure.js';

async function main() {
  const projectDir = resolveProjectDir(process.argv[2]);
  const context = loadContext(projectDir);

  let body;
  try {
    body = await generateWithCodex(finalMaterialsPrompt(context), {
      cwd: projectDir,
      label: '기획안 요소 구성',
    });
  } catch (err) {
    writeCodexFailure(context, '기획안 요소 구성 결과 생성', err);
    throw err;
  }

  writeStep(context.resultsDir, context.resultPath, '05-plan-materials.md', '05. 기획안 요소 구성 결과', body);
  console.log('Step complete: results/05-plan-materials.md');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
