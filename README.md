# K-디지털 기획안 생성기

K-디지털 기초역량 훈련 과정의 **기획안 초안을 자동으로 생성**해주는 웹 애플리케이션입니다.
팀 내 기획 담당자가 링크 공유만으로 바로 사용할 수 있습니다.

## 주요 기능

- 6단계 스텝 방식으로 기획 정보를 순차 입력
- AI(Claude Sonnet)가 시장조사 · 타겟 페르소나 · Edge 후보 · 기획안 초안 자동 생성
- 생성된 기획안 텍스트 화면 출력 및 복사 지원

## 사용 흐름

| 단계 | 내용 |
|------|------|
| 1단계 | 기본 정보 입력 (과정명, 카테고리, 담당자 등) |
| 2단계 | 시장조사 AI 생성 |
| 3단계 | 타겟 페르소나 AI 생성 |
| 4단계 | 구성 방향 입력 (커리큘럼, 강사, 러닝타임 등) |
| 5단계 | Edge 후보 AI 생성 |
| 6단계 | 최종 기획안 초안 AI 생성 |

## 기술 스택

- **Frontend:** React 18, Vite, Tailwind CSS
- **AI:** Claude API (claude-sonnet-4-6)
- **배포:** Vercel (서버리스 함수)

## 로컬 실행 방법

```bash
# 패키지 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일에 GROQ_API_KEY 입력

# 개발 서버 실행
npm run dev
```

## 환경 변수

| 변수명 | 설명 |
|--------|------|
| `ANTHROPIC_API_KEY` | Anthropic API 키 ([console.anthropic.com](https://console.anthropic.com)에서 발급) |

## 주의사항

- 인증 없이 링크만으로 접근 가능한 내부 도구입니다.
- AI 출력 결과는 초안으로, 담당자가 검토 후 수정하여 사용하세요.
