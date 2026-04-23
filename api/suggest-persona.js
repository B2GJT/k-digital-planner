import { setCors, handleOptions } from './_lib/cors.js';
import Groq from 'groq-sdk';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { title, category, marketResearch } = req.body;
  if (!title) return res.status(400).json({ error: '과정명을 입력해주세요.' });

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `당신은 K-디지털 기초역량 훈련 과정 기획 전문가입니다.
과정 정보와 시장조사 내용을 바탕으로 타겟 페르소나 초안을 작성해주세요.

반드시 아래 JSON만 출력 (코드블록 없이 순수 JSON):
{
  "mainPersona": "직군·연차·현재 디지털 역량 수준·왜 이 과정이 필요한지 2~3문장",
  "subPersona": "메인 외 잠재 수강생 유형 1~2문장",
  "painPoints": "수강생이 겪는 어려움·니즈 키워드 3~5개 (쉼표 구분)"
}`,
        },
        {
          role: 'user',
          content: `과정명: ${title}\n카테고리: ${category || ''}\n\n시장조사:\n${marketResearch?.trim() || '없음'}`,
        },
      ],
      max_tokens: 800,
      temperature: 0.4,
    });

    const text = completion.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'AI 응답 파싱 실패' });

    return res.status(200).json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
