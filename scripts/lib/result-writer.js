import fs from 'node:fs';
import path from 'node:path';

const UTF8_BOM = '\uFEFF';

export function writeStep(resultsDir, resultPath, fileName, title, body) {
  const normalized = `${body.trim()}\n`;
  const stepPath = path.join(resultsDir, fileName);
  writeUtf8Bom(stepPath, normalized);

  const divider = '#=========================================================';
  const section = [
    '',
    divider,
    `# ${title}`,
    divider,
    '',
    normalized.trim(),
    '',
  ].join('\n');

  fs.appendFileSync(resultPath, section, 'utf8');
  return stepPath;
}

export function appendNote(resultPath, title, body) {
  const section = [
    '',
    `## ${title}`,
    '',
    body.trim(),
    '',
  ].join('\n');

  fs.appendFileSync(resultPath, section, 'utf8');
}

export function resetResult(resultPath, projectName) {
  const header = [
    `# ${projectName} 결과 누적본`,
    '',
    `생성일: ${new Date().toLocaleString('ko-KR')}`,
    '',
  ].join('\n');
  writeUtf8Bom(resultPath, header);
}

export function readIfExists(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function writeUtf8Bom(filePath, text) {
  fs.writeFileSync(filePath, `${UTF8_BOM}${text}`, 'utf8');
}
