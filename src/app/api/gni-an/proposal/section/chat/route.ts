import { NextRequest, NextResponse } from 'next/server';
import { generateTextPro, isOpenAIConfigured } from '@/lib/api/openai';

const SYSTEM_PROMPT = `당신은 KOICA 제안서 작성 전문 AI 어시스턴트입니다.
사용자의 메시지가 "본문 수정 요청"인지 "질문/검토 요청"인지 먼저 판단하세요.

[수정 요청인 경우]
- 기존 본문 내용 중 요청과 관련 없는 부분은 그대로 유지하고, 요청된 부분만 정확히 고치세요.
- 기존 내용이 비어 있다면 요청 내용을 바탕으로 새로 작성하세요.
- 수치·출처·SDGs 연계 등 KOICA 제안서 작성 기준(정량 지표, 국제기구 데이터 인용, 전문 어조)을 유지하세요.
- 허용 HTML 태그만 사용: <p> <strong> <em> <h3> <ul> <li> <table> <thead> <tbody> <tr> <th> <td>
- updatedHtml에는 수정된 전체 본문 HTML을 담으세요 (마크다운 코드블록·문서 태그 없이).

[질문/검토 요청인 경우]
- updatedHtml은 null로 두고, reply에 검토 의견·답변만 작성하세요. 본문은 변경하지 마세요.
- reply는 두괄식으로, 목록은 '- '로, 강조는 **굵게**로 표시하세요.

[출력 형식 — 절대 규칙]
다음 JSON 객체만 출력하세요 (코드블록·설명 문장 없이):
{
  "reply": "사용자에게 보여줄 한국어 답변 (수정한 경우 무엇을 바꿨는지 2~4문장 요약, 질문인 경우 검토 의견)",
  "updatedHtml": "수정된 전체 본문 HTML" 또는 null
}`;

export async function POST(req: NextRequest) {
  try {
    const { sectionTitle, content, message, projectContext, imageDataUrl } = await req.json();

    if (!isOpenAIConfigured()) {
      return NextResponse.json({
        success: true,
        reply: 'AI가 설정되지 않아 자동 수정을 사용할 수 없습니다. .env.local에 OPENAI_API_KEY를 설정해주세요.',
        updatedHtml: null,
      });
    }

    const contextLine = projectContext
      ? `분야=${projectContext.field || '-'}, 국가=${projectContext.country || '-'}, 사업명=${projectContext.title || '미지정'}`
      : '';

    const questionText = `[프로젝트 정보] ${contextLine}

["${sectionTitle}" 섹션의 기존 본문]
${content || '(아직 작성되지 않았습니다)'}

[사용자 메시지]
${message}${imageDataUrl ? '\n\n(사용자가 참고용 이미지를 첨부했습니다. 이미지 내용을 분석하여 반영하세요.)' : ''}

위 형식의 JSON 객체만 출력:`;

    const userContent = imageDataUrl
      ? [
          { type: 'text' as const, text: questionText },
          { type: 'image_url' as const, image_url: { url: imageDataUrl } },
        ]
      : questionText;

    const raw = await generateTextPro([{ role: 'user', content: userContent }], SYSTEM_PROMPT);
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let parsed: { reply?: string; updatedHtml?: unknown } = {};
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ success: true, reply: raw, updatedHtml: null });
    }

    const updatedHtml = typeof parsed.updatedHtml === 'string' ? parsed.updatedHtml : null;

    return NextResponse.json({
      success: true,
      reply: parsed.reply || '처리했습니다.',
      updatedHtml,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
