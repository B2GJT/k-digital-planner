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
  ['강조 Edge', 'edgeNotes'],
  ['제외하고 싶은 표현', 'avoid'],
  ['제외하고 싶은 것', 'avoid'],
]);

/**
 * inputs.txt 파싱 규칙:
 *
 * - `#` 으로 시작하는 줄: 섹션 헤더 (주석) — 무시
 * - `^-{3,}` 줄: 필드 구분자 — 현재 필드 값 확정
 * - `key:` 줄: 새 필드 시작. `:` 뒤에 값이 있으면 첫 번째 줄 값으로 취급
 * - `* key` 줄: 레거시 필드 시작 (구 형식 호환)
 * - 그 외 줄: 현재 필드의 값 누적
 *
 * 필드 값: key 선언부터 다음 `----------` 사이의 내용을 trim 처리
 */
export function parseInputFile(inputPath) {
  const raw = fs.readFileSync(inputPath, 'utf8').replace(/^﻿/, '');
  const data = {};
  let currentKey = null;
  let buffer = [];

  function flush() {
    if (!currentKey) return;
    const value = buffer
      .join('\n')
      .split('\n')
      .map((l) => l.trimEnd())
      .join('\n')
      .trim();
    if (value) data[currentKey] = value;
    buffer = [];
  }

  for (const line of raw.split(/\r?\n/)) {
    // 섹션 헤더 (#===...) 또는 #으로 시작하는 주석 — 무시
    if (/^#/.test(line)) continue;

    // 필드 구분자 (--- 이상) — 현재 필드 확정
    if (/^-{3,}/.test(line)) {
      flush();
      currentKey = null;
      continue;
    }

    // key: 형식 — 새 필드 시작 (URL 패턴 https:// 등은 키로 인식하지 않음)
    const colonMatch = line.match(/^([^:#*\s][^:#]*?)\s*:\s*(.*)$/);
    if (colonMatch && !line.includes('://')) {
      flush();
      const label = colonMatch[1].trim();
      currentKey = KEY_ALIASES.get(label) ?? camelize(label);
      const inlineValue = colonMatch[2].trim();
      buffer = inlineValue ? [inlineValue] : [];
      continue;
    }

    // * key 형식 — 레거시 필드 시작
    const starMatch = line.match(/^\*\s*(.+)$/);
    if (starMatch) {
      flush();
      const label = starMatch[1].trim();
      currentKey = KEY_ALIASES.get(label) ?? camelize(label);
      buffer = [];
      continue;
    }

    // 값 누적 (현재 필드가 있을 때만)
    if (currentKey) {
      buffer.push(line);
    }
  }

  // 마지막 필드 처리 (구분자 없이 파일이 끝나는 경우)
  flush();

  return { raw, data };
}

function camelize(value) {
  return value
    .trim()
    .replace(/[^\p{L}\p{N}]+(.)/gu, (_, chr) => chr.toUpperCase())
    .replace(/^[A-Z]/, (chr) => chr.toLowerCase());
}
