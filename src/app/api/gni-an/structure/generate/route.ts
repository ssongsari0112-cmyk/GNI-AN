import { NextRequest, NextResponse } from 'next/server';
import { generateText, isOpenAIConfigured } from '@/lib/api/openai';
import { PROMPTS } from '@/lib/prompts';
import { parseAIJson } from '@/lib/parseJSON';

export async function POST(req: NextRequest) {
  try {
    const { ideation, analysis, expertSessions } = await req.json();

    const consultingContext = expertSessions
      ?.map((s: { expertId: string; summary?: string }) => `[${s.expertId} 전문가 상담]: ${s.summary || ''}`)
      .join('\n') || '';

    const systemPrompt = PROMPTS.structureSystem;

    const userMessage = `다음 정보를 바탕으로 KOICA 시민사회협력사업 구조를 상세하게 생성해주세요.
모든 항목은 실제 제안서에 바로 활용할 수 있는 수준으로 구체적이고 현실적으로 작성하세요.

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

아래 JSON 구조를 그대로 따르되, 모든 값을 위 사업 정보에 맞게 구체적으로 채워주세요:
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
          {"id": "c3-1", "text": "근본 원인 3-1"}
        ]
      }
    ]
  },
  "objectiveTree": {
    "impact": "SDG X.X 연계 — 궁극적 사회 변화 서술",
    "purpose": "사업 종료 시점에 달성할 구체적 변화 상태 (수혜자, 수치, 지역 포함)",
    "outcomes": [
      {"id": "o1", "text": "성과 1 (구체적)", "level": "outcome", "children": [
        {"id": "o1-1", "text": "산출물 1.1 (구체적)", "level": "output"},
        {"id": "o1-2", "text": "산출물 1.2 (구체적)", "level": "output"}
      ]},
      {"id": "o2", "text": "성과 2 (구체적)", "level": "outcome", "children": [
        {"id": "o2-1", "text": "산출물 2.1 (구체적)", "level": "output"},
        {"id": "o2-2", "text": "산출물 2.2 (구체적)", "level": "output"}
      ]}
    ],
    "outputs": [],
    "activities": [
      {"id": "a1-1-1", "text": "활동 1.1.1", "level": "activity"},
      {"id": "a1-1-2", "text": "활동 1.1.2", "level": "activity"},
      {"id": "a1-2-1", "text": "활동 1.2.1", "level": "activity"},
      {"id": "a2-1-1", "text": "활동 2.1.1", "level": "activity"},
      {"id": "a2-2-1", "text": "활동 2.2.1", "level": "activity"}
    ]
  },
  "pdm": [
    {
      "id": "pdm-impact", "level": "impact", "code": "Impact",
      "narrative": "SDG 연계 영향 서술",
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
          "children": []
        },
        {
          "id": "pdm-out-1-2", "level": "output", "code": "Output 1.2",
          "narrative": "산출물 1.2 구체적 서술",
          "indicators": "산출 지표",
          "verificationMeans": "교육/훈련 기록",
          "assumptions": "참여자 모집 가능",
          "children": []
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
          "children": []
        }
      ]
    }
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
          insights: [
            { id: 'i1', category: '문제 정의', content: `${ideation?.country || '대상국'} ${ideation?.field || '해당 분야'} 현황 기반 문제 구조화 필요`, confidence: 'high', source: '데모 모드' },
            { id: 'i2', category: '수혜자', content: '직·간접 수혜자 성별·연령 분류 및 참여형 수요 조사 권장', confidence: 'medium', source: '데모 모드' },
            { id: 'i3', category: '개입 전략', content: 'KOICA CPS 우선순위와 연계한 개입 방안 구체화 필요', confidence: 'high', source: '데모 모드' },
          ],
        },
      });
    }

    const result = await generateText([{ role: 'user', content: userMessage }], systemPrompt);
    const parsed = parseAIJson(result) as any;

    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    const message = error instanceof Error ? error.message : '구조 생성 중 오류가 발생했습니다.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
