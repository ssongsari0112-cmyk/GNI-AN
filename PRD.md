# GNI-AN (지니안) — Product Requirements Document

> 버전: v2.0 | 최종 업데이트: 2026-06-23
> 굿네이버스 KOICA 제안서 AI 작성 도구

---

## 1. 서비스 개요

**GNI-AN(지니안)** 은 굿네이버스 임직원이 KOICA 시민사회협력사업/국별협력사업(PMC) 제안서를 AI와 함께 단계별로 작성할 수 있는 내부 웹 서비스입니다.

- **기술 스택**: Next.js 16 (App Router, TypeScript), Tailwind CSS v4, Zustand (`persist`), TipTap, OpenAI
- **AI 모델**: `gpt-5.3-chat-latest` (주요 생성/구조화/도우미 채팅) + `gpt-4o-mini` (경량 채팅·전문가 상담) — API 라우트에서만 호출, 키 클라이언트 노출 없음
- **PDF 텍스트 추출**: `unpdf` (PMC 집행계획안 업로드용, 서버리스 환경에서 워커 없이 동작)
- **상태 관리**: Zustand `persist` — localStorage 키 `gni-an-project`, 프로젝트 데이터 자동 저장
- **배포**: Vercel (GitHub 연동 자동 배포, `origin/main` 푸시 시 프로덕션 반영)
- **컬러 시스템**: 올리브 그린 `#8AA81E` / Hover `#799516` / Light `#EEF5D6` / Border `#D9E6B7` / BG `#F7F8F2`
- **Base URL**: 모든 경로 `/gni-an` 하위

---

## 2. 사용자 플로우

```
홈 (/gni-an) — 기존 프로젝트(최대 5개) 이어서 작업 가능
 └─ 프로그램 선택 (/gni-an/project/new)
     ├─ 국별협력사업 PMC (/gni-an/project/pmc)
     │   └─ 집행계획(안) PDF 업로드 → AI 분석 → 프로젝트 정보 자동 입력
     └─ 시민사회협력사업 (/gni-an/project/civil-society)
         └─ [기획 4단계]
             1. 아이디어 입력 (/gni-an/ideation) — 참고자료(PDF/이미지) 첨부 가능
             2. 전문가 컨설팅 (/gni-an/ideation/experts)
             3. 사업 구조화 (/gni-an/ideation/structure) — 문제분석→목표체계→PDM
             4. 사업개요서 (/gni-an/ideation/summary)
         └─ 프로젝트 생성 (/gni-an/create)
             └─ 1차 가안 자동 생성 (/gni-an/proposal/generating)
                 └─ 제안서 작성 (/gni-an/proposal/[section])  — 17개 섹션
                     └─ PDF/Word 미리보기·내보내기 (/gni-an/proposal/pdf-preview)
```

특수사업(CTS, IBS)은 아직 비활성(준비 중) 상태입니다.

---

## 3. 페이지 상세 명세

### 3.1 홈 (`/gni-an`)

- 올리브 그린 헤더 + 히어로 섹션
- CTA: 새 프로젝트 시작하기 / **기존 프로젝트 불러오기**
- **기존 프로젝트 불러오기 모달**: 이 컴퓨터(localStorage)에 저장된 프로젝트를 **최대 5개**까지 보여줌. 각 항목에 제목/국가·분야/작성 진행률 표시, "이어서 작업하기"(구조화 완료 여부에 따라 적절한 단계로 라우팅) / 삭제 가능. 모달 진입 시 현재 작업 중인 프로젝트도 자동으로 목록에 적립
- 5개 슬롯이 모두 찬 상태에서 새 프로젝트를 시작하면 경고 후 진행을 막아 데이터 손실 방지

### 3.2 프로그램 선택 (`/gni-an/project/new`)

- 3열 카드 레이아웃
- **국별협력사업(PMC)** — 활성
- **시민사회협력사업** — 활성 (진입형/성장형/전략형/인도민협)
- **특수사업(CTS, IBS)** — 준비 중

### 3.2.1 국별협력사업 PMC (`/gni-an/project/pmc`)

- KOICA 집행계획(안) PDF 업로드 (최대 3개, 드래그앤드롭)
- PDF 텍스트 추출(`unpdf`) → AI 분석(`pmc/analyze-doc`)으로 사업명/국가/분야/기간/예산/핵심문제/주요과업/PDM 요약/KOICA 요구조건 추출
- 분석 결과로 이후 아이디어 입력 단계 사전 입력(pre-fill)
- 업로드된 원문 전체는 `pmcSourceDocs`에 저장되어, 이후 모든 AI 생성 단계(문제분석/목표분석/PDM/17개 섹션/AI 도우미 채팅 전체)에서 "반드시 원문 기반으로 작성" 지침과 함께 활용됨

### 3.3 사업 유형 선택 (`/gni-an/project/civil-society`)

- 2×2 카드: **진입형(2년)** / **성장형(2~3년)** / **전략형(5년~)** / **인도민협(HDP-N, Nexus)**

### 3.4 아이디어 입력 (`/gni-an/ideation`)

**레이아웃**: 좌측 입력 폼 + 우측 AI 작성 도우미(고정) + 하단 버튼 고정

**필수 입력**: 사업 분야(칩 선택) / 대상 국가(지역 탭+검색+직접입력, 60개국+) / 사업 아이디어(최소 50자)

**선택 입력**: 세부 지역 / 주요 수혜자 / 총사업비 / 예상 기간

**참고 자료 첨부** (시민사회협력사업, PMC가 아닌 경우): 초안 PDM, 사전조사 자료(PDF), 인사이트가 되는 사진 등을 **선택적으로 최대 5개** 첨부 가능. PDF는 텍스트 추출, 이미지는 GPT 비전으로 내용 설명 생성 후 텍스트로 저장. PMC의 `pmcSourceDocs`와 동일 필드를 공유하며, 이후 모든 생성 단계에 "참고 자료(추측 금지)" 안내와 함께 반영됨

**명시적 요청 반영**: 아이디어 텍스트에 "~꼭 추가해줘", "~포함해줘" 같은 구체적 요청이 있으면, 이후 구조화 단계(목표체계/PDM)까지 최우선으로 반영되도록 전체 생성 프롬프트에 강제 규칙 적용

**AI 분석 시작**: 아이디어 분석 + 전문가 생성 병렬 호출

### 3.5 전문가 컨설팅 (`/gni-an/ideation/experts`)

- 전문가 4인: 분야 전문가 / 지역 전문가 / 사업기획 전문가 / M&E 전문가
- 질문 가이드 토글, 메시지 1개 이상 전송 시 완료 처리

### 3.6 사업 구조화 (`/gni-an/ideation/structure`)

**탭 3개** (모두 인라인 편집 가능): 문제분석 / 목표체계 / PDM 초안

**문제분석 (Problem Tree)**: 결과(Effects, 2개 이상)→핵심문제(1개)→직접원인(2~3개)→세부원인(각 2개 이상)→근본원인(각 1개 이상). 노드 호버 시 "+추가"(형제)/"+하위" 버튼이 노드에 완전히 밀착되어 표시(클릭 시 사라지는 호버갭 버그 수정됨)

**목표체계 (Objective Tree)**: 문제나무를 "그대로 뒤집은 거울"이 되도록 강제 — Outcome 개수 = 문제나무 직접원인 개수와 정확히 1:1 대응(같은 순서), Output 개수 = 세부원인 개수와 1:1 대응(최소 2개 보장). 부정→긍정 단어 치환표 적용(상실→회복, 파괴→재건, 부족→충족 등)으로 핵심 소재를 유지한 채 서술어만 전환

**PDM 초안**: 4계층(Impact→Outcome→Output→Activity, Purpose 계층 없음). Outcome 2~3개, Output 각 2~3개, Activity 각 3~4개 최소 보장. 하단에 **투입물(Inputs)** 블록 — 출처(KOICA/본부/현지사무소)별 투입 내역, 예산은 항목명만 작성하고 실제 금액은 "OO원"으로 자리표시(추측 금지, 서버 측 정규식 안전장치로 강제 치환)

**문제분석 수정 → 목표체계·PDM만 재생성**: 문제분석 탭에서 "이 문제분석으로 목표체계·PDM 재생성" 버튼 — 직접 수정한 문제분석은 그대로 두고, 그 내용을 기반으로 목표체계→PDM만 새로 생성(전체를 처음부터 다시 만드는 "전체 재생성"과 별개)

**인사이트 추출**: 컨설팅 데이터 기반 5개 카테고리(문제정의/수혜자/개입전략/리스크/지속가능성) 자동 추출

### 3.7 사업개요서 (`/gni-an/ideation/summary`)

- AI 생성 6개 섹션: 기본정보 / 사업배경+수요분석 / 사업목적 / 수혜자 / 수행방법+파트너십 / 리스크+지속가능성

### 3.8 프로젝트 생성 (`/gni-an/create`)

- 아이디어 데이터 자동 pre-fill, 필수(사업명/기관명/대상국) + 선택(기간/예산)

### 3.8.1 1차 가안 자동 생성 (`/gni-an/proposal/generating`)

- 프로젝트 정보 입력 직후, 문제나무→목표나무→PDM(+투입물)→17개 섹션 전체를 순차로 한 번에 생성하는 진행 표시 로딩 페이지
- 이미 작성된 항목은 건너뛰고(skip), 생성 중 이탈하면 작업이 중단됨을 안내

### 3.9 제안서 작성 (`/gni-an/proposal/[section]`)

**레이아웃**: 3컬럼 — 좌측 사이드바 + 중앙 에디터(TipTap) + 우측 AI 작성 도우미

**상단 툴바**: 프로젝트 정보 수정 / **찾아바꾸기**(전체 17개 섹션 대상 단어 일괄 치환, 섹션별 일치 건수 미리보기 제공) / 이전·건너뛰기 / 미리보기 / PDF 저장

**AI 작성 도우미**: 빠른 질문 4개 + 채팅으로 본문 직접 수정(외과적 편집 — 요청과 무관한 부분은 글자 하나도 바꾸지 않음). 이미지 Ctrl+V/드래그앤드롭 첨부 가능. PMC/참고자료 첨부 시 해당 원문도 함께 반영

**출처 표기**: AI가 인용하는 통계 출처는 "(기관명, 연도)" 형식(쉼표+공백 고정)으로 통일. 확신 없는 출처는 지어내지 않고 "현지 조사 결과" 등으로만 표기(환각 방지). 본문에 표시된 "(기관명, 연도)" 패턴은 클릭 가능한 칩으로 자동 변환되어, 클릭 시 팝업으로 전체 출처 텍스트 확인 + 구글 검색 링크 + 실제 URL 직접 입력(저장 시 실제 하이퍼링크로 치환) 제공

**문제-해결 추적성**: 모든 섹션이 문제분석에서 식별된 구체적 원인명을 직접 인용하여 "[원인명]을 해결하기 위해" 형식으로 연결하도록 강제 — 전략·활동·지속가능성·이해관계자·조직 인력까지 일반론적 서술 금지

**문체**: 전체 17개 섹션 + PDM 모두 간결체·명사형 종결("~함/~음/~됨")로 통일, "~합니다/~한다"체 사용 금지

**내부 문서 필요 안내**: 사전조사(I-1 나)와 파트너기관 자체 평가 결과(I-1 바)는 AI가 예시로 작성한 내용임을 본문 상단에 고정 경고 배너로 표시 — "실제 사전조사/자체평가 자료(내부 문서)로 반드시 교체 필요"

**17개 섹션**: (코드/제목/권장 글자 수는 기존과 동일 — 4.1 절 참고용 표는 생략하지 않음)

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
- **I-2 가 (PDM)**: 트리뷰 인라인 편집 + 투입물(Inputs) 출처·항목 편집 UI, AI 채팅으로 직접 구조 수정(Outcome/Output/Activity 추가 등)
- **I-2 나 (세부추진방안)**: Activity 서술 방식이 "Step 1~4" 강제 형식에서 활동 성격에 맞는 자유 서술로 완화 (단순 점검성 활동은 간결하게도 가능)
- **III-1 (모니터링계획)**: PDM의 Impact·Outcome·Output 전체 계층을 빠짐없이 반영한 지표표 + 예상 문제점/대응방안표
- **III-2 (종료평가)**: 사업 기간·PDM 지표를 직접 인용해 매번 다른 구체적 시점/방법으로 작성(일반론 금지)
- **II-2 (예산)**: 파일 업로드 (드래그앤드롭)
- **III-4 (일정)**: 간트 차트 스타일 월별 드래그 선택 + AI 자동완성(활동별 기간 자동 배정)

### 3.10 PDF/Word 미리보기 및 내보내기 (`/gni-an/proposal/pdf-preview`)

**구성**: 표지 → 목차 → 17개 섹션(Part 헤더 포함, 빈 텍스트는 "보이는 글자 없음" 기준으로 정확히 판별해 빈 페이지 생성 방지)

**문제분석/목표분석**: 나무 다이어그램은 **가로(landscape) 페이지**로, 서술 텍스트는 **세로(portrait) 페이지**로 분리 출력. 다이어그램은 박스를 가로로 넓게·글자를 작게 압축해 가능한 한 한 페이지에 들어가도록 설계되어 있으며, 그래도 한 페이지보다 크면 페이지 경계에서 분할되되 절대 잘려서 사라지지 않도록 처리됨(과거 "분할 금지" 보호가 오히려 오버사이즈 블록을 페이지 밖으로 밀어 잘라먹던 버그 수정됨)

**PDM 표**: 가로 페이지로 출력, 표가 한 페이지를 넘으면 행 단위로만 분할(제목과 표가 분리되어 제목만 페이지에 혼자 남지 않도록 보호)

**PDF 저장**: html2canvas 기반 슬라이싱(`exportPagesToPdf`) — 미리보기 화면과 동일한 페이지 분할 로직을 공유하여 결과가 일치함
**브라우저 인쇄(Ctrl+P)**: 각 페이지에 명시적 `page-break-after` 규칙을 적용해 인쇄 시에도 동일하게 안정적인 페이지 배치 보장
**Word 내보내기**: 동일한 가로/세로 구역 분리, PDM 표 자동 행 단위 분할 지원

---

## 4. AI 기능 명세

### 4.1 API 엔드포인트

| 엔드포인트 | 방식 | 기능 |
|-----------|------|------|
| `POST /api/gni-an/ideation/analyze` | 단발 | 아이디어 분석 → coreProblem/수혜자/개입방안/성과/전문가추천. 참고자료 첨부 반영 |
| `POST /api/gni-an/ideation/describe-image` | 단발 | 첨부 이미지를 GPT 비전으로 텍스트 설명 변환 |
| `POST /api/gni-an/consulting/experts/generate` | 단발 | 전문가 4명 생성 |
| `POST /api/gni-an/consulting/chat` | 스트리밍 | 전문가 페르소나 채팅 |
| `POST /api/gni-an/structure/generate` | 단발 | 문제나무/목표나무/PDM/투입물/인사이트 JSON 한 번에 생성 |
| `POST /api/gni-an/proposal/problem-tree` | 단발 | 문제나무 단독 재생성 |
| `POST /api/gni-an/proposal/objective-tree` | 단발 | 목표나무 단독 재생성 (문제나무와 1:1 대응 강제) |
| `POST /api/gni-an/proposal/pdm-draft` | 단발 | PDM + 투입물 생성 |
| `POST /api/gni-an/proposal/pdm-chat` | 단발 | PDM 채팅 기반 직접 수정(외과적 편집) |
| `POST /api/gni-an/proposal/section/draft` | 단발 | 17개 섹션 초안 HTML 생성 |
| `POST /api/gni-an/proposal/section/chat` | 단발 | 섹션 채팅 기반 직접 수정(외과적 편집) |
| `POST /api/gni-an/proposal/section/revise` | 단발 | 피드백 기반 섹션 수정 |
| `POST /api/gni-an/proposal/section/review` | 스트리밍 | 섹션별 AI 검토(구조화 도우미 포함) |
| `POST /api/gni-an/proposal/schedule-draft` | 단발 | 간트차트 활동별 기간 자동 배정 |
| `POST /api/gni-an/insights/generate` | 단발 | 컨설팅 기반 인사이트 5개 추출 |
| `POST /api/gni-an/summary/generate` | 단발 | 사업개요서 6개 섹션 생성 |
| `POST /api/gni-an/pmc/extract-pdf` | 단발 | PMC 집행계획안 PDF 텍스트 추출 (`unpdf`) |
| `POST /api/gni-an/pmc/analyze-doc` | 단발 | 추출 텍스트에서 사업 정보 구조화 |
| `POST /api/gni-an/chat` | 스트리밍 | 일반 AI 어시스턴트(플로팅 챗봇) |

### 4.2 AI 설정

- **모델**: `gpt-5.3-chat-latest`(MODEL_PRO, 구조화·섹션 생성·도우미 채팅 전부) / `gpt-4o-mini`(MODEL_FAST, 경량 채팅)
  - gpt-5.x 계열은 `max_tokens` 대신 `max_completion_tokens` 사용, `temperature` 커스텀 값 미지원(기본값 1만 허용)
- **구현 파일**: `src/lib/api/openai.ts`
- **공유 유틸**: `src/lib/pmcContext.ts` — PMC 원문/일반 참고자료 프롬프트 블록 생성(`buildPmcPromptBlock` / `buildReferencePromptBlock`)
- **JSON 파싱**: `src/lib/parseJSON.ts`
- **프롬프트**: `src/lib/prompts.ts` — 구조화 단계 공통 시스템 프롬프트 중앙화
- **API 키 미설정 시**: 각 라우트별 목 데이터(FALLBACK) 반환 → 전체 플로우 탐색 가능
- **안전장치(서버 측 정규식)**: 예산 등 추측 숫자가 생성돼도 정규식으로 "OO원"으로 강제 치환
- **품질 규칙 전역 적용**: 출처 환각 금지, 명사형 종결 문체, 문제-해결 추적성, 최소 개수(Outcome/Output/Activity) 강제

---

## 5. 상태 관리 (Zustand Store)

`src/lib/store/projectStore.ts` — localStorage(`gni-an-project`)에 자동 persist

| 상태 | 타입 | 설명 |
|------|------|------|
| `project` | `Project \| null` | 현재 작업 중인 프로젝트 기본 정보 |
| `projectType` | `'civil-society' \| 'pmc'` | 사업 유형 |
| `pmcSourceDocs` | `PmcSourceDoc[]` | PMC 집행계획안 원문 또는 시민사회 참고자료(PDF/이미지) |
| `ideation` | `IdeationData \| null` | 아이디어 입력 데이터 |
| `ideationAnalysis` | `IdeationAnalysis \| null` | AI 분석 결과 |
| `experts` / `expertSessions` | `Expert[]` / `ExpertSession[]` | 전문가 4인 + 채팅 내역 |
| `structure` | `StructureData \| null` | 문제나무/목표나무/PDM + `pdmInputs`(투입물) |
| `summary` | `ProjectSummary \| null` | 사업개요서 데이터 |
| `sections` | `Record<SectionId, ProposalSection>` | 17개 섹션 내용/AI초안/상태/글자수 |
| `insights` | `Insight[]` | AI 인사이트 5개 |
| `scheduleActivities` | `ScheduleActivity[]` | 사업 일정 |
| `budgetFile` | `{name,size,uploadedAt} \| null` | 예산 파일 메타 |
| `projectDetails` | `ProjectDetails` | 사업 유형·섹터·인력·예산 등 부가 정보 |
| `savedProjects` | `ProjectSnapshot[]` (최대 5개) | 적립 저장된 프로젝트 스냅샷 — 위 모든 필드를 프로젝트별로 보관 |

**주요 액션**: `reset()`(현재 프로젝트를 자동 적립 후 작업영역 비움, 5개 초과 시 false 반환), `saveActiveSnapshot()`, `loadSnapshot(id)`, `deleteSnapshot(id)`

---

## 6. 전역 컴포넌트

- **ChatBot** (`src/components/ui/ChatBot.tsx`): 우하단 플로팅 AI 챗봇
- **StepHeader** (`src/components/layout/StepHeader.tsx`): 기획 4단계 진행 상태
- **ProposalLayout** (`src/components/layout/ProposalLayout.tsx`): 제안서 섹션 공통 3컬럼 레이아웃 + 찾아바꾸기 모달 + AI 작성 도우미
- **CitationHtml** (`src/components/proposal/CitationHtml.tsx`): 출처 표기를 클릭 가능한 칩+팝업으로 변환
- **FindReplaceModal** (`src/components/proposal/FindReplaceModal.tsx`): 전체 섹션 대상 단어 찾아바꾸기

---

## 7. 파일 구조 (주요 변경분)

```
src/
├── app/api/gni-an/
│   ├── ideation/{analyze, describe-image}/
│   ├── pmc/{extract-pdf, analyze-doc}/
│   ├── structure/generate/
│   └── proposal/
│       ├── {problem-tree, objective-tree, pdm-draft, pdm-chat}/
│       ├── section/{draft, chat, revise, review}/
│       └── schedule-draft/
├── app/gni-an/proposal/generating/   # 1차 가안 자동 생성 로딩 페이지
├── components/proposal/
│   ├── CitationHtml.tsx
│   ├── FindReplaceModal.tsx
│   ├── ProblemTreeEditor.tsx / ObjectiveTreeVisual.tsx
│   └── SectionPage.tsx
├── lib/
│   ├── api/openai.ts          # OpenAI 클라이언트 (gpt-5.3-chat-latest / gpt-4o-mini)
│   ├── pmcContext.ts          # PMC·참고자료 프롬프트 블록 공유 유틸
│   ├── export/{pdfExport, pdfPageBreaks, docxExport}.ts
│   └── store/projectStore.ts  # Zustand 전역 상태 (다중 프로젝트 슬롯 포함)
```

---

## 8. 환경 변수

```env
OPENAI_API_KEY=sk-proj-...   # 필수
GROQ_API_KEY=gsk_...         # 선택 — 미사용
GEMINI_API_KEY=AIzaSy...     # 선택 — 미사용
ANTHROPIC_API_KEY=sk-ant-... # 선택 — 미사용
```

---

## 9. 미구현 / 향후 과제

- [ ] 프로젝트 저장을 서버 DB로 이전 (현재는 localStorage 5슬롯, 기기 간 동기화 불가)
- [ ] 특수사업(CTS, IBS) 플로우 활성화
- [ ] 예산(II-2) 파일 → PDF/Word 자동 삽입
- [ ] 제안서 완성도 점수 / 심사 기준 체크리스트
- [ ] 사용자 계정 (로그인/로그아웃), 팀 협업(공동 편집)
- [ ] 출처 팝업에서 저장한 실제 URL을 PDF/Word 내보내기에도 하이퍼링크로 반영

---

## 10. 주요 변경 이력 (v1.0 → v2.0)

- PMC(국별협력사업) 전면 활성화 — 집행계획안 업로드·분석·전체 파이프라인 연동
- AI 모델 `gpt-4o-mini` → `gpt-5.3-chat-latest`(주요 생성) 업그레이드, 전문가 인사이트 종합력 향상
- 문제분석 1:1 목표체계 대응 강제(부정→긍정 단어 치환), PDM 투입물(Inputs) 추가
- 출처 환각 방지 + 클릭형 출처 팝업, 문제-해결 추적성 원칙, 전체 명사형 종결 문체 통일
- 프로젝트 다중 저장(최대 5개), 시민사회협력사업 참고자료 첨부, 전체 찾아바꾸기
- PDF/Word 내보내기 페이지 분할·방향·빈 페이지 버그 다수 수정, 트리 다이어그램 압축
- AI 작성 도우미 외과적 편집(채팅 한 번으로 본문 직접 수정) 전체 섹션 확대, 이미지 첨부
- 1차 가안 자동 생성(17개 섹션 + 구조화 한 번에) 로딩 페이지 추가
