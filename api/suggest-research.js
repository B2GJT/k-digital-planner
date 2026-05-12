import { setCors, handleOptions } from './_lib/cors.js';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `당신은 K-디지털 기초역량 훈련 과정 기획 전문가입니다.
주어진 과정 정보를 바탕으로 시장 현황과 트렌드를 분석해주세요.
반드시 아래 형식의 마크다운으로 출력하세요:

## 시장/트렌드 분석
- 관련 기술·자격증 수요 현황 (구체적 수치 포함)
- 취업 시장 내 해당 스킬 우대 현황

## 유사 과정 경쟁 현황
- 국비지원 시장 내 유사 과정 현황
- 주요 훈련기관 및 훈련비 단가 수준

## 경쟁사 분석
- B2C 시장 주요 경쟁사 과정 특징
- 가격대 및 주요 소구점 비교`;

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { title, category } = req.body;
  if (!title) return res.status(400).json({ error: '과정명을 입력해주세요.' });

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      temperature: 0.3,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `과정명: ${title}\n카테고리: ${category || ''}`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === 'text');
    return res.status(200).json({
      summary: textBlock?.text ?? '',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
