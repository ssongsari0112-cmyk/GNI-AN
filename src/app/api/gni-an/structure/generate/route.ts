import { NextRequest, NextResponse } from 'next/server';
import { generateTextPro, isOpenAIConfigured } from '@/lib/api/openai';
import { PROMPTS } from '@/lib/prompts';
import { parseAIJson } from '@/lib/parseJSON';
import { buildPmcPromptBlock, buildReferencePromptBlock } from '@/lib/pmcContext';

// AI가 지침을 어기고 구체적 금액을 추측해 적는 경우를 대비한 안전장치
function sanitizeBudgetAmounts(text: string): string {
  return text.replace(/[\d][\d,]*\s*(억\s*)?(\d+\s*)?(천만|백만|만|천)?\s*원/g, 'OO원');
}

function sanitizePdmInputs(inputs: unknown): unknown {
  if (!Array.isArray(inputs)) return inputs;
  return inputs.map((input: { items?: string[] }) => ({
    ...input,
    items: Array.isArray(input.items) ? input.items.map(sanitizeBudgetAmounts) : input.items,
  }));
}

/** "사업 구체화" 단계 대화 내용을 구조화 프롬프트에 추가 컨텍스트로 주입 */
function buildClarifyBlock(clarifyMessages?: { role: 'assistant' | 'user'; content: string }[]): string {
  if (!clarifyMessages?.length) return '';
  const lines = clarifyMessages.map((m) => `${m.role === 'assistant' ? 'AI 질문' : '사용자 답변'}: ${m.content}`);
  return `\n사용자가 "사업 구체화" 단계에서 직접 나눈 대화(최우선 반영 — 추측해서 바꾸지 말고 아래
구체적 사실을 그대로 활용):\n${lines.join('\n')}\n`;
}

export async function POST(req: NextRequest) {
  try {
    const { ideation, analysis, expertSessions, projectType, pmcSourceDocs, clarifyMessages } = await req.json();

    const consultingContext = expertSessions
      ?.map((s: { expertId: string; summary?: string }) => `[${s.expertId} 전문가 상담]: ${s.summary || ''}`)
      .join('\n') || '';
    const clarifyBlock = buildClarifyBlock(clarifyMessages);

    const systemPrompt = PROMPTS.structureSystem;

    const pmcBlock = projectType === 'pmc' ? buildPmcPromptBlock(pmcSourceDocs) : buildReferencePromptBlock(pmcSourceDocs);

    const userMessage = `다음 정보를 바탕으로 KOICA 시민사회협력사업 구조를 상세하게 생성해주세요.
모든 항목은 실제 제안서에 바로 활용할 수 있는 수준으로 구체적이고 현실적으로 작성하세요.
${pmcBlock}
사업 분야: ${ideation?.field}
대상 국가: ${ideation?.country}
세부 지역: ${ideation?.subRegion || '미지정'}
사업 아이디어: ${ideation?.idea}
주요 수혜자: ${ideation?.beneficiaries || '미지정'}
총사업비: ${ideation?.budget || '미지정'}
사업 기간: ${ideation?.duration || '미지정'}

AI 분석 결과:
- 핵심 문제: ${analysis?.coreProblem}
- 수혜자: ${analysis?.targetBeneficiaries}
- 개입 방안: ${analysis?.interventionApproach}
- 기대 성과: ${analysis?.expectedOutcomes}

전문가 상담 인사이트:
${consultingContext || '(상담 내용 없음)'}
${clarifyBlock}
[최우선 — 사업 아이디어에 사용자가 명시적으로 요청한 내용은 절대 누락 금지]
위 "사업 아이디어" 텍스트 안에 "~꼭 추가해줘", "~포함해줘", "~빠지지 않게 해줘", "~반드시 ~하게 해줘"
처럼 사용자가 직접 요청한 구체적 내용이 있으면, 이를 가장 중요한 요구사항으로 간주하여 Outcome·
Output·Activity 중 가장 알맞은 위치에 반드시 반영하세요. 일반적인 사업 설명으로만 취급하고 넘어가지
말 것 — 명시적 요청은 빠짐없이 결과물에 나타나야 합니다.

아래 JSON 구조를 그대로 따르되, 모든 값을 위 사업 정보에 맞게 구체적으로 채워주세요.
아래 예시의 개수(Output 2개, Activity 3개 등)는 최소 기준입니다 — 실제로는 outcomes에
작성하는 모든 Output마다 반드시 3~4개의 활동을 빠짐없이 activities 배열에 포함시키고,
pdm의 모든 Output도 children에 Activity를 3~4개씩 반드시 포함시키세요.
절대 Output 1개당 활동 1~2개만 만들지 마세요. SDG 번호나 명칭은 직접 언급하지 마세요.
pdmInputs(투입물)는 항목명만 작성하고 구체적 수량·금액·명수를 추측해서 쓰지 마세요.

[가장 중요 — objectiveTree·pdm은 problemTree를 그대로 뒤집은 거울이어야 함]
objectiveTree.outcomes의 개수는 problemTree.causes의 개수와 정확히 동일해야 하고, 같은 순서로
1:1 대응해야 합니다. 각 Outcome의 Output 개수도 대응하는 직접 원인의 children(근본 원인) 개수와
동일하게 작성하되, 근본 원인이 1개뿐이면 그 측면을 2개 이상으로 세분화하여 Output을 반드시 2개
이상 작성하세요 (Output 1개는 절대 금지 — 최소 2개 보장이 1:1 대응보다 우선). pdm의 Outcome·
Output 구조도 동일한 대응을 따르세요.
완전히 새로운 주제를 만들지 말고, causes 노드의 핵심 소재(대상·분야·이슈)는 유지한 채 부정
서술어만 긍정 서술어로 치환하세요: 상실→회복/확보, 파괴→재건/구축, 부족→충족/확보, 약화→강화,
저하→향상, 감소→증가, 부재→구축/마련, 미흡→강화, 단절→연계/구축, 제한→확대, 악화→개선
(예: "쿼카서식지 모니터링 인프라 미비" → "쿼카서식지 모니터링 인프라 구축")

{
  "problemTree": {
    "effects": [
      {"id": "e1", "text": "결과 1 — 구체적 사회적 결과"},
      {"id": "e2", "text": "결과 2 — 구체적 사회적 결과"},
      {"id": "e3", "text": "결과 3 — 구체적 사회적 결과"}
    ],
    "coreProblem": "대상 집단·지역·문제 현상을 포함한 핵심 문제 한 문장",
    "causes": [
      {
        "id": "c1",
        "text": "직접 원인 1 (구체적)",
        "children": [
          {"id": "c1-1", "text": "근본 원인 1-1"},
          {"id": "c1-2", "text": "근본 원인 1-2"}
        ]
      },
      {
        "id": "c2",
        "text": "직접 원인 2 (구체적)",
        "children": [
          {"id": "c2-1", "text": "근본 원인 2-1"},
          {"id": "c2-2", "text": "근본 원인 2-2"}
        ]
      },
      {
        "id": "c3",
        "text": "직접 원인 3 (구체적)",
        "children": [
          {"id": "c3-1", "text": "근본 원인 3-1"},
          {"id": "c3-2", "text": "근본 원인 3-2"}
        ]
      }
    ]
  },
  "objectiveTree": {
    "impact": "궁극적 사회 변화 서술 (SDG 번호·명칭 직접 언급 금지)",
    "purpose": "사업 종료 시점에 달성할 구체적 변화 상태 (수혜자, 수치, 지역 포함)",
    "outcomes": [
      {"id": "o1", "text": "직접 원인 1을 긍정 전환한 성과 1 (구체적, 같은 소재 유지)", "level": "outcome", "children": [
        {"id": "o1-1", "text": "근본 원인 1-1을 긍정 전환한 산출물 1.1 (구체적)", "level": "output"},
        {"id": "o1-2", "text": "근본 원인 1-2를 긍정 전환한 산출물 1.2 (구체적)", "level": "output"}
      ]},
      {"id": "o2", "text": "직접 원인 2를 긍정 전환한 성과 2 (구체적, 같은 소재 유지)", "level": "outcome", "children": [
        {"id": "o2-1", "text": "근본 원인 2-1을 긍정 전환한 산출물 2.1 (구체적)", "level": "output"},
        {"id": "o2-2", "text": "근본 원인 2-2를 긍정 전환한 산출물 2.2 (구체적)", "level": "output"}
      ]},
      {"id": "o3", "text": "직접 원인 3을 긍정 전환한 성과 3 (구체적, 같은 소재 유지)", "level": "outcome", "children": [
        {"id": "o3-1", "text": "근본 원인 3-1을 긍정 전환한 산출물 3.1 (구체적)", "level": "output"},
        {"id": "o3-2", "text": "근본 원인 3-2를 긍정 전환한 산출물 3.2 (구체적)", "level": "output"}
      ]}
    ],
    "outputs": [],
    "activities": [
      {"id": "a1-1-1", "text": "활동 1.1.1 (구체적 실행 단위)", "level": "activity"},
      {"id": "a1-1-2", "text": "활동 1.1.2 (구체적 실행 단위)", "level": "activity"},
      {"id": "a1-1-3", "text": "활동 1.1.3 (구체적 실행 단위)", "level": "activity"},
      {"id": "a1-2-1", "text": "활동 1.2.1 (구체적 실행 단위)", "level": "activity"},
      {"id": "a1-2-2", "text": "활동 1.2.2 (구체적 실행 단위)", "level": "activity"},
      {"id": "a1-2-3", "text": "활동 1.2.3 (구체적 실행 단위)", "level": "activity"},
      {"id": "a2-1-1", "text": "활동 2.1.1 (구체적 실행 단위)", "level": "activity"},
      {"id": "a2-1-2", "text": "활동 2.1.2 (구체적 실행 단위)", "level": "activity"},
      {"id": "a2-1-3", "text": "활동 2.1.3 (구체적 실행 단위)", "level": "activity"},
      {"id": "a2-2-1", "text": "활동 2.2.1 (구체적 실행 단위)", "level": "activity"},
      {"id": "a2-2-2", "text": "활동 2.2.2 (구체적 실행 단위)", "level": "activity"},
      {"id": "a2-2-3", "text": "활동 2.2.3 (구체적 실행 단위)", "level": "activity"},
      {"id": "a3-1-1", "text": "활동 3.1.1 (구체적 실행 단위)", "level": "activity"},
      {"id": "a3-1-2", "text": "활동 3.1.2 (구체적 실행 단위)", "level": "activity"},
      {"id": "a3-1-3", "text": "활동 3.1.3 (구체적 실행 단위)", "level": "activity"},
      {"id": "a3-2-1", "text": "활동 3.2.1 (구체적 실행 단위)", "level": "activity"},
      {"id": "a3-2-2", "text": "활동 3.2.2 (구체적 실행 단위)", "level": "activity"},
      {"id": "a3-2-3", "text": "활동 3.2.3 (구체적 실행 단위)", "level": "activity"}
    ]
  },
  "pdm": [
    {
      "id": "pdm-impact", "level": "impact", "code": "Impact",
      "narrative": "장기적 영향 서술 (SDG 번호·명칭 직접 언급 금지)",
      "indicators": "국가 단위 측정 지표",
      "verificationMeans": "국가 통계, UN 보고서",
      "assumptions": "국가 정책 환경 지속",
      "children": []
    },
    {
      "id": "pdm-purpose", "level": "purpose", "code": "OG",
      "narrative": "사업목적 구체적 서술",
      "indicators": "핵심 지표 (기초선: XX, 목표: YY, 측정 시점: 사업 종료 시)",
      "verificationMeans": "모니터링 조사, 행정 데이터",
      "assumptions": "현지 파트너 역량 유지, 정치적 안정",
      "children": []
    },
    {
      "id": "pdm-o1", "level": "outcome", "code": "IM 1",
      "narrative": "성과 1 구체적 서술",
      "indicators": "성과 지표 (기초선: XX, 목표: YY)",
      "verificationMeans": "정기 모니터링 보고서",
      "assumptions": "수혜자 참여 지속",
      "children": [
        {
          "id": "pdm-out-1-1", "level": "output", "code": "Output 1.1",
          "narrative": "산출물 1.1 구체적 서술",
          "indicators": "산출 지표 (수량·질적 지표)",
          "verificationMeans": "사업 완료 보고서",
          "assumptions": "예산 집행 정상",
          "children": [
            {"id": "pdm-act-1-1-1", "level": "activity", "code": "A 1.1.1", "narrative": "구체적 실행 활동 1", "indicators": "완료 기준 지표", "verificationMeans": "활동 보고서", "assumptions": "현장 접근 가능"},
            {"id": "pdm-act-1-1-2", "level": "activity", "code": "A 1.1.2", "narrative": "구체적 실행 활동 2", "indicators": "완료 기준 지표", "verificationMeans": "활동 보고서", "assumptions": "참여 인력 확보"},
            {"id": "pdm-act-1-1-3", "level": "activity", "code": "A 1.1.3", "narrative": "구체적 실행 활동 3", "indicators": "완료 기준 지표", "verificationMeans": "활동 보고서", "assumptions": "예산 적시 집행"}
          ]
        },
        {
          "id": "pdm-out-1-2", "level": "output", "code": "Output 1.2",
          "narrative": "산출물 1.2 구체적 서술",
          "indicators": "산출 지표",
          "verificationMeans": "교육/훈련 기록",
          "assumptions": "참여자 모집 가능",
          "children": [
            {"id": "pdm-act-1-2-1", "level": "activity", "code": "A 1.2.1", "narrative": "구체적 실행 활동 1", "indicators": "완료 기준 지표", "verificationMeans": "활동 보고서", "assumptions": "강사 확보"},
            {"id": "pdm-act-1-2-2", "level": "activity", "code": "A 1.2.2", "narrative": "구체적 실행 활동 2", "indicators": "완료 기준 지표", "verificationMeans": "활동 보고서", "assumptions": "교육 장소 확보"},
            {"id": "pdm-act-1-2-3", "level": "activity", "code": "A 1.2.3", "narrative": "구체적 실행 활동 3", "indicators": "완료 기준 지표", "verificationMeans": "활동 보고서", "assumptions": "교육 자료 준비 완료"}
          ]
        }
      ]
    },
    {
      "id": "pdm-o2", "level": "outcome", "code": "IM 2",
      "narrative": "성과 2 구체적 서술",
      "indicators": "성과 지표 (기초선: XX, 목표: YY)",
      "verificationMeans": "설문조사, 현장 점검",
      "assumptions": "현지 기관 협력 유지",
      "children": [
        {
          "id": "pdm-out-2-1", "level": "output", "code": "Output 2.1",
          "narrative": "산출물 2.1 구체적 서술",
          "indicators": "산출 지표",
          "verificationMeans": "완료 보고서",
          "assumptions": "자재·장비 조달 가능",
          "children": [
            {"id": "pdm-act-2-1-1", "level": "activity", "code": "A 2.1.1", "narrative": "구체적 실행 활동 1", "indicators": "완료 기준 지표", "verificationMeans": "활동 보고서", "assumptions": "자재 수급 안정"},
            {"id": "pdm-act-2-1-2", "level": "activity", "code": "A 2.1.2", "narrative": "구체적 실행 활동 2", "indicators": "완료 기준 지표", "verificationMeans": "활동 보고서", "assumptions": "현장 인력 확보"},
            {"id": "pdm-act-2-1-3", "level": "activity", "code": "A 2.1.3", "narrative": "구체적 실행 활동 3", "indicators": "완료 기준 지표", "verificationMeans": "활동 보고서", "assumptions": "현장 점검 일정 확보"}
          ]
        },
        {
          "id": "pdm-out-2-2", "level": "output", "code": "Output 2.2",
          "narrative": "산출물 2.2 구체적 서술",
          "indicators": "산출 지표",
          "verificationMeans": "완료 보고서",
          "assumptions": "관련 기관 협력 가능",
          "children": [
            {"id": "pdm-act-2-2-1", "level": "activity", "code": "A 2.2.1", "narrative": "구체적 실행 활동 1", "indicators": "완료 기준 지표", "verificationMeans": "활동 보고서", "assumptions": "협력 기관 일정 확보"},
            {"id": "pdm-act-2-2-2", "level": "activity", "code": "A 2.2.2", "narrative": "구체적 실행 활동 2", "indicators": "완료 기준 지표", "verificationMeans": "활동 보고서", "assumptions": "예산 적시 집행"},
            {"id": "pdm-act-2-2-3", "level": "activity", "code": "A 2.2.3", "narrative": "구체적 실행 활동 3", "indicators": "완료 기준 지표", "verificationMeans": "활동 보고서", "assumptions": "결과 점검 체계 마련"}
          ]
        }
      ]
    },
    {
      "id": "pdm-o3", "level": "outcome", "code": "IM 3",
      "narrative": "직접 원인 3을 긍정 전환한 성과 3 구체적 서술",
      "indicators": "성과 지표 (기초선: XX, 목표: YY)",
      "verificationMeans": "설문조사, 현장 점검",
      "assumptions": "관련 기관 협력 유지",
      "children": [
        {
          "id": "pdm-out-3-1", "level": "output", "code": "Output 3.1",
          "narrative": "근본 원인 3-1을 긍정 전환한 산출물 3.1 구체적 서술",
          "indicators": "산출 지표",
          "verificationMeans": "완료 보고서",
          "assumptions": "예산 집행 정상",
          "children": [
            {"id": "pdm-act-3-1-1", "level": "activity", "code": "A 3.1.1", "narrative": "구체적 실행 활동 1", "indicators": "완료 기준 지표", "verificationMeans": "활동 보고서", "assumptions": "현장 접근 가능"},
            {"id": "pdm-act-3-1-2", "level": "activity", "code": "A 3.1.2", "narrative": "구체적 실행 활동 2", "indicators": "완료 기준 지표", "verificationMeans": "활동 보고서", "assumptions": "참여 인력 확보"},
            {"id": "pdm-act-3-1-3", "level": "activity", "code": "A 3.1.3", "narrative": "구체적 실행 활동 3", "indicators": "완료 기준 지표", "verificationMeans": "활동 보고서", "assumptions": "예산 적시 집행"}
          ]
        },
        {
          "id": "pdm-out-3-2", "level": "output", "code": "Output 3.2",
          "narrative": "근본 원인 3-2를 긍정 전환한 산출물 3.2 구체적 서술",
          "indicators": "산출 지표",
          "verificationMeans": "완료 보고서",
          "assumptions": "참여자 모집 가능",
          "children": [
            {"id": "pdm-act-3-2-1", "level": "activity", "code": "A 3.2.1", "narrative": "구체적 실행 활동 1", "indicators": "완료 기준 지표", "verificationMeans": "활동 보고서", "assumptions": "강사 확보"},
            {"id": "pdm-act-3-2-2", "level": "activity", "code": "A 3.2.2", "narrative": "구체적 실행 활동 2", "indicators": "완료 기준 지표", "verificationMeans": "활동 보고서", "assumptions": "교육 장소 확보"},
            {"id": "pdm-act-3-2-3", "level": "activity", "code": "A 3.2.3", "narrative": "구체적 실행 활동 3", "indicators": "완료 기준 지표", "verificationMeans": "활동 보고서", "assumptions": "교육 자료 준비 완료"}
          ]
        }
      ]
    }
  ],
  "pdmInputs": [
    {"id": "input-1", "source": "KOICA", "items": ["3년간 사업비 약 OO원", "사업 모니터링 및 평가 지원"]},
    {"id": "input-2", "source": "굿네이버스 본부", "items": ["3년간 사업비 약 OO원", "사업 총괄 책임자(Project Manager) 파견", "전문가 자문 지원"]},
    {"id": "input-3", "source": "굿네이버스 현지사무소(또는 현지 파트너기관)", "items": ["현지 수행인력(Project Officer) 파견", "행정·협력 체계 구축"]}
  ],
  "insights": [
    {"id": "i1", "category": "문제 정의", "content": "구체적 인사이트 내용", "confidence": "high", "source": "AI 분석"},
    {"id": "i2", "category": "수혜자", "content": "구체적 인사이트 내용", "confidence": "high", "source": "AI 분석"},
    {"id": "i3", "category": "개입 전략", "content": "구체적 인사이트 내용", "confidence": "medium", "source": "전문가 상담"},
    {"id": "i4", "category": "리스크", "content": "구체적 인사이트 내용", "confidence": "medium", "source": "AI 분석"},
    {"id": "i5", "category": "지속가능성", "content": "구체적 인사이트 내용", "confidence": "high", "source": "AI 분석"}
  ]
}`;

    if (!isOpenAIConfigured()) {
      return NextResponse.json({
        success: true,
        data: {
          problemTree: {
            effects: [{ id: 'e1', text: '취약계층 삶의 질 저하' }, { id: 'e2', text: '지역사회 격차 심화' }],
            coreProblem: `${ideation?.country || '대상국'} ${ideation?.field || '해당 분야'} 서비스 접근성 부족`,
            causes: [
              { id: 'c1', text: '인프라 및 시설 부족', children: [{ id: 'c1-1', text: '재원 부족' }, { id: 'c1-2', text: '지역 접근성 문제' }] },
              { id: 'c2', text: '전문 인력 역량 부족', children: [{ id: 'c2-1', text: '교육·훈련 기회 제한' }] },
            ],
          },
          objectiveTree: {
            impact: `SDG 관련 목표 달성 기여 — ${ideation?.field || '해당 분야'} 분야 지속가능 발전`,
            purpose: `${ideation?.country || '대상국'} 사업 지역 ${ideation?.field || '해당 분야'} 서비스 접근성 및 질 향상`,
            outcomes: [
              { id: 'o1', text: '인프라·시설 개선', level: 'outcome', children: [{ id: 'o1-1', text: '시설 신·개축', level: 'output' }, { id: 'o1-2', text: '기자재 지원', level: 'output' }] },
              { id: 'o2', text: '인력 역량 강화', level: 'outcome', children: [{ id: 'o2-1', text: '전문가 양성 교육', level: 'output' }] },
            ],
            outputs: [],
            activities: [
              { id: 'a1-1-1', text: '수요 조사 및 설계', level: 'activity' },
              { id: 'a1-1-2', text: '시설 건축·개보수', level: 'activity' },
              { id: 'a2-1-1', text: '역량 강화 교육 실시', level: 'activity' },
            ],
          },
          pdm: [
            { id: 'pdm-impact', level: 'impact', code: 'Impact', narrative: `${ideation?.field || '해당 분야'} 분야 지속가능 발전 기여`, indicators: 'SDG 관련 국가 지표', verificationMeans: '국가 통계, UN 보고서', assumptions: '국가 정책 지속', children: [] },
            { id: 'pdm-purpose', level: 'purpose', code: 'OG', narrative: `사업 지역 ${ideation?.field || '해당 분야'} 서비스 접근성 향상`, indicators: '서비스 이용률 (기초선: TBD, 목표: +30%)', verificationMeans: '모니터링 조사', assumptions: '현지 파트너 지속 협력', children: [] },
            { id: 'pdm-o1', level: 'outcome', code: 'IM 1', narrative: '인프라 및 시설 개선', indicators: '개선 시설 수, 이용자 수', verificationMeans: '현장 점검 보고서', assumptions: '지역사회 참여 유지', children: [
              { id: 'pdm-out-1-1', level: 'output', code: 'Output 1.1', narrative: '시설 신·개축', indicators: '시설 X개소', verificationMeans: '완공 보고서', assumptions: '예산 집행 정상', children: [] },
            ]},
          ],
          pdmInputs: [
            { id: 'input-1', source: 'KOICA', items: ['3년간 사업비 약 OO원'] },
            { id: 'input-2', source: '굿네이버스 본부', items: ['3년간 사업비 약 OO원', '사업 총괄 책임자(Project Manager) 파견'] },
            { id: 'input-3', source: '굿네이버스 현지사무소', items: ['현지 수행인력(Project Officer) 파견'] },
          ],
          insights: [
            { id: 'i1', category: '문제 정의', content: `${ideation?.country || '대상국'} ${ideation?.field || '해당 분야'} 현황 기반 문제 구조화 필요`, confidence: 'high', source: '데모 모드' },
            { id: 'i2', category: '수혜자', content: '직·간접 수혜자 성별·연령 분류 및 참여형 수요 조사 권장', confidence: 'medium', source: '데모 모드' },
            { id: 'i3', category: '개입 전략', content: 'KOICA CPS 우선순위와 연계한 개입 방안 구체화 필요', confidence: 'high', source: '데모 모드' },
          ],
        },
      });
    }

    const result = await generateTextPro([{ role: 'user', content: userMessage }], systemPrompt);
    const parsed = parseAIJson(result) as any;
    if (parsed?.pdmInputs) parsed.pdmInputs = sanitizePdmInputs(parsed.pdmInputs);

    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    const message = error instanceof Error ? error.message : '구조 생성 중 오류가 발생했습니다.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
