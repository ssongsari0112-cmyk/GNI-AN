import { NextRequest, NextResponse } from 'next/server';
import { generateText, isApiKeyConfigured } from '@/lib/api/anthropic';

export async function POST(req: NextRequest) {
  try {
    const { ideation, analysis, structure, expertSessions } = await req.json();

    const systemPrompt = `당신은 KOICA 시민사회협력사업 제안서 전문 작성 보조 AI입니다.
사업개요서의 각 섹션을 전문적이고 구체적으로 작성합니다.
반드시 유효한 JSON만 반환하세요. 마크다운 코드블록 없이 순수 JSON을 반환하세요.`;

    const userMessage = `다음 정보를 바탕으로 사업개요서를 생성해주세요:

분야: ${ideation?.field}
국가: ${ideation?.country}
아이디어: ${ideation?.idea}
핵심 문제: ${analysis?.coreProblem}
개입 방안: ${analysis?.interventionApproach}
기대 성과: ${analysis?.expectedOutcomes}
수혜자: ${analysis?.targetBeneficiaries}
사업목적: ${structure?.objectiveTree?.purpose || ''}
영향: ${structure?.objectiveTree?.impact || ''}

다음 JSON 형식으로 반환해주세요:
{
  "basicInfo": {
    "title": "사업명 (구체적이고 정책적으로)",
    "summary": "사업 요약 (3-4문장)"
  },
  "background": {
    "background": "사업 배경 (국가 현황, SDGs 연계, KOICA CPS 부합성 포함)",
    "demandAnalysis": "수요 분석 (현지 수요, 기초선 데이터, 지역 선정 근거)"
  },
  "objectives": {
    "impact": "영향 (Impact): SDGs와 연계한 궁극적 변화",
    "purpose": "사업목적 (Outcome): 사업 종료 시 달성할 직접 성과",
    "outcomes": "주요 성과 목록 (bullet point 형태)"
  },
  "beneficiaries": {
    "direct": "직접 수혜자: 성별·연령별 분류 포함",
    "indirect": "간접 수혜자: 지역사회, 가족 등"
  },
  "implementation": {
    "approach": "수행 방법: 주요 활동과 접근법",
    "partnershipStrategy": "파트너십 전략: 현지 파트너 역할과 협력 방안"
  },
  "risks": {
    "mainRisks": "주요 리스크와 완화 방안",
    "sustainabilityPlan": "지속가능성 계획: 출구 전략, 역량 이전"
  }
}`;

    if (!isApiKeyConfigured()) {
      return NextResponse.json({
        success: true,
        data: {
          basicInfo: {
            title: `${ideation?.country || '대상국'} ${ideation?.field || '해당 분야'} 역량 강화 및 접근성 향상 사업`,
            summary: `본 사업은 ${ideation?.country || '대상국'}의 ${ideation?.field || '해당 분야'} 분야 취약계층 대상 서비스 접근성 향상을 목표로 합니다. KOICA 시민사회협력사업으로 추진되며 현지 파트너와의 협력을 통해 지속가능한 변화를 도모합니다.`,
          },
          background: {
            background: `${ideation?.country || '대상국'}은 ${ideation?.field || '해당 분야'} 분야에서 심각한 서비스 접근성 문제를 안고 있습니다. 본 사업은 SDGs 및 KOICA CPS와 연계하여 이를 해결하고자 합니다.`,
            demandAnalysis: '현지 수요 조사 결과, 사업 지역 주민의 다수가 기본 서비스에 접근하지 못하는 것으로 나타났으며, 지역사회 차원의 개입이 필요합니다.',
          },
          objectives: {
            impact: `${ideation?.field || '해당 분야'} 분야 SDG 목표 달성 기여`,
            purpose: `사업 지역 ${ideation?.field || '해당 분야'} 서비스 접근성 및 질적 수준 향상`,
            outcomes: '• 인프라·시설 개선\n• 전문 인력 역량 강화\n• 지역사회 인식 제고',
          },
          beneficiaries: {
            direct: `직접 수혜자: 사업 지역 주민 (성별·연령별 구성 추후 기재)`,
            indirect: '간접 수혜자: 지역사회 전체, 수혜자 가족 및 지역 주민',
          },
          implementation: {
            approach: '수요 조사 → 시설 개선 → 역량 강화 교육 → 모니터링·평가의 단계적 접근',
            partnershipStrategy: '현지 NGO·정부 기관과의 협력을 통해 현지화된 사업 수행 및 역량 이전 추진',
          },
          risks: {
            mainRisks: '• 현지 정치·보안 리스크: 정기적 상황 모니터링\n• 파트너 역량 리스크: 사전 역량 평가 및 교육\n• 기후·재난 리스크: 비상 대응 계획 수립',
            sustainabilityPlan: '현지 파트너 역량 강화를 통한 자립 기반 마련, 정부 예산 연계 출구 전략 설계',
          },
        },
      });
    }

    const result = await generateText([{ role: 'user', content: userMessage }], systemPrompt);
    const parsed = JSON.parse(result);

    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    const message = error instanceof Error ? error.message : '개요서 생성 중 오류가 발생했습니다.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
