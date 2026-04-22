import { setCors, handleOptions } from './_lib/cors.js';
import Groq from 'groq-sdk';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { title, category } = req.body;
  if (!title) return res.status(400).json({ error: '과정명을 입력해주세요.' });

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `당신은 K-디지털 기초역량 훈련 과정 기획 전문가입니다.
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
- 가격대 및 주요 소구점 비교`,
        },
        {
          role: 'user',
          content: `과정명: ${title}\n카테고리: ${category || ''}`,
        },
      ],
      max_tokens: 1500,
      temperature: 0.3,
    });

    return res.status(200).json({
      summary: completion.choices[0].message.content,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
