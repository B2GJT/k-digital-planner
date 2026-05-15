import path from 'node:path';
import { ensureProjectLayout, requireInputFile } from './paths.js';
import { parseInputFile } from './input.js';
import { readIfExists } from './result-writer.js';

export function loadContext(projectDir) {
  const layout = ensureProjectLayout(projectDir);
  requireInputFile(layout.inputPath);

  const input = parseInputFile(layout.inputPath);
  const crText = readIfExists(path.join(layout.extractedDir, 'cr.txt'));
  const aopText = readIfExists(path.join(layout.extractedDir, 'aop.txt'));
  const crAnalysis = readIfExists(path.join(layout.resultsDir, '01-cr-analysis.md'));
  const aopAnalysis = readIfExists(path.join(layout.resultsDir, '02-aop-analysis.md'));
  const accumulated = readIfExists(layout.resultPath);

  return {
    ...layout,
    input,
    crText,
    aopText,
    crAnalysis,
    aopAnalysis,
    accumulated,
  };
}
