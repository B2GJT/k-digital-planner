import { resolveProjectDir } from './lib/paths.js';
import { loadContext } from './lib/context.js';
import { generateWithClaude } from './lib/claude.js';
import { finalMaterialsPrompt } from './lib/prompts.js';
import { writeStep } from './lib/result-writer.js';
import { writeClaudeFailure } from './lib/step-failure.js';

async function main() {
  const projectDir = resolveProjectDir(process.argv[2]);
  const context = loadContext(projectDir);

  let body;
  try {
    body = await generateWithClaude(finalMaterialsPrompt(context), {
      label: '기획안 요소 구성',
    });
  } catch (err) {
    writeClaudeFailure(context, '기획안 요소 구성 결과 생성', err);
    throw err;
  }

  writeStep(context.resultsDir, context.resultPath, '05-plan-materials.md', '05. 기획안 요소 구성 결과', body);
  console.log('Step complete: results/05-plan-materials.md');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
