import { setCors, handleOptions } from './_lib/cors.js';
import Groq from 'groq-sdk';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { title, category, marketResearch, persona } = req.body;
  if (!title) return res.status(400).json({ error: '과정명을 입력해주세요.' });

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `당신은 K-디지털 기초역량 훈련 과정 기획 전문가입니다.
과정 정보, 시장조사, 타겟 페르소나를 바탕으로 상품 소구점(Edge) 후보를 생성해주세요.

규칙:
- "체계적인 커리큘럼", "전문 강사진", "실습 위주", "현장 중심" 등 추상적 표현 금지
- 반드시 구체적 숫자·비교 근거 포함
- 타겟 페르소나의 페인포인트를 직접 해소하는 문구 위주

반드시 아래 JSON만 출력 (코드블록 없이 순수 JSON):
{
  "edges": [
    "소구점 문구 1",
    "소구점 문구 2",
    "소구점 문구 3",
    "소구점 문구 4",
    "소구점 문구 5"
  ]
}`,
        },
        {
          role: 'user',
          content: `과정명: ${title}
카테고리: ${category || ''}

시장조사:
${marketResearch?.trim() || '없음'}

타겟 페르소나:
메인: ${persona?.mainPersona || '미입력'}
서브: ${persona?.subPersona || '미입력'}
페인포인트: ${persona?.painPoints || '미입력'}`,
        },
      ],
      max_tokens: 600,
      temperature: 0.5,
    });

    const text = completion.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'AI 응답 파싱 실패' });

    return res.status(200).json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
