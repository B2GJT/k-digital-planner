import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function resolveProjectDir(projectArg) {
  if (!projectArg) {
    throw new Error('프로젝트 폴더를 지정해주세요. 예: node scripts/run-project.js projects/sample-project');
  }
  return path.resolve(repoRoot, projectArg);
}

export function ensureProjectLayout(projectDir) {
  const extractedDir = path.join(projectDir, 'extracted');
  const resultsDir = path.join(projectDir, 'results');
  const logsDir = path.join(repoRoot, 'logs', path.basename(projectDir));

  fs.mkdirSync(extractedDir, { recursive: true });
  fs.mkdirSync(resultsDir, { recursive: true });
  fs.mkdirSync(logsDir, { recursive: true });

  return {
    projectDir,
    inputPath: path.join(projectDir, 'inputs.txt'),
    extractedDir,
    resultsDir,
    logsDir,
    resultPath: path.join(resultsDir, 'result.txt'),
  };
}

export function requireInputFile(inputPath) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`inputs.txt 파일을 찾을 수 없습니다: ${inputPath}`);
  }
}
