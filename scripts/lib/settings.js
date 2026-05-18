import fs from 'node:fs';
import path from 'node:path';

// 단계별 기본값 (settings.txt 없을 때 전부 활성화)
const DEFAULTS = {
  'CR추출':    true,
  'AOP추출':   true,
  'CR분석':    true,
  'AOP분석':   true,
  '시장조사':  true,
  'Edge추출':  true,
  '기획안구성': true,
};

/**
 * 프로젝트 디렉토리의 settings.txt를 읽어 단계별 실행 여부를 반환합니다.
 * settings.txt가 없으면 모든 단계를 활성화합니다.
 *
 * 파일 형식:
 *   # 주석
 *   CR분석: T      ← 실행
 *   시장조사: F    ← 건너뜀
 */
export function loadSettings(projectDir) {
  const settingsPath = path.join(projectDir, 'settings.txt');
  const settings = { ...DEFAULTS };

  if (!fs.existsSync(settingsPath)) {
    return settings;
  }

  const content = fs.readFileSync(settingsPath, 'utf8').replace(/^﻿/, '');

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^(.+?)\s*:\s*(T|F)\s*$/i);
    if (!match) continue;

    const key = match[1].trim();
    const enabled = match[2].toUpperCase() === 'T';

    if (key in DEFAULTS) {
      settings[key] = enabled;
    } else {
      console.warn(`[settings.txt] 알 수 없는 단계 키: "${key}" (무시됨)`);
    }
  }

  return settings;
}
