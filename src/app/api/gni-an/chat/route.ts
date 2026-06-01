import { NextRequest } from 'next/server';
import { streamText, isOpenAIConfigured } from '@/lib/api/openai';

const SYSTEM_PROMPT = `당신은 GNI-AN(지니안)의 AI 어시스턴트입니다. 굿네이버스의 KOICA 시민사회협력사업 제안서 작성을 돕는 전문 도우미입니다.

주요 역할:
- KOICA 제안서 작성 방법 및 구조 안내
- 사업 아이디어 구체화 지원
- PDM, 논리 모델, 사업 목표 설정 조언
- KOICA 심사 기준 및 평가 요소 설명
- 개발협력 분야(교육, 보건, 농업, 거버넌스 등) 전문 지식 제공

응답 원칙:
- 한국어로 친절하고 명확하게 답변
- 실용적이고 구체적인 조언 제공
- 간결하게 핵심만 전달`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!isOpenAIConfigured()) {
      const encoder = new TextEncoder();
      const mock = 'API 키가 설정되지 않았습니다. .env.local 파일에 GROQ_API_KEY를 입력하시면 실제 AI 답변을 받으실 수 있습니다.';
      const mockStream = new ReadableStream({
        start(controller) { controller.enqueue(encoder.encode(mock)); controller.close(); },
      });
      return new Response(mockStream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          await streamText(messages, SYSTEM_PROMPT, (chunk) => {
            controller.enqueue(encoder.encode(chunk));
          });
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  } catch (err) {
    const message = err instanceof Error ? err.message : '오류가 발생했습니다.';
    return Response.json({ error: message }, { status: 500 });
  }
}
