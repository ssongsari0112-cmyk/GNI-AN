import { NextRequest, NextResponse } from 'next/server';
import { generateText, isApiKeyConfigured } from '@/lib/api/anthropic';

export async function POST(req: NextRequest) {
  try {
    const { ideation, analysis, expertSessions } = await req.json();

    const consultingContext = expertSessions
      ?.map((s: { expertId: string; summary?: string }) => `[${s.expertId} 전문가 상담]: ${s.summary || ''}`)
      .join('\n') || '';

    const systemPrompt = `당신은 KOICA 시민사회협력사업 전문가로, 문제분석, 목표체계, PDM을 설계하는 전문가입니다.
반드시 유효한 JSON만 반환하세요. 마크다운 코드블록 없이 순수 JSON을 반환하세요.`;

    const userMessage = `다음 정보를 바탕으로 사업 구조를 생성해주세요:

사업 분야: ${ideation?.field}
대상 국가: ${ideation?.country}
사업 아이디어: ${ideation?.idea}
핵심 문제: ${analysis?.coreProblem}
개입 방안: ${analysis?.interventionApproach}
기대 성과: ${analysis?.expectedOutcomes}

전문가 상담 인사이트:
${consultingContext}

다음 JSON 형식으로 반환해주세요:
{
  "problemTree": {
    "effects": [
      {"id": "e1", "text": "결과1"},
      {"id": "e2", "text": "결과2"}
    ],
    "coreProblem": "핵심 문제 한 문장",
    "causes": [
      {
        "id": "c1",
        "text": "직접 원인 1",
        "children": [{"id": "c1-1", "text": "근본 원인 1-1"}]
      }
    ]
  },
  "objectiveTree": {
    "impact": "영향(Impact): SDGs 연계 궁극적 변화",
    "purpose": "사업목적: 사업 종료 시 달성 목표",
    "outcomes": [
      {"id": "o1", "text": "성과 1", "level": "outcome", "children": [
        {"id": "o1-1", "text": "산출물 1.1", "level": "output"},
        {"id": "o1-2", "text": "산출물 1.2", "level": "output"}
      ]},
      {"id": "o2", "text": "성과 2", "level": "outcome", "children": [
        {"id": "o2-1", "text": "산출물 2.1", "level": "output"}
      ]}
    ],
    "outputs": [],
    "activities": [
      {"id": "a1-1-1", "text": "활동 1.1.1", "level": "activity"},
      {"id": "a1-1-2", "text": "활동 1.1.2", "level": "activity"},
      {"id": "a2-1-1", "text": "활동 2.1.1", "level": "activity"}
    ]
  },
  "pdm": [
    {
      "id": "pdm-impact",
      "level": "impact",
      "code": "Impact",
      "narrative": "영향 서술",
      "indicators": "영향 지표",
      "verificationMeans": "검증수단",
      "assumptions": "외부 가정",
      "children": []
    },
    {
      "id": "pdm-purpose",
      "level": "purpose",
      "code": "OG",
      "narrative": "사업목적 서술",
      "indicators": "지표 (기초선: XX%, 목표: XX%)",
      "verificationMeans": "검증수단",
      "assumptions": "가정",
      "children": []
    },
    {
      "id": "pdm-o1",
      "level": "outcome",
      "code": "IM 1",
      "narrative": "성과 1 서술",
      "indicators": "성과지표",
      "verificationMeans": "검증수단",
      "assumptions": "가정",
      "children": [
        {
          "id": "pdm-output-1-1",
          "level": "output",
          "code": "Output 1.1",
          "narrative": "산출물 서술",
          "indicators": "산출 지표",
          "verificationMeans": "검증수단",
          "assumptions": "가정",
          "children": []
        }
      ]
    }
  ],
  "insights": [
    {"id": "i1", "category": "문제 정의", "content": "인사이트 내용", "confidence": "high", "source": "AI 분석"},
    {"id": "i2", "category": "수혜자", "content": "인사이트 내용", "confidence": "medium", "source": "전문가 상담"},
    {"id": "i3", "category": "개입 전략", "content": "인사이트 내용", "confidence": "high", "source": "AI 분석"}
  ]
}`;

    if (!isApiKeyConfigured()) {
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
    const parsed = JSON.parse(result);

    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    const message = error instanceof Error ? error.message : '구조 생성 중 오류가 발생했습니다.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
