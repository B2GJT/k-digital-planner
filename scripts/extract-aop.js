import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectDir, ensureProjectLayout, requireInputFile } from './lib/paths.js';
import { parseInputFile } from './lib/input.js';

async function main() {
  const projectDir = resolveProjectDir(process.argv[2]);
  const layout = ensureProjectLayout(projectDir);
  requireInputFile(layout.inputPath);

  const { data } = parseInputFile(layout.inputPath);
  const url = data.aopLink;

  if (!url) {
    const message = 'AOP 링크가 inputs.txt에 없습니다. AOP 분석은 inputs.txt의 직접 입력값을 중심으로 진행됩니다.';
    writeAop(layout, { url: '', title: '', text: message, warning: message });
    console.log(message);
    return;
  }

  try {
    const response = await fetch(url, {
      headers: { 'user-agent': 'Mozilla/5.0 K-Digital-Planner/1.0' },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const title = extractTitle(html);
    const text = htmlToText(html);
    writeAop(layout, { url, title, text });
    console.log('AOP extracted: extracted/aop.txt, extracted/aop.json');
  } catch (err) {
    const message = `AOP 페이지 추출 실패: ${err.message}`;
    writeAop(layout, { url, title: '', text: message, warning: message });
    console.log(message);
  }
}

function writeAop(layout, data) {
  const text = [
    `URL: ${data.url || '없음'}`,
    `Title: ${data.title || '없음'}`,
    '',
    data.text || '추출 내용 없음',
    '',
  ].join('\n');

  fs.writeFileSync(path.join(layout.extractedDir, 'aop.txt'), text, 'utf8');
  fs.writeFileSync(path.join(layout.extractedDir, 'aop.json'), JSON.stringify(data, null, 2), 'utf8');
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeHtml(match[1]).trim() : '';
}

function htmlToText(html) {
  return decodeHtml(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<\/(p|div|section|article|li|tr|h[1-6])>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  )
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .slice(0, 30000);
}

function decodeHtml(value) {
  return String(value)
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
