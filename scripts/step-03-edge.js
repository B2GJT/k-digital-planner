import { resolveProjectDir } from './lib/paths.js';
import { loadContext } from './lib/context.js';
import { generateWithClaude } from './lib/claude.js';
import { edgePrompt } from './lib/prompts.js';
import { writeStep } from './lib/result-writer.js';
import { writeClaudeFailure } from './lib/step-failure.js';

async function main() {
  const projectDir = resolveProjectDir(process.argv[2]);
  const context = loadContext(projectDir);

  let body;
  try {
    body = await generateWithClaude(edgePrompt(context), {
      label: 'Edge 추출',
    });
  } catch (err) {
    writeClaudeFailure(context, 'Edge 추출 결과 생성', err);
    throw err;
  }

  writeStep(context.resultsDir, context.resultPath, '04-edge.md', '04. Edge 추출 결과', body);
  console.log('Step complete: results/04-edge.md');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
