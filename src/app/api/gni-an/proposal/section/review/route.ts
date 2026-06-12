import { NextRequest, NextResponse } from 'next/server';
import { streamText, isOpenAIConfigured } from '@/lib/api/openai';

export async function POST(req: NextRequest) {
  try {
    const { sectionId, sectionTitle, content, question, projectContext } = await req.json();

    const systemPrompt = `당신은 KOICA 시민사회협력사업 제안서 작성 전문 AI 어시스턴트입니다.
현재 "${sectionTitle}" 섹션 작성을 돕고 있습니다.
제안서 심사 기준에 맞는 구체적이고 실용적인 피드백을 제공하세요.
사용자의 질문에 직접 답변하고, 개선 방향을 제시하되 직접 내용을 수정하지 않습니다.
사용자가 내용을 선택적으로 반영할 수 있도록 제안 형태로 답변하세요.

[답변 형식 원칙]
- 답변의 맨 앞에서 핵심 결론이나 제안을 먼저 제시하세요(두괄식)
- 항목으로 정리할 수 있는 내용은 줄바꿈 후 '- '로 시작하는 목록을 적극 활용하세요
- 강조할 부분은 **굵게** 표시하세요 (별표 두 개로 감싸기)
- 문장을 길게 이어쓰지 말고, 의미 단위로 줄바꿈하여 가독성을 높이세요
- 마크다운 기호(#, *, - 등)를 텍스트에 그대로 노출하지 말고, 정해진 문법대로만 사용하세요`;

    const contextInfo = projectContext
      ? `프로젝트 정보: 분야=${projectContext.field}, 국가=${projectContext.country}, 사업명=${projectContext.title || '미지정'}`
      : '';

    if (!isOpenAIConfigured()) {
      const encoder = new TextEncoder();
      const mock = `[데모 모드] API 키를 .env.local에 입력하시면 "${sectionTitle}" 섹션에 대한 실제 AI 검토를 받으실 수 있습니다.\n\n지금은 내용을 자유롭게 작성하고 다음 단계로 진행해 보세요.`;
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(mock));
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
          const messages = [
            {
              role: 'user' as const,
              content: `${contextInfo}

현재 작성된 내용:
${content || '(아직 작성되지 않았습니다)'}

질문: ${question}`,
            },
          ];
          await streamText(messages, systemPrompt, (chunk) => {
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
    const message = error instanceof Error ? error.message : '검토 중 오류가 발생했습니다.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
