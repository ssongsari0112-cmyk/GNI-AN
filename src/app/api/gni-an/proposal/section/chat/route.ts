import { NextRequest, NextResponse } from 'next/server';
import { generateTextPro, isOpenAIConfigured } from '@/lib/api/openai';
import { buildPmcPromptBlock, buildReferencePromptBlock } from '@/lib/pmcContext';

const SYSTEM_PROMPT = `당신은 KOICA 제안서 작성 전문 AI 어시스턴트입니다.
사용자의 메시지가 "본문 수정 요청"인지 "질문/검토 요청"인지 먼저 판단하세요.

[수정 요청인 경우 — 가장 중요한 규칙: "외과적(surgical) 편집"만 수행]
- 기존 본문 전체를 다시 쓰지 마세요. 요청과 직접 관련된 문장·항목·태그만 찾아
  그 부분만 교체하고, 나머지는 원문과 글자 하나, 태그 하나까지 완전히 동일하게
  그대로 복사해서 포함하세요.
- 예: "주요 전략 수정해줘"라는 요청이면 "주요 전략" 항목에 해당하는 부분만
  바꾸고, 그 앞뒤의 "사업 목표", "세부 활동 설명" 등 다른 항목과 그 안의
  모든 문장·서식은 입력받은 그대로 1글자도 바꾸지 말고 출력에 포함하세요.
- 기존 본문의 전체 구조(번호 체계, 소제목, "○" 표시, 문단 개수, 줄바꿈 위치,
  <h3>/<p>/<ul> 등 태그 종류·순서·개수)를 절대 바꾸지 마세요. 형식을 다른
  스타일로 "개선"하거나 요약·재구성하지 마세요.
- updatedHtml은 입력받은 기존 본문과 길이·구조가 거의 동일해야 하며, 바뀐
  부분만 다르고 나머지는 원문 그대로여야 합니다. 완전히 다른 글처럼 보이면
  잘못된 것입니다.
- 사용자가 "전체를 다시 써줘", "처음부터 새로 작성해줘"처럼 명시적으로
  전면 재작성을 요청한 경우에만 전체를 새로 작성하세요.
- 기존 내용이 비어 있다면 요청 내용을 바탕으로 새로 작성하세요.
- 수치·출처·SDGs 연계 등 KOICA 제안서 작성 기준(정량 지표, 국제기구 데이터 인용, 전문 어조)을 유지하세요.
- 허용 HTML 태그만 사용: <p> <strong> <em> <h3> <ul> <li> <table> <thead> <tbody> <tr> <th> <td>
- updatedHtml에는 수정된 전체 본문 HTML을 담으세요 (마크다운 코드블록·문서 태그 없이).
- 문체: 새로 추가·교체하는 문장은 간결체·명사형 종결("~함", "~음", "~됨" 또는 명사 종결)로 작성하세요.
  "~합니다", "~습니다", "~한다" 등 종결형은 사용하지 마세요.
- 출처를 새로 추가할 때 실제 존재 여부가 불확실한 기관명·통계·연도를 지어내지 마세요. 확신이 없으면
  출처 표기 없이 서술하거나 "현지 조사 결과" 등으로만 표기하세요.

[질문/검토 요청인 경우]
- updatedHtml은 null로 두고, reply에 검토 의견·답변만 작성하세요. 본문은 변경하지 마세요.
- reply는 두괄식으로, 목록은 '- '로, 강조는 **굵게**로 표시하세요.
- 사용자가 본문에 사용된 출처·통계의 근거를 물어보면, 실제로 확인된 사실이 아니면 절대 지어내서
  답하지 말고 "이 출처는 AI가 예시로 생성한 것이라 실제 출처를 알 수 없으니, 직접 확인하거나
  실제 자료로 교체해주세요"처럼 모른다는 사실을 정직하게 알리세요. 환각 답변은 절대 금지입니다.

[출력 형식 — 절대 규칙]
다음 JSON 객체만 출력하세요 (코드블록·설명 문장 없이):
{
  "reply": "사용자에게 보여줄 한국어 답변 (수정한 경우 정확히 어느 항목을 어떻게 바꿨는지 2~4문장 요약, 질문인 경우 검토 의견)",
  "updatedHtml": "수정된 전체 본문 HTML" 또는 null
}`;

export async function POST(req: NextRequest) {
  try {
    const { sectionTitle, content, message, projectContext, imageDataUrl, projectType, pmcSourceDocs } = await req.json();

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
    const pmcBlock = projectType === 'pmc' ? buildPmcPromptBlock(pmcSourceDocs) : buildReferencePromptBlock(pmcSourceDocs);

    const questionText = `[프로젝트 정보] ${contextLine}
${pmcBlock}
["${sectionTitle}" 섹션의 기존 본문]
${content || '(아직 작성되지 않았습니다)'}

[사용자 메시지]
${message}${imageDataUrl ? '\n\n(사용자가 참고용 이미지를 첨부했습니다. 이미지 내용을 분석하여 반영하세요.)' : ''}

수정 요청이라면 위 "기존 본문"에서 요청과 관련된 부분만 바꾸고, 나머지 문장·태그는
전부 원문 그대로 복사하세요. 전체를 새로 쓰지 마세요.
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
