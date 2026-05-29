import { NextRequest, NextResponse } from 'next/server';
import { generateText, isApiKeyConfigured } from '@/lib/api/anthropic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { field, country, subRegion, idea, beneficiaries, budget, duration } = body;

    if (!isApiKeyConfigured()) {
      return NextResponse.json({
        success: true,
        data: {
          coreProblem: `${country}의 ${field} 분야에서 취약계층이 겪는 서비스 접근성 부족 문제입니다. 지역 내 인프라·인력·역량 부족이 복합적으로 작용하고 있습니다.`,
          targetBeneficiaries: beneficiaries || `${country} 농촌 지역 취약계층 및 지역사회 구성원`,
          interventionApproach: `${field} 분야 역량 강화 프로그램 운영 및 인프라 개선을 통한 단계적 접근`,
          expectedOutcomes: `직접 수혜자의 ${field} 서비스 접근성 향상 및 지속가능한 지역사회 역량 구축`,
          recommendedExperts: [`${field} 분야 전문가`, `${country} 지역 전문가`, '사업기획 전문가', 'M&E 전문가'],
          keyInsights: [
            `${country}의 ${field} 분야 현황과 KOICA CPS 연계 전략 검토 필요`,
            '수혜자 참여 기반의 수요 조사로 사업 타당성 강화 권장',
            '현지 파트너 역량 분석을 통한 협력 체계 구체화 필요',
          ],
        },
      });
    }

    const systemPrompt = `당신은 KOICA 시민사회협력사업 전문가입니다.
사용자가 입력한 사업 아이디어를 분석하여 JSON 형식으로 결과를 반환합니다.
항상 유효한 JSON만 반환하세요. 마크다운 코드블록 없이 순수 JSON만 반환하세요.`;

    const userMessage = `다음 사업 아이디어를 분석해주세요:
- 사업 분야: ${field}
- 대상 국가: ${country}
- 세부 지역: ${subRegion || '미지정'}
- 사업 아이디어: ${idea}
- 주요 수혜자: ${beneficiaries || '미지정'}
- 총사업비: ${budget || '미지정'}
- 예상 기간: ${duration || '미지정'}

다음 JSON 형식으로 분석 결과를 반환해주세요:
{
  "coreProblem": "핵심 문제 (2-3문장)",
  "targetBeneficiaries": "대상 수혜자 설명",
  "interventionApproach": "개입 방안 설명",
  "expectedOutcomes": "기대 성과 설명",
  "recommendedExperts": ["${field} 분야 전문가", "${country} 지역 전문가", "사업기획 전문가", "M&E 전문가"],
  "keyInsights": ["인사이트1", "인사이트2", "인사이트3"]
}`;

    const result = await generateText([{ role: 'user', content: userMessage }], systemPrompt);
    const parsed = JSON.parse(result);

    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    const message = error instanceof Error ? error.message : '분석 중 오류가 발생했습니다.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
