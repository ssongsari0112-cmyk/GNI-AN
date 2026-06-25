import { NextRequest, NextResponse } from 'next/server';
import { generateText, isOpenAIConfigured } from '@/lib/api/openai';

const SYSTEM_PROMPT = `당신은 KOICA 제안서 작성 전문가입니다.
주어진 섹션의 기존 내용을 "반영할 피드백/지시"에 따라 직접 수정한 최종본을 작성하세요.

[작성 원칙]
- 기존 내용 중 피드백과 관련 없는 부분은 그대로 유지하세요.
- 피드백에서 지적된 문제만 정확히 고치세요. 불필요하게 전체를 새로 쓰지 마세요.
- 기존 내용이 비어 있다면 피드백/지시 내용을 바탕으로 새로 작성하세요.
- 수치·출처·SDGs 등 KOICA 제안서 작성 기준(정량 지표, 국제기구 데이터 인용, 전문 어조)을 유지하세요.
- 문체: 새로 추가·교체하는 문장은 간결체·명사형 종결("~함", "~음", "~됨" 또는 명사 종결)로 작성하세요.
  "~합니다", "~습니다", "~한다" 등 종결형은 사용하지 마세요.
- 출처를 새로 추가할 때 실제 존재 여부가 불확실한 기관명·통계·연도를 지어내지 마세요. 확신이 없으면
  출처 표기 없이 서술하거나 "현지 조사 결과" 등으로만 표기하세요.

[출력 형식]
- 허용 태그: <p> <strong> <em> <h3> <ul> <li> <table> <thead> <tbody> <tr> <th> <td>
- 마크다운 코드블록(백틱), 문서 태그(html/body/head), 서두·결론 문장 없이 수정된 본문 HTML만 출력하세요.`;

export async function POST(req: NextRequest) {
  try {
    const { sectionTitle, content, feedback, projectContext } = await req.json();

    if (!feedback || typeof feedback !== 'string') {
      return NextResponse.json({ success: false, error: '반영할 피드백이 없습니다.' }, { status: 400 });
    }

    if (!isOpenAIConfigured()) {
      return NextResponse.json({ success: false, error: 'AI가 설정되지 않아 자동 수정을 사용할 수 없습니다. .env.local에 OPENAI_API_KEY를 설정해주세요.' }, { status: 400 });
    }

    const contextLine = projectContext
      ? `분야=${projectContext.field || '-'}, 국가=${projectContext.country || '-'}, 사업명=${projectContext.title || '미지정'}`
      : '';

    const userPrompt = `[프로젝트 정보] ${contextLine}

["${sectionTitle}" 섹션의 기존 내용]
${content || '(아직 작성되지 않았습니다)'}

[반영할 피드백/지시]
${feedback}

수정된 전체 본문 HTML만 출력:`;

    const html = await generateText([{ role: 'user', content: userPrompt }], SYSTEM_PROMPT);
    const cleaned = html.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

    return NextResponse.json({ success: true, html: cleaned });
  } catch (error) {
    const message = error instanceof Error ? error.message : '수정 중 오류가 발생했습니다.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
