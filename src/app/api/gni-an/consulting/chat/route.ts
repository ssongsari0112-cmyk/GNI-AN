import { NextRequest, NextResponse } from 'next/server';
import { streamText, isOpenAIConfigured } from '@/lib/api/openai';

export async function POST(req: NextRequest) {
  try {
    const { expertType, expertTitle, messages, ideation, analysis } = await req.json();

    const systemPrompts: Record<string, string> = {
      field: `당신은 ${ideation?.field || '해당 분야'} 분야의 국제개발 전문가입니다.
KOICA 시민사회협력사업 제안서 작성을 돕고 있습니다.
분야별 핵심 문제, 이해관계자, 성과 지표, 실패 요인 등에 대해 전문적인 조언을 제공하세요.
${ideation?.field} 분야의 최신 국제개발 동향과 모범사례를 바탕으로 답변하세요.
답변은 간결하고 실용적이며 제안서 작성에 직접 활용할 수 있도록 작성하세요.`,

      regional: `당신은 ${ideation?.country || '해당 지역'} 지역 전문가입니다.
해당 국가의 개발 현황, KOICA CPS, 현지 리스크, 파트너 기관 등에 대해 전문적인 조언을 제공하세요.
국가별 정치·경제·사회·문화적 맥락과 최신 동향을 바탕으로 실질적인 조언을 하세요.`,

      planning: `당신은 국제개발 사업기획 전문가입니다.
Problem Tree, Theory of Change, 사업 설계, 출구 전략 등 사업기획 전반에 대해 전문적인 조언을 제공하세요.
KOICA 시민사회협력사업의 심사 기준과 작성 요건을 잘 알고 있습니다.`,

      me: `당신은 국제개발 M&E(모니터링 및 평가) 전문가입니다.
SMART 지표 설계, 기초선 조사, 데이터 수집 방법, 모니터링 체계 구축 등에 대해 전문적인 조언을 제공하세요.
OECD DAC 평가 기준과 국제 표준 지표 프레임워크를 활용한 실용적인 답변을 제공하세요.`,
    };

    const systemPrompt = systemPrompts[expertType] || systemPrompts.field;
    const contextPrompt = `${systemPrompt}

사업 맥락:
- 분야: ${ideation?.field || '미지정'}
- 국가: ${ideation?.country || '미지정'}
- 아이디어: ${ideation?.idea || '미지정'}
- 핵심 문제: ${analysis?.coreProblem || '분석 중'}

[답변 원칙]
- 최소 300자 이상, 실질적인 내용을 충분히 담아 답변하세요
- 단순 나열보다는 이유와 근거를 함께 설명하세요
- 제안서에 바로 활용할 수 있는 구체적인 표현, 수치, 사례를 포함하세요
- 마크다운 형식 사용: **볼드**로 핵심 강조, 목록(- )으로 항목 정리, ## 소제목으로 구분
- 필요하면 '예시:', '참고:' 등으로 실제 사례나 수치를 제시하세요

[중요] 반드시 순수한 한국어(한글)로만 답변하세요. 한자, 중국어, 일본어 문자를 절대 사용하지 마세요. 숫자와 영문 약어(NGO, KOICA 등)는 허용됩니다.`;

    if (!isOpenAIConfigured()) {
      const encoder = new TextEncoder();
      const mockMsg = `안녕하세요! ${expertTitle}입니다. (API 키 미설정 — 데모 모드)\n\n질문 주신 내용은 API 키를 .env.local에 입력하시면 실제 AI 전문가 답변을 받으실 수 있습니다. 지금은 다음 단계로 진행해 보세요.`;
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(mockMsg));
          controller.close();
        },
      });
      return new NextResponse(mockStream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' },
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await streamText(messages, contextPrompt, (chunk) => {
            controller.enqueue(encoder.encode(chunk));
          });
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '채팅 중 오류가 발생했습니다.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
