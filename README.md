# K-Digital Planner

로컬에서 `inputs.txt`, AOP 링크, CR xlsx 파일을 읽어 K-디지털 교육과정 기획 자료를 단계별로 생성하는 배치 기반 파이프라인입니다. AI 생성은 API 키가 아니라 로그인된 `codex` CLI의 `codex exec`를 사용합니다.

## 구조

```text
k-digital-planner/
├─ projects/
│  ├─ README.md
│  └─ sample-project/
│     ├─ inputs.txt
│     ├─ cr.xlsx                 # 선택: 있으면 자동 추출
│     ├─ extracted/
│     │  ├─ cr.txt / cr.json
│     │  └─ aop.txt / aop.json
│     ├─ results/
│     │  ├─ 01-cr-analysis.md
│     │  ├─ 02-aop-analysis.md
│     │  ├─ 03-market-research.md
│     │  ├─ 04-edge.md
│     │  ├─ 05-plan-materials.md
│     │  └─ result.txt
│     └─ run.bat
├─ logs/
│  └─ sample-project/
│     ├─ error-*.log
│     └─ prompt-*.md
├─ prompts/
│  ├─ base.md
│  ├─ 00-cr-analysis.md
│  ├─ 00-aop-analysis.md
│  ├─ 01-market-research.md
│  ├─ 03-edge.md
│  └─ 04-final-materials.md
├─ scripts/
│  ├─ select-project.js
│  ├─ run-project.js
│  ├─ extract-cr.js
│  ├─ extract-aop.js
│  └─ ...
└─ run-project.bat
```

## 실행

루트의 `run-project.bat`을 실행하면 `projects` 폴더를 스캔해 실행 가능한 프로젝트 목록을 보여줍니다.

목록에 표시되는 조건은 다음 두 가지입니다.

- 프로젝트 폴더 안에 `inputs.txt`가 있어야 함
- 프로젝트 폴더 안에 `.xlsx` 파일이 하나 이상 있어야 함

조건을 만족하지 않는 폴더는 선택 메뉴에 표시되지 않습니다.

```bat
run-project.bat
```

개별 프로젝트 폴더 안의 `run.bat`은 해당 프로젝트를 바로 실행하는 용도입니다.

## Codex CLI 확인

AI 분석 단계는 `codex exec`를 사용합니다. 실행 전에 PowerShell에서 아래 명령이 동작하는지 확인하세요.

```powershell
& "$env:APPDATA\npm\codex.cmd" exec --skip-git-repo-check "Return exactly: OK"
```

PowerShell 실행 정책 때문에 `codex.ps1`이 막히는 경우가 있으므로 Windows에서는 `codex.cmd`로 확인하는 것을 권장합니다.

`codex.cmd` 명령을 찾을 수 없다는 메시지가 나오면 Codex CLI가 PATH에 등록되어 있지 않은 상태입니다. 이 경우 아래 중 하나로 해결합니다.

1. `npm.cmd install -g @openai/codex`로 Codex CLI를 설치합니다.
2. `& "$env:APPDATA\npm\codex.cmd" login`으로 로그인합니다.
3. 예전에 `CODEX_CLI`를 WindowsApps 내부 경로로 지정했다면 제거합니다.

예시:

```powershell
reg delete HKCU\Environment /v CODEX_CLI /f
```

프로젝트 코드는 `codex.cmd`, npm 전역 설치 경로, `CODEX_CLI` 환경변수, `codex.exe`, `codex` 명령, Windows 앱 별칭, 설치된 Appx 패키지 경로를 순서대로 찾아 사용합니다. WindowsApps 내부의 `codex.exe`는 접근 권한 문제를 일으킬 수 있으므로 npm으로 설치된 `codex.cmd` 사용을 우선합니다.

## 결과물 흐름

1. CR xlsx 추출: `extracted/cr.txt`, `extracted/cr.json`
2. AOP 페이지 추출: `extracted/aop.txt`, `extracted/aop.json`
3. CR 분석 결과: 러닝타임, 커리큘럼, 학습 목표, 참고사항
4. AOP 분석 결과: 강사, 강의 주요 포인트, 주요 내용, 기획안 구성 요청 시 전달할 내용
5. 시장조사 결과
6. Edge 추출 결과
7. 기획안 요소 구성 결과

전체 누적 결과는 `results/result.txt`에 저장됩니다.

실패 로그와 Codex 전달 프롬프트는 프로젝트 결과 폴더가 아니라 루트의 `logs/<프로젝트폴더명>/`에 저장됩니다. 예: `projects/Gemini 바이블` 실행 로그는 `logs/Gemini 바이블/`에 저장됩니다.

## 프롬프트 수정

각 단계의 Codex 지침은 루트의 `prompts/` 폴더에 있는 Markdown 파일에서 읽습니다.

- `base.md`: 모든 단계에 공통으로 적용되는 기본 지침과 입력/컨텍스트 삽입 위치
- `00-cr-analysis.md`: CR 분석 단계 지침
- `00-aop-analysis.md`: AOP 분석 단계 지침
- `01-market-research.md`: 시장조사 단계 지침
- `03-edge.md`: Edge 추출 단계 지침
- `04-final-materials.md`: 기획안 요소 구성 단계 지침

`base.md`에서는 `{{taskName}}`, `{{userInputRaw}}`, `{{parsedInput}}`, `{{context}}`, `{{instruction}}` 자리표시자를 사용합니다. 개별 단계 파일은 일반 Markdown으로 작성하면 됩니다.

## 입력 가이드

프로젝트별 입력 구성과 카테고리 목록은 [projects/README.md](projects/README.md)를 참고하세요.
