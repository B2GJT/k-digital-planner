import fs from 'node:fs';

const KEY_ALIASES = new Map([
  ['과정명', 'title'],
  ['강의명', 'title'],
  ['카테고리', 'category'],
  ['AOP 링크', 'aopLink'],
  ['AOP', 'aopLink'],
  ['강사', 'instructor'],
  ['러닝타임', 'runtime'],
  ['학습시간', 'runtime'],
  ['커리큘럼', 'curriculum'],
  ['파이널 프로젝트', 'finalProject'],
  ['최종 프로젝트', 'finalProject'],
  ['기획 메모', 'direction'],
  ['강조하고 싶은 Edge', 'edgeNotes'],
  ['제외하고 싶은 표현', 'avoid'],
]);

export function parseInputFile(inputPath) {
  const raw = fs.readFileSync(inputPath, 'utf8');
  const data = {};
  let currentKey = null;

  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^([^:#]+)\s*:\s*(.*)$/);
    if (match) {
      const label = match[1].trim();
      currentKey = KEY_ALIASES.get(label) || camelize(label);
      data[currentKey] = match[2].trim();
      continue;
    }

    if (currentKey && line.trim()) {
      data[currentKey] = `${data[currentKey]}\n${line.trim()}`.trim();
    }
  }

  return { raw, data };
}

function camelize(value) {
  return value
    .trim()
    .replace(/[^\p{L}\p{N}]+(.)/gu, (_, chr) => chr.toUpperCase())
    .replace(/^[A-Z]/, (chr) => chr.toLowerCase());
}
