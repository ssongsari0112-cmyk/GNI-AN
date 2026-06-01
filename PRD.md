# GNI-AN (지니안) — Product Requirements Document

> 버전: v1.0 | 최종 업데이트: 2026-06-01  
> 굿네이버스 KOICA 시민사회협력사업 제안서 AI 작성 도구

---

## 1. 서비스 개요

**GNI-AN(지니안)** 은 굿네이버스 임직원이 KOICA 시민사회협력사업 제안서를 AI와 함께 단계별로 작성할 수 있는 내부 웹 서비스입니다.

- **기술 스택**: Next.js 16 (App Router, TypeScript), Tailwind CSS v4, Zustand, TipTap, OpenAI GPT-4o-mini
- **AI 모델**: OpenAI `gpt-4o-mini` (API 라우트에서만 호출 — 키 클라이언트 노출 없음)
- **상태 관리**: Zustand `persist` — 전체 프로젝트 데이터 localStorage 자동 저장
- **배포**: Vercel (GitHub 연동 자동 배포)
- **컬러 시스템**: 올리브 그린 `#8AA81E` / Hover `#799516` / Light `#EEF5D6` / Border `#D9E6B7` / BG `#F7F8F2`
- **Base URL**: 모든 경로 `/gni-an` 하위

---

## 2. 사용자 플로우

```
홈 (/gni-an)
 └─ 프로그램 선택 (/gni-an/project/new)
     └─ 사업 유형 선택 (/gni-an/project/civil-society)
         └─ [기획 4단계]
             1. 아이디어 입력 (/gni-an/ideation)
             2. 전문가 컨설팅 (/gni-an/ideation/experts)
             3. 사업 구조화 (/gni-an/ideation/structure)
             4. 사업개요서 (/gni-an/ideation/summary)
         └─ 프로젝트 생성 (/gni-an/create)
             └─ 제안서 작성 (/gni-an/proposal/[section])  — 17개 섹션
                 └─ PDF 미리보기 (/gni-an/proposal/pdf-preview)
```

---

## 3. 페이지 상세 명세

### 3.1 홈 (`/gni-an`)

- 올리브 그린 헤더 + 히어로 섹션
- CTA 버튼: 새 프로젝트 시작하기 / 기존 프로젝트 불러오기
- 기능 소개 카드 3개: AI 전문가 / KOICA 기준 최적화 / 원클릭 내보내기
- 우하단 AI 챗봇 플로팅 버튼 (전역 고정)

### 3.2 프로그램 선택 (`/gni-an/project/new`)

- 3열 카드 레이아웃
- **국별협력사업(PMC)** — 준비 중
- **시민사회협력사업** — 활성 (진입형/성장형/전략형/인도민협)
- **특수사업(CTS, IBS)** — 준비 중
- 각 카드: 아이콘 + 설명 + 태그 + CTA 버튼

### 3.3 사업 유형 선택 (`/gni-an/project/civil-society`)

- 2×2 카드 그리드
- 4개 유형 모두 활성: **진입형(2년)** / **성장형(2~3년)** / **전략형(5년~)** / **인도민협(HDP-N, Nexus)**
- 각 카드: 아이콘 + 기간 배지 + 설명 + 특징 bullet 2행 + "이 유형으로 시작하기 →"
- 어떤 유형 클릭해도 동일하게 아이디어 입력 페이지로 이동

### 3.4 아이디어 입력 (`/gni-an/ideation`)

**레이아웃**: 좌측 입력 폼 + 우측 AI 작성 도우미 (고정) + 하단 버튼 고정 (`h-screen`)

**필수 입력**:
- 사업 분야: 12개 칩 선택 (교육/보건/농업·식량/식수·위생/거버넌스/환경·기후/경제·소득/젠더/도시·주거/인도적지원/직업훈련/기타)
- 대상 국가: 커스텀 모달 — 지역 탭(전체/아시아/아프리카/중남미/중동/CIS/오세아니아) + 검색 + 직접 입력, 2열 ISO 코드 표시 (총 60개국+)
- 사업 아이디어: 최소 50자, 삼각형 토글 작성예시 (교육/지역개발/인도적지원 3개)

**선택 입력**: 세부 지역 (50자 제한) / 주요 수혜자 / 총사업비 (쉼표 자동 포맷) / 예상 기간 (개월)

**AI 작성 도우미** (우측 패널):
- GPT-4o-mini 스트리밍 채팅
- 빠른 질문 버튼: 핵심 문제 분석해줘 / 현지 파트너 관점 점검 / 비슷한 사례 예시 / 보완할 부분은?
- 현재 작성 중인 폼 데이터를 컨텍스트로 자동 전달

**AI 분석 시작** 버튼: 아이디어 분석 + 전문가 생성 병렬 API 호출

### 3.5 전문가 컨설팅 (`/gni-an/ideation/experts`)

- 좌측 전문가 아이콘 바 (4명) + 우측 채팅창 (`h-screen` 고정)
- 전문가 4인: **분야 전문가(F)** / **지역 전문가(R)** / **사업기획 전문가(P)** / **M&E 전문가(M)**
- 각 전문가 진입 시 자기소개 메시지 자동 표시 (경력/전문 분야 + 사용자 아이디어 확인)
- 질문 가이드 토글 (4개 질문, 클릭 시 입력창에 자동 삽입)
- 상담 완료: 메시지 1개 이상 전송 후 활성화
- 4명 모두 완료 시 "다음 단계" 버튼 활성화
- 상단 이전 단계 네비게이션 클릭 가능 (✓ 아이디어 클릭 시 복귀)

### 3.6 사업 구조화 (`/gni-an/ideation/structure`)

**인사이트 자동 추출**: 페이지 진입 시 컨설팅 데이터 기반으로 자동 추출 시작, 전구 버튼 "인사이트 추출 중..." 표시

**전구 버튼 (인사이트 패널)**:
- 5개 카테고리별 색상 카드: 문제정의(빨강)/수혜자(파랑)/개입전략(초록)/리스크(주황)/지속가능성(보라)
- 신뢰도 배지: 높음/보통/참고용

**AI 구조 생성**: 문제분석 + 목표체계 + PDM 자동 생성

**탭 3개 (모두 인라인 편집 가능)**:

*문제분석 (Problem Tree)*:
- 결과(Effects): 추가/편집/삭제
- 핵심문제(Core Problem): 편집
- 직접 원인: 추가/편집/삭제
- 근본 원인: 추가/편집/삭제

*목표체계 (Objective Tree)*:
- Impact / Purpose: 편집
- 성과(Outcome): 추가/편집/삭제
- 산출물(Output): 성과 아래 추가/편집/삭제
- 활동(Activity): 추가/편집/삭제

*PDM 초안*:
- 모든 행 (narrative/지표/검증수단/가정) 인라인 편집
- Impact/Purpose: 삭제 불가 (고정)
- Outcome: 삭제 가능 + 산출물 추가 버튼
- 성과(Outcome) 행 추가 버튼

### 3.7 사업개요서 (`/gni-an/ideation/summary`)

- 상단 상태 바: 분야 / 대상국 / 전문가 상담 완료 수 / 성과 수
- AI 생성 후 6개 섹션 표시 (hover 시 편집 버튼):
  - 기본정보 (사업명 + 요약)
  - 사업 배경 + 수요 분석
  - 사업 목적 (Impact/Purpose/성과 목록)
  - 수혜자 (직접/간접)
  - 수행 방법 + 파트너십
  - 리스크 + 지속가능성

### 3.8 프로젝트 생성 (`/gni-an/create`)

- 아이디어 데이터 자동 pre-fill
- 필수: 사업명 / 기관명 / 대상국
- 선택: 사업 기간 / 총사업비

### 3.9 제안서 작성 (`/gni-an/proposal/[section]`)

**레이아웃**: 3컬럼 — 좌측 사이드바(240px) + 중앙 에디터 + 우측 AI 도우미(visible on xl+)

**사이드바**:
- 17개 섹션 목록 + 상태 아이콘 (○ 미작성 / ! 작성중 / ✓ 완료)
- 진행률 바 + 품질 라벨 (완료/양호/보통/미흡/매우 미흡)
- GNI-AN 로고 링크

**에디터 (TipTap)**:
- 툴바: Undo/Redo / Bold/Italic/Underline/Strike / H1/H2/H3 / Bullet/Ordered List / Left/Center/Right align / 표 삽입 / 복사
- 글자 수 카운터 + 권장 범위 표시
- 완료 표시 버튼

**AI 도우미 (우측)**:
- 섹션별 빠른 질문 버튼 4개
- 스트리밍 채팅 (GPT-4o-mini)
- 현재 섹션 내용 + 프로젝트 컨텍스트 자동 전달

**17개 섹션**:

| 코드 | 제목 | 권장 글자 |
|------|------|----------|
| I-1 가 | 사업배경 | 1,000~2,500자 |
| I-1 나 | 사업 수요 | 800~2,000자 |
| I-1 다 | 이해관계자 식별 및 분석 | 600~1,500자 |
| I-1 라 | 문제분석 | 800~2,000자 |
| I-1 마 | 목표분석 | 600~1,500자 |
| I-1 바 | 파트너기관 자체 평가 결과 | 500~1,500자 |
| I-2 가 | 사업 논리 모형(PDM) | — |
| I-2 나 | 세부 추진방안 | 1,500~4,000자 |
| I-2 다 | 사업 지속가능성 전략 | 800~2,000자 |
| I-2 라 | 범분야 이슈 고려 | 500~1,500자 |
| II-1 | 사업 운영 조직 | 1,500~3,500자 |
| II-2 | 예산 | — |
| II-3 | 회계 프로그램 운용 현황 | 300~800자 |
| III-1 | 사업 이행 모니터링 및 성과 평가 | 800~2,000자 |
| III-2 | 종료평가 관련 준비 예정 사항 | 400~1,000자 |
| III-3 | 위험관리계획 | 600~1,500자 |
| III-4 | 부문별 상세 사업 추진 일정 | — |

**특수 섹션**:
- **I-2 가 (PDM)**: 구조화 단계에서 생성된 PDM 데이터 트리뷰 표시
- **II-2 (예산)**: 파일 업로드 (드래그앤드롭)
- **III-4 (일정)**: 간트 차트 스타일 월별 드래그 선택

### 3.10 PDF 미리보기 (`/gni-an/proposal/pdf-preview`)

미리보기 버튼(상단 우측) 클릭 시 접근

**구성**:
1. **표지**: 국가명(굵게) + 사업명 + 예산/기간이 든 테두리 박스 + 굿네이버스 / 날짜
2. **목차**: 17개 섹션 목록 (● 작성완료 / ○ 미작성)
3. **사업개요**: AI 생성 개요서 전체
4. **PDM 테이블**: 프로젝트요약/내용/지표/지표증명수단/가정 5열 테이블
5. **17개 섹션**: Part별 헤더 + 각 섹션 내용 (TipTap HTML 렌더링)

**인쇄/PDF 저장**: 브라우저 인쇄 (`window.print()`) → PDF로 저장, A4 용지 설정

---

## 4. AI 기능 명세

### 4.1 API 엔드포인트

| 엔드포인트 | 방식 | 기능 |
|-----------|------|------|
| `POST /api/gni-an/ideation/analyze` | 단발 | 아이디어 분석 → coreProblem/수혜자/개입방안/성과/전문가추천/인사이트 |
| `POST /api/gni-an/consulting/experts/generate` | 단발 | 전문가 4명 생성 (분야별 질문 가이드 포함) |
| `POST /api/gni-an/consulting/chat` | 스트리밍 | 전문가 페르소나 채팅 |
| `POST /api/gni-an/structure/generate` | 단발 | 문제트리/목표체계/PDM/인사이트 JSON 생성 |
| `POST /api/gni-an/insights/generate` | 단발 | 컨설팅 기반 인사이트 5개 추출 |
| `POST /api/gni-an/summary/generate` | 단발 | 사업개요서 6개 섹션 생성 |
| `POST /api/gni-an/proposal/section/review` | 스트리밍 | 섹션별 AI 검토 |
| `POST /api/gni-an/chat` | 스트리밍 | 일반 AI 어시스턴트 (챗봇 + 아이디어 도우미) |

### 4.2 AI 설정

- **모델**: `gpt-4o-mini`
- **구현 파일**: `src/lib/api/openai.ts`
- **JSON 파싱**: `src/lib/parseJSON.ts` — 마크다운 코드블록 제거 + 문자열 내 제어문자 이스케이프
- **프롬프트**: `src/lib/prompts.ts` — 시스템 프롬프트 중앙화 (Turbopack 한글 충돌 방지)
- **API 키 미설정 시**: 목 데이터 반환 → 전체 플로우 탐색 가능

---

## 5. 상태 관리 (Zustand Store)

`src/lib/store/projectStore.ts` — localStorage에 자동 persist

| 상태 | 타입 | 설명 |
|------|------|------|
| `project` | `Project \| null` | 프로젝트 기본 정보 |
| `ideation` | `IdeationData \| null` | 아이디어 입력 데이터 |
| `ideationAnalysis` | `IdeationAnalysis \| null` | AI 분석 결과 |
| `experts` | `Expert[]` | 전문가 4인 정보 |
| `expertSessions` | `ExpertSession[]` | 전문가별 채팅 내역 |
| `structure` | `StructureData \| null` | 문제트리/목표체계/PDM |
| `summary` | `ProjectSummary \| null` | 사업개요서 데이터 |
| `sections` | `Record<SectionId, ProposalSection>` | 17개 섹션 내용/상태/글자수 |
| `insights` | `Insight[]` | AI 인사이트 5개 |
| `scheduleActivities` | `ScheduleActivity[]` | 사업 일정 |
| `budgetFile` | `string \| null` | 예산 파일 |

---

## 6. 전역 컴포넌트

### 6.1 AI 챗봇 (`src/components/ui/ChatBot.tsx`)
- 우하단 플로팅 버튼 (모든 페이지 고정)
- 클릭 시 채팅창 열림
- 빠른 질문: PDM 작성 방법 / KOICA 심사 기준 / 수혜자 분석
- 스트리밍 응답 + 대화 초기화

### 6.2 StepHeader (`src/components/layout/StepHeader.tsx`)
- 기획 4단계 진행 상태 표시 (아이디어→컨설팅→구조화→개요서)
- 완료된 이전 단계 클릭 시 해당 페이지로 이동 가능

### 6.3 ProposalLayout (`src/components/layout/ProposalLayout.tsx`)
- 제안서 섹션 공통 3컬럼 레이아웃
- 상단 바: 섹션 상태 + 미리보기 + PDF 저장 버튼

---

## 7. 파일 구조

```
src/
├── app/
│   ├── api/gni-an/          # API 라우트 (서버사이드)
│   │   ├── chat/
│   │   ├── consulting/chat/
│   │   ├── consulting/experts/generate/
│   │   ├── ideation/analyze/
│   │   ├── insights/generate/
│   │   ├── proposal/section/review/
│   │   ├── structure/generate/
│   │   └── summary/generate/
│   └── gni-an/              # 페이지 라우트
│       ├── page.tsx          # 홈
│       ├── project/new/      # 프로그램 선택
│       ├── project/civil-society/  # 유형 선택
│       ├── ideation/         # 아이디어
│       ├── ideation/experts/ # 컨설팅
│       ├── ideation/structure/ # 구조화
│       ├── ideation/summary/ # 개요서
│       ├── create/           # 프로젝트 생성
│       └── proposal/         # 17개 섹션 + pdf-preview
├── components/
│   ├── editors/RichTextEditor.tsx
│   ├── layout/ProposalLayout.tsx
│   ├── layout/StepHeader.tsx
│   ├── proposal/SectionPage.tsx
│   └── ui/ (Button, Badge, Collapsible, ChatBot)
└── lib/
    ├── api/openai.ts         # OpenAI 클라이언트
    ├── api/groq.ts           # Groq 클라이언트 (백업)
    ├── parseJSON.ts          # AI JSON 응답 파싱
    ├── prompts.ts            # 시스템 프롬프트 상수
    └── store/projectStore.ts # Zustand 전역 상태
```

---

## 8. 환경 변수

```env
OPENAI_API_KEY=sk-proj-...   # 필수 — GPT-4o-mini 호출
GROQ_API_KEY=gsk_...         # 선택 — 백업 모델
GEMINI_API_KEY=AIzaSy...     # 선택 — 미사용
ANTHROPIC_API_KEY=sk-ant-... # 선택 — 미사용
```

---

## 9. 미구현 / 향후 과제

- [ ] 프로젝트 저장/불러오기 (localStorage → 서버 DB)
- [ ] 최근 프로젝트 목록 (홈 화면)
- [ ] PMC / 특수사업 / 시민사회 성장형·전략형 플로우 활성화
- [ ] 예산(II-2) 파일 → PDF 자동 삽입
- [ ] 제안서 완성도 점수 / 심사 기준 체크리스트
- [ ] 사용자 계정 (로그인/로그아웃)
- [ ] 팀 협업 (공동 편집)
