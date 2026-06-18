import { NextRequest, NextResponse } from 'next/server';
import { generateTextPro, isOpenAIConfigured } from '@/lib/api/openai';
import type { PDMRow, PDMInput } from '@/types';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/* ── 작성 지침 기반 4계층 Fallback PDM ──────────────────────────── */
function buildFallbackPdm(ctx: Record<string, string>): PDMRow[] {
  const country = ctx.country || '대상 국가';
  const field = ctx.field || '교육';

  return [
    {
      id: uid(),
      level: 'impact',
      code: 'Impact',
      narrative: `${country} 취약계층 아동·청소년의 삶의 질 향상 및 지속가능한 발전 기반 구축`,
      indicators: `사업 지역 아동 빈곤율 45% → 28% 이하 (사업 종료 후 5년 기준)\n여성 포함 수혜 가구 중 70% 이상 생활 수준 개선 확인`,
      verificationMeans: '정부 통계청 가구 조사, UNICEF 아동빈곤 모니터링 보고서',
      assumptions: '국가 거시경제 안정 및 사회보호 정책 지속\n사업 지역 내 주요 분쟁·재난 미발생',
      children: [
        {
          id: uid(),
          level: 'outcome',
          code: 'Outcome 1',
          narrative: `${field} 서비스 접근성 및 품질 향상`,
          indicators: `서비스 이용 수혜자 수: 0명 → 3,500명 이상 (3차년도)\n여성 참여율 50% 이상 유지`,
          verificationMeans: '사업 등록 대장, 반기 모니터링 보고서, 기초선·종료선 조사',
          assumptions: '지방정부의 운영 협조 유지\n수혜자의 지속적 참여 의지',
          children: [
            {
              id: uid(),
              level: 'output',
              code: 'Output 1.1',
              narrative: `${field} 시설 개·보수 및 기자재 지원 완료`,
              indicators: `시설 개·보수 완료 개소: 5개소 (1차년도 3개소, 2차년도 2개소)\n기자재 지원 수혜자 2,000명 이상`,
              verificationMeans: '공사 완료 증빙, 기자재 배분 목록, 현장 사진',
              assumptions: '건설 자재 수급 안정\n토지 사용권 확보',
              children: [
                {
                  id: uid(),
                  level: 'activity',
                  code: 'A 1.1.1',
                  narrative: '기존 시설 상태 평가 및 개·보수 설계 수행',
                  indicators: '5개소 평가 보고서 작성 완료 (1차년도 1분기)',
                  verificationMeans: '시설 평가 보고서, 사진',
                  assumptions: '현장 접근 가능성 확보',
                },
                {
                  id: uid(),
                  level: 'activity',
                  code: 'A 1.1.2',
                  narrative: '시설 개·보수 공사 시행 및 기자재 조달·배분',
                  indicators: '공사 완료율 100% (2차년도 말 기준)',
                  verificationMeans: '공사 완료 보고서, 기자재 배분 명단',
                  assumptions: '시공업체 계약 이행',
                },
                {
                  id: uid(),
                  level: 'activity',
                  code: 'A 1.1.3',
                  narrative: '시설 준공 후 운영 관리 역량 교육 실시 (담당자 대상)',
                  indicators: '시설 운영 담당자 교육 이수율 100%',
                  verificationMeans: '교육 이수 명단, 사후 역량 평가 결과',
                  assumptions: '담당자 교육 참여 의지',
                },
              ],
            },
            {
              id: uid(),
              level: 'output',
              code: 'Output 1.2',
              narrative: `${field} 프로그램 운영 및 전문 인력 역량 강화`,
              indicators: `연간 프로그램 운영 횟수 48회 이상 (월 4회)\n전문 인력 역량 교육 이수율 90% 이상`,
              verificationMeans: '프로그램 출석부, 역량 교육 이수 명단, 성과 평가 보고서',
              assumptions: '전문 인력 이직률 30% 이하 유지',
              children: [
                {
                  id: uid(),
                  level: 'activity',
                  code: 'A 1.2.1',
                  narrative: `${field} 전문 인력 대상 역량 강화 교육 실시 (연 2회)`,
                  indicators: '교육 이수자 수: 연간 80명 이상 (남성 40%, 여성 60%)',
                  verificationMeans: '교육 참석자 명단, 사전·사후 역량 평가',
                  assumptions: '강사 수급 가능',
                },
                {
                  id: uid(),
                  level: 'activity',
                  code: 'A 1.2.2',
                  narrative: `${field} 서비스 프로그램 정기 운영 및 참여자 모니터링`,
                  indicators: '참여자 월별 출석률 75% 이상',
                  verificationMeans: '월별 출석부, 분기 모니터링 보고서',
                  assumptions: '참여자의 지속 참여 의지 유지',
                },
              ],
            },
          ],
        },
        {
          id: uid(),
          level: 'outcome',
          code: 'Outcome 2',
          narrative: '지역사회 인식 개선 및 수혜 대상 자립 역량 강화',
          indicators: `보호자·지역사회 인식 개선율 70% 이상 (종료선 조사)\n자립 기술 보유 수혜자 비율 60% → 85%`,
          verificationMeans: '기초선·종료선 인식 조사, 자립 역량 평가 기록',
          assumptions: '지역사회 지도자 협력 유지\n문화적 저항 최소화',
          children: [
            {
              id: uid(),
              level: 'output',
              code: 'Output 2.1',
              narrative: '지역사회 대상 인식 개선 캠페인 운영 완료',
              indicators: `캠페인 참여자 수: 5,000명 이상 (3년 합계)\n보호자 참여율 60% 이상`,
              verificationMeans: '캠페인 참여자 명단, 사진 기록, 설문 결과',
              assumptions: '지역 언론·기관 협조 가능',
              children: [
                {
                  id: uid(),
                  level: 'activity',
                  code: 'A 2.1.1',
                  narrative: '인식 개선 교육 자료(리플렛, 영상) 현지어 제작 및 배포',
                  indicators: '교육 자료 5종 제작, 3,000부 배포',
                  verificationMeans: '인쇄물 사진, 배포 명단',
                  assumptions: '현지어 번역 전문가 확보',
                },
                {
                  id: uid(),
                  level: 'activity',
                  code: 'A 2.1.2',
                  narrative: '보호자 및 지역사회 지도자 대상 정기 설명회 개최 (연 4회)',
                  indicators: '회당 참여자 수 100명 이상',
                  verificationMeans: '설명회 참석자 명단, 회의록',
                  assumptions: '참여 동원 협조 체계 구축',
                },
              ],
            },
            {
              id: uid(),
              level: 'output',
              code: 'Output 2.2',
              narrative: '수혜 대상 자립 역량 강화 프로그램 운영',
              indicators: `프로그램 이수자 수: 1,200명 이상 (3년 합계)\n이수자 자립 활동 연계율 50% 이상`,
              verificationMeans: '이수 명단, 자립 활동 연계 확인서',
              assumptions: '연계 기관·자원 확보 가능',
              children: [
                {
                  id: uid(),
                  level: 'activity',
                  code: 'A 2.2.1',
                  narrative: '직업 기초 훈련 및 생계 기술 교육 실시 (연 3회 과정)',
                  indicators: '과정 이수율 80% 이상',
                  verificationMeans: '교육 이수 명단, 기술 평가 결과',
                  assumptions: '훈련 장소 및 강사 확보',
                },
                {
                  id: uid(),
                  level: 'activity',
                  code: 'A 2.2.2',
                  narrative: '자립 활동 연계 지원: 취업·창업·저축 그룹 연결',
                  indicators: '취업·창업 연계자 수: 연 200명 이상',
                  verificationMeans: '연계 확인서, 추적 조사 기록',
                  assumptions: '시장 수요 및 연계 기관 협력',
                },
              ],
            },
          ],
        },
        {
          id: uid(),
          level: 'outcome',
          code: 'Outcome 3',
          narrative: '사업 운영 지속가능성 기반 구축 (지방정부·민간 협력 체계)',
          indicators: `지방정부 예산 편성 확약 획득 (2차년도 말)\n파트너 기관 자체 운영 역량 평가 점수 70점 이상 (5점 척도 → 100점 환산)`,
          verificationMeans: 'MOU 협약서, 지방정부 예산 문서, 역량 평가 보고서',
          assumptions: '정책 담당자 교체 시 인수인계 체계 유지\n지방 예산 삭감 없음',
          children: [
            {
              id: uid(),
              level: 'output',
              code: 'Output 3.1',
              narrative: '지방정부·유관기관과 MOU 체결 및 협력 네트워크 구축',
              indicators: 'MOU 체결 기관 수: 3개소 이상 (1차년도)\n분기별 정례 협의체 운영 12회 이상',
              verificationMeans: 'MOU 협약서, 협의체 회의록',
              assumptions: '지방정부 협력 의지 지속',
              children: [
                {
                  id: uid(),
                  level: 'activity',
                  code: 'A 3.1.1',
                  narrative: '지방정부 및 유관기관 대상 사업 설명 및 협력 협의 진행',
                  indicators: '협의 완료 기관 3개소 이상 (1차년도 1분기)',
                  verificationMeans: '협의 회의록, 서명 문서',
                  assumptions: '담당 공무원 협조',
                },
                {
                  id: uid(),
                  level: 'activity',
                  code: 'A 3.1.2',
                  narrative: '정례 협의체 운영 및 사업 결과 공유 워크숍 개최',
                  indicators: '연 4회 워크숍 개최',
                  verificationMeans: '워크숍 참석자 명단, 결과 보고서',
                  assumptions: '기관별 담당자 참여 가능',
                },
              ],
            },
            {
              id: uid(),
              level: 'output',
              code: 'Output 3.2',
              narrative: '지방정부 정책 옹호 및 제도화 활동 실시',
              indicators: '정책 건의서 제출 1건 이상\n지방정부 예산안 반영 항목 1건 이상',
              verificationMeans: '정책 건의서, 지방정부 예산안 문서',
              assumptions: '지방정부 정책 결정 일정 준수',
              children: [
                {
                  id: uid(),
                  level: 'activity',
                  code: 'A 3.2.1',
                  narrative: '지방정부 담당 부서 대상 정책 옹호 활동 실시 (연 2회)',
                  indicators: '정책 옹호 활동 2회 이상 시행',
                  verificationMeans: '활동 보고서, 참여자 명단',
                  assumptions: '담당 부서 면담 일정 확보',
                },
                {
                  id: uid(),
                  level: 'activity',
                  code: 'A 3.2.2',
                  narrative: '사업 성과 기반 정책 제안서 작성 및 제출',
                  indicators: '정책 제안서 1건 제출 (3차년도)',
                  verificationMeans: '제안서 사본, 제출 확인 공문',
                  assumptions: '정책 제안 채널 확보',
                },
              ],
            },
          ],
        },
      ],
    },
  ];
}

/* ── Fallback Inputs ──────────────────────────────────────────── */
function buildFallbackInputs(): PDMInput[] {
  return [
    {
      id: uid(),
      source: 'KOICA',
      items: ['3년간 사업비 약 OO원'],
    },
    {
      id: uid(),
      source: '굿네이버스 본부',
      items: [
        '3년간 사업비 약 OO원',
        '사업 총괄 책임자(Project Manager) 및 수행인력(Project Officer) 파견',
        '전문가 협력을 통한 사업 성과관리 및 평가 진행',
      ],
    },
    {
      id: uid(),
      source: '굿네이버스 현지사무소',
      items: [
        '사업 실행 및 관리 인력 제공',
        '사업 행정 담당 인력 제공',
        '정부관계자 협조체계 구축',
      ],
    },
  ];
}

// AI가 지침을 어기고 구체적 금액을 추측해 적는 경우를 대비한 안전장치 — "100억원", "5천만원",
// "3억 7천만원", "100,000,000원" 같은 표현을 모두 "OO원"으로 강제 치환
function sanitizeBudgetAmounts(text: string): string {
  return text.replace(/[\d][\d,]*\s*(억\s*)?(\d+\s*)?(천만|백만|만|천)?\s*원/g, 'OO원');
}

function sanitizeInputs(inputs: PDMInput[]): PDMInput[] {
  return inputs.map((input) => ({
    ...input,
    items: (input.items || []).map(sanitizeBudgetAmounts),
  }));
}

function parsePdmResult(raw: string): { pdm: PDMRow[]; inputs: PDMInput[] } | null {
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed.pdm) && parsed.pdm.length > 0) {
      return {
        pdm: parsed.pdm,
        inputs: sanitizeInputs(Array.isArray(parsed.inputs) ? parsed.inputs : []),
      };
    }
    return null;
  } catch {
    return null;
  }
}

/* ── System Prompt ────────────────────────────────── */
const PDM_SYSTEM = `당신은 KOICA 제안서 PDM(Project Design Matrix) 전문가입니다.
주어진 프로젝트 정보를 바탕으로 작성 지침에 맞는 4계층 PDM과 투입물(Inputs)을 JSON으로 생성하세요.

[계층 구조 — 절대 규칙, 최소 개수 반드시 충족]
- Impact: 최상위 배열에 1개만 (children에 Outcome 직접 포함, Purpose 계층 없음)
- Outcome: Impact의 children에 반드시 2~3개 (최소 2개. Impact 달성을 위한 핵심 성과)
- Output: 각 Outcome의 children에 반드시 2~3개 (최소 2개 — 절대 1개만 만들지 말 것.
  Outcome 달성을 위한 직접 산출물. Output이 1개뿐이면 그 Outcome은 부실하게 보이므로,
  서로 다른 측면(예: 시설/인력, 교육/제도, 인프라/운영 등)에서 최소 2개 이상 도출할 것)
- Activity: 각 Output의 children에 반드시 2~4개 (최소 2개. 실행 가능한 구체 활동)

[번호 체계]
- Impact: code = "Impact"
- Outcome: code = "Outcome 1", "Outcome 2", "Outcome 3"
- Output: code = "Output 1.1", "Output 1.2", "Output 2.1" ...
- Activity: code = "A 1.1.1", "A 1.1.2", "A 2.1.1" ...

[각 수준 작성 기준]
- Impact: 수혜자 수준의 장기적 변화, 사업 종료 후 상위 수준 변화로 작성 (활동 수준으로 쓰지 말 것).
  SDG 번호나 SDG 명칭을 직접 언급하지 말 것 — 일반적인 변화 서술로만 작성
- Outcome: 사업 종료 시 기대되는 핵심 변화. Outcome끼리 논리적 구분이 명확해야 함 (예: 접근성 향상 / 학업성취 향상 / 출석률 향상). 한 줄에 너무 많은 내용을 넣지 말 것
- Output: 시설 설치·교육과정 개발·교육 실시·제도 구축 등 사업이 직접 통제·생산하는 구체적 결과물
- Activity: 누가/무엇을/어떻게 수행하는지 드러나게, 일정·예산에 반영 가능한 수준으로 세분화. 추상적 표현 금지
  ❌ 역량강화  →  ✅ 교사 대상 상담역량 강화 교육 실시 (연 4회)

[논리 연결 규칙 — 반드시 준수]
- Activity는 해당 Output을 만들어야 하고, Output은 소속 Outcome 달성에 기여해야 하며, Outcome은 Impact 달성에 기여해야 함
- 각 수준 간 연결이 역전되거나 중복되면 안 됨
- 문제분석(problemTree)·목표분석(objectiveTree)에서 도출된 요소와 1:1로 대응시킬 것
- 상위 목표 달성에 직접 기여하지 못하거나 논리 연결이 약한 항목은 만들지 말 것 — 구조를 단순하고 명확하게 유지

[지표(indicators) 설계]
- SMART 형식, 기초선→목표치 포함 (예: "21% → 60% (3차년도)")
- 가능한 한 수치화. 막연한 추상 표현 금지
  ❌ 교육환경 개선  →  ✅ 시설개선 학교 비율, 9학년 졸업률, 참여 학생 수
- 여성 참여 지표 반드시 포함
- Activity 지표는 완료 기준으로 작성

[검증수단(verificationMeans)] 실제 사업 문서 유형으로 작성:
출석부, 시험 성적부, 평가 보고서, 배포 명단, MOU, 등록 확인서, 기초선/종료선 평가보고서, 지방교육청·통계청 자료 등

[가정(assumptions)] 단순 리스크 목록이 아니라 "이 전제가 유지되어야 해당 성과가 달성되는 외부 조건"으로 작성
(예: 정부 협력 지속, 정책 유지, 시설 정상 운영, 참여율 유지 — 사업팀이 직접 통제할 수 없는 요소)

[투입물(Inputs) — PDM 표 하단에 별도로 반드시 작성]
- 출처(source)별로 묶어서 작성: 예) "KOICA", "굿네이버스 본부", "굿네이버스 [국가]사무소(또는 현지 파트너기관)"
- 각 출처마다 items 배열로 구체 투입 내역 작성:
  - 예산 항목은 절대 구체적인 숫자를 추측해서 쓰지 마세요 (예: "100억원", "5천만원", "3억 7천만원" 같은
    표현 금지). 반드시 "3년간 사업비 약 OO원" 문자열을 그대로 사용하세요 ("OO" 그대로, 숫자로 바꾸지 말 것).
    실제 금액은 사업 담당자가 추후 직접 입력합니다.
  - 인력 투입: "사업 총괄 책임자(Project Manager) 및 수행인력(Project Officer) 파견" 등 구체적 역할 명시
  - 행정·협력 체계: "정부관계자 협조체계 구축" 등
- 최소 3개 출처(KOICA / 한국 수행기관 본부 / 현지사무소·파트너기관), 각 출처당 최소 2개 항목

[출력 형식 — 절대 규칙]
다음 JSON 객체만 출력하세요 (코드블록·설명 문장 없이):
{
  "pdm": [ PDMRow 배열 ],
  "inputs": [ { "id": "8자리영문숫자", "source": "...", "items": ["...", "..."] }, ... ]
}
PDMRow: { "id": "8자리영문숫자", "level": "impact|outcome|output|activity", "code": "...", "narrative": "...", "indicators": "...", "verificationMeans": "...", "assumptions": "...", "children": [...] }`;

export async function POST(req: NextRequest) {
  try {
    const { projectContext, projectType, pmcSourceDocs } = await req.json();
    const ctx = (projectContext || {}) as Record<string, string>;

    if (!isOpenAIConfigured()) {
      return NextResponse.json({ success: true, pdm: buildFallbackPdm(ctx), inputs: buildFallbackInputs() });
    }

    // PMC 소스 텍스트 빌드
    let pmcSection = '';
    if (projectType === 'pmc' && Array.isArray(pmcSourceDocs) && pmcSourceDocs.length > 0) {
      const combined = pmcSourceDocs
        .map((doc: { fileName: string; extractedText: string }) =>
          `--- ${doc.fileName} ---\n${doc.extractedText.slice(0, 6000)}`
        )
        .join('\n\n')
        .slice(0, 12000);
      pmcSection = `\n[KOICA 집행계획(안) 원문 — PDM은 이 내용을 기반으로 작성하고 구조·지표를 최대한 반영하세요]\n${combined}\n[/집행계획(안)]\n`;
    }

    const contextLines = [
      ctx.title               && `사업명: ${ctx.title}`,
      ctx.country             && `대상 국가: ${ctx.country}`,
      ctx.region              && `대상 지역: ${ctx.region}`,
      ctx.field               && `사업 분야: ${ctx.field}`,
      ctx.coreProblem         && `핵심 문제: ${ctx.coreProblem}`,
      ctx.targetBeneficiaries && `수혜 대상: ${ctx.targetBeneficiaries}`,
      ctx.interventionApproach && `개입 접근법: ${ctx.interventionApproach}`,
      ctx.expectedOutcomes    && `기대 성과: ${ctx.expectedOutcomes}`,
      ctx.problemTree         && `문제나무 요약: ${ctx.problemTree.slice(0, 600)}`,
      ctx.objectiveTree       && `목표나무 요약: ${ctx.objectiveTree.slice(0, 600)}`,
    ].filter(Boolean).join('\n');

    const prompt = `아래 프로젝트 정보로 KOICA 제안서 4계층 PDM과 투입물(Inputs) JSON을 생성하세요.${pmcSection}

[프로젝트 정보]
${contextLines}

[PDM 구성 요구사항 — 최소 개수 반드시 충족, 부실하게 만들지 말 것]
- Impact 1개: 장기 사회 변화 (SDG 번호는 직접 언급하지 말 것, 5년 후 측정 가능한 수준으로 작성)
- Outcome 2~3개: 서로 구분되는 핵심 성과 (Impact의 직접 children, Purpose 없음)
- Output 각 Outcome당 반드시 2~3개 (절대 1개만 만들지 말 것): 구체적 산출물, 수치 포함
- Activity 각 Output당 2~4개: 실행 가능한 구체 활동 (추상 표현 금지)
- Inputs: 최소 3개 출처(KOICA/한국 수행기관 본부/현지사무소·파트너), 출처당 최소 2개 항목
  (예산 항목은 절대 구체적 숫자를 쓰지 말고 "3년간 사업비 약 OO원"이라는 문자열을 그대로 사용)

문제나무·목표나무에서 도출된 요소와 1:1로 정확히 대응되도록 작성하고,
상위 목표 달성에 직접 기여하지 않거나 논리 연결이 약한 항목은 넣지 마세요.
위 [출력 형식] 그대로 JSON 객체만 출력:`;

    const raw = await generateTextPro(
      [{ role: 'user', content: prompt }],
      PDM_SYSTEM
    );

    const result = parsePdmResult(raw);
    if (result) {
      // id 빈칸 보완 (매치마다 새 id를 생성해야 하므로 콜백 사용 — 고정 문자열을 쓰면 모든 빈 id가 동일해짐)
      const withIds = JSON.parse(
        JSON.stringify(result).replace(/"id"\s*:\s*""/g, () => `"id":"${uid()}"`)
      );
      return NextResponse.json({ success: true, pdm: withIds.pdm, inputs: withIds.inputs });
    }

    return NextResponse.json({ success: true, pdm: buildFallbackPdm(ctx), inputs: buildFallbackInputs() });
  } catch (error) {
    const message = error instanceof Error ? error.message : '오류가 발생했습니다.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
