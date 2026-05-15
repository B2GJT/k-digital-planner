import { resolveProjectDir } from './lib/paths.js';
import { loadContext } from './lib/context.js';
import { generateWithCodex } from './lib/codex.js';
import { researchPrompt } from './lib/prompts.js';
import { writeStep } from './lib/result-writer.js';
import { writeCodexFailure } from './lib/step-failure.js';

async function main() {
  const projectDir = resolveProjectDir(process.argv[2]);
  const context = loadContext(projectDir);

  let body;
  try {
    body = await generateWithCodex(researchPrompt(context), {
      cwd: projectDir,
      label: '시장조사',
    });
  } catch (err) {
    writeCodexFailure(context, '시장조사 결과 생성', err);
    throw err;
  }

  writeStep(context.resultsDir, context.resultPath, '03-market-research.md', '03. 시장조사 결과', body);
  console.log('Step complete: results/03-market-research.md');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
