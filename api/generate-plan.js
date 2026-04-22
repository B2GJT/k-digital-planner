import { setCors, handleOptions } from './_lib/cors.js';
import Groq from 'groq-sdk';

const SYSTEM_PROMPT = `당신은 K-디지털 기초역량 훈련 과정 기획 전문가입니다.

K-디지털 기초역량 훈련은 고용노동부에서 지원하는 국민내일배움카드 기반의 디지털 직업훈련 사업으로,
재직자와 구직자의 디지털 기초역량 향상을 목표로 합니다.

생성 규칙:
- 사람이 직접 입력하는 항목(강사·러닝타임·커리큘럼·파이널프로젝트·링크)은 "직접 입력 필요"로만 표시, 임의 생성 금지
- 단, 사용자가 입력한 값이 있으면 그 값을 그대로 사용

품질 기준:
1. 페인포인트: 실제 수강생이 할 법한 구체적 1인칭 구어체 문장
   Bad: "디지털 역량이 부족하다"
   Good: "팀장이 'GA 데이터 뽑아봐' 하는데 GA가 뭔지도 모른다"
   Good: "Python이라고? 뱀 아닌가요... 코딩은 개발자들만 하는 줄 알았다"

2. 상품 Edge: 금지 표현("체계적인 커리큘럼","전문 강사진","실습 위주","현장 중심") 절대 사용 금지
   반드시 구체적 숫자·비교 근거 포함
   Good: "현직 마케터가 실제 쓰는 GA4 대시보드 템플릿 15개 즉시 다운로드"

3. 홍보용 과정명: 타겟 대상과 혜택이 명확한 이름 3개

반드시 아래 JSON만 출력 (코드블록 없이 순수 JSON):
{
  "section01": {
    "marketTrend": "시장/트렌드 분석 (bullet 형식, 구체적 수치 포함)",
    "competitorAnalysis": "국비지원 유사 과정 경쟁 현황",
    "competitorComparison": "B2C 경쟁사 비교 분석"
  },
  "section02": {
    "mainPersona": {
      "name": "페르소나 이름",
      "definition": "정의 2~3문장",
      "rationale": "선정 근거 2~3문장",
      "painPoints": ["1인칭 문장1", "1인칭 문장2", "1인칭 문장3"],
      "outcomes": "수료 후 기대 결과물"
    },
    "subPersona": {
      "name": "서브 페르소나 이름",
      "definition": "정의 1~2문장",
      "painPoints": ["1인칭 문장1", "1인칭 문장2"]
    }
  },
  "section03": {
    "aopLink": "직접 입력 필요",
    "titleCandidates": ["후보1", "후보2", "후보3"],
    "instructor": "직접 입력 필요",
    "runtime": "직접 입력 필요",
    "curriculum": "직접 입력 필요",
    "finalProject": "직접 입력 필요",
    "mainEdge": "메인 Edge (구체적 수치·차별화 근거, 2~3문장)",
    "subEdges": ["서브 Edge1", "서브 Edge2", "서브 Edge3"]
  }
}`;

function buildUserMessage(data) {
  const edgeSection = data.edgeCandidates?.length
    ? data.edgeCandidates.map((e, i) => `${i + 1}. ${e}`).join('\n')
    : '없음';

  return `아래 정보를 바탕으로 K-디지털 기초역량 훈련 과정 기획안 초안을 생성해주세요.

[기본 정보]
강의명: ${data.basicInfo.title}
카테고리: ${data.basicInfo.category}
작성자: ${data.basicInfo.author || ''}

[시장조사 메모]
${data.marketResearch?.trim() || '없음 — 자체 지식 기반으로 생성'}

[상품 Edge 후보]
${edgeSection}

[타겟 페르소나]
메인: ${data.persona.mainPersona || '미입력'}
서브: ${data.persona.subPersona || '미입력'}
페인포인트 힌트: ${data.persona.painPoints || '미입력'}

[상세페이지 구성 방향]
AOP 링크: ${data.detailPage.aopLink || '직접 입력 필요'}
강사: ${data.detailPage.instructor || '직접 입력 필요'}
러닝타임: ${data.detailPage.runtime || '직접 입력 필요'}
커리큘럼: ${data.detailPage.curriculum || '직접 입력 필요'}
파이널 프로젝트: ${data.detailPage.finalProject || '직접 입력 필요'}
기획 메모: ${data.detailPage.direction || '없음'}`;
}

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const data = req.body;
  if (!data?.basicInfo?.title) {
    return res.status(400).json({ error: '과정명이 누락되었습니다.' });
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserMessage(data) },
      ],
      max_tokens: 4096,
      temperature: 0.4,
    });

    const text = completion.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(200).json({ success: false, rawText: text, error: 'JSON 파싱 실패' });
    }

    const plan = JSON.parse(jsonMatch[0]);

    // section00: 사용자 입력값 그대로
    plan.section00 = {
      title: data.basicInfo.title,
      category: data.basicInfo.category,
      planLink: data.basicInfo.planLink || '직접 입력 필요',
      crLink: data.basicInfo.crLink || '직접 입력 필요',
      author: data.basicInfo.author || '',
    };

    // 사용자가 직접 입력한 항목 덮어쓰기
    if (data.detailPage.instructor) plan.section03.instructor = data.detailPage.instructor;
    if (data.detailPage.runtime) plan.section03.runtime = data.detailPage.runtime;
    if (data.detailPage.curriculum) plan.section03.curriculum = data.detailPage.curriculum;
    if (data.detailPage.finalProject) plan.section03.finalProject = data.detailPage.finalProject;
    if (data.detailPage.aopLink) plan.section03.aopLink = data.detailPage.aopLink;

    return res.status(200).json({
      success: true,
      plan,
      usage: {
        inputTokens: completion.usage?.prompt_tokens ?? 0,
        outputTokens: completion.usage?.completion_tokens ?? 0,
        totalTokens: completion.usage?.total_tokens ?? 0,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
