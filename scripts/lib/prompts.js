import fs from 'node:fs';
import path from 'node:path';
import { repoRoot } from './paths.js';

const promptsDir = path.join(repoRoot, 'prompts');

export function crAnalysisPrompt({ input, crText }) {
  return basePrompt('CR 분석', input, { crText }, readPrompt('00-cr-analysis.md'));
}

export function aopAnalysisPrompt({ input, aopText }) {
  return basePrompt('AOP 분석', input, { aopText }, readPrompt('00-aop-analysis.md'));
}

export function researchPrompt({ input, crAnalysis, aopAnalysis, accumulated }) {
  return basePrompt('시장조사', input, { crAnalysis, aopAnalysis, accumulated }, readPrompt('01-market-research.md'));
}

export function edgePrompt({ input, crAnalysis, aopAnalysis, accumulated }) {
  return basePrompt('Edge 추출', input, { crAnalysis, aopAnalysis, accumulated }, readPrompt('03-edge.md'));
}

export function finalMaterialsPrompt({ input, crAnalysis, aopAnalysis, accumulated }) {
  return basePrompt('기획안 요소 구성', input, { crAnalysis, aopAnalysis, accumulated }, readPrompt('04-final-materials.md'));
}

function basePrompt(taskName, input, context, instruction) {
  const template = readPrompt('base.md');
  return applyTemplate(template, {
    taskName,
    userInputRaw: input.raw,
    parsedInput: JSON.stringify(input.data, null, 2),
    context: renderContext(context),
    instruction,
  }).trim();
}

function readPrompt(fileName) {
  const filePath = path.join(promptsDir, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`프롬프트 파일을 찾을 수 없습니다: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '').trim();
}

function applyTemplate(template, values) {
  return Object.entries(values).reduce((text, [key, value]) => {
    return text.replaceAll(`{{${key}}}`, value ?? '');
  }, template);
}

function renderContext(context) {
  return Object.entries(context)
    .map(([key, value]) => `## ${key}\n${value || '없음'}`)
    .join('\n\n');
}
