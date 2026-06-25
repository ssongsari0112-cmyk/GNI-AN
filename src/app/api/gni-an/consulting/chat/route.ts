import { NextRequest, NextResponse } from 'next/server';
import { generateTextProSearch, isOpenAIConfigured } from '@/lib/api/openai';
import { parseAIJson } from '@/lib/parseJSON';
import { FIELD_EXPERT_PROMPTS } from '@/lib/prompts';

interface ConsultMsg {
  role: 'assistant' | 'user';
  content: string;
}

const EXPERT_FOCUS: Record<string, string> = {
  field: `당신은 사업 분야 전문가입니다. 이 사업 분야에서 사용자가 궁극적으로 어떤 변화를 만들고
싶은지, 지금 가장 시급한 문제가 무엇인지를 쉬운 질문으로 하나씩 짚어가며 구체화하세요.`,
  regional: `당신은 현지 지역 전문가입니다. 대상 국가/지역의 현지 맥락(정책·문화·사회적 제약, 현지
파트너 여건)에서 이 사업이 부딪힐 수 있는 현실적인 어려움과 기회를 질문으로 짚어가며 구체화하세요.`,
  planning: `당신은 사업기획 전문가입니다. 이 사업의 핵심 문제와 개입 방식, 수혜자 설정이 논리적으로
연결되는지를 질문으로 짚어가며, 사업 설계의 빈틈을 구체화하세요.`,
  me: `당신은 M&E(모니터링·평가) 전문가입니다. 우수사례를 검색해 "이런 사례는 이렇게 지속가능성을
높였는데, 이 사업에서는 어떤 요소가 지속가능하게 만들 수 있을지" 같은 질문으로 지표·지속가능성을
구체화하세요.`,
};

function firstFallbackMessage(expertType: string) {
  const fallbacks: Record<string, string> = {
    field: '이 사업 분야에서 가장 먼저 해결하고 싶은 문제는 무엇인가요?',
    regional: '현지에서 이 사업을 실행할 때 가장 걱정되는 점은 무엇인가요?',
    planning: '이 사업이 끝났을 때 가장 크게 달라지길 바라는 점은 무엇인가요?',
    me: '이 사업이 끝난 뒤에도 효과가 계속 이어지려면 무엇이 가장 중요할까요?',
  };
  return {
    role: 'assistant' as const,
    content: fallbacks[expertType] || fallbacks.field,
    options: [],
    isFinal: false,
  };
}

function finalFallbackMessage() {
  return {
    role: 'assistant' as const,
    content: '말씀해주신 내용을 들어보니 방향이 충분히 잡힌 것 같습니다. 이 정도로 상담을 마쳐도 괜찮을까요?',
    options: [],
    isFinal: true,
  };
}

/** 웹 검색을 쓴 응답은 모델이 순수 JSON 대신 "설명 글 + 끝에 {options, isFinal}만 담은 JSON
 *  조각"을 쓰는 경우가 있음. 이때 parseAIJson은 content 없는 조각만 뽑아내므로, 끝부분의
 *  메타 JSON과 그 앞의 설명 글을 분리해 content로 복구한다. */
function salvageMessage(raw: string): { content: string; options: string[]; isFinal: boolean } | null {
  const match = raw.match(/\{[^{}]*"options"[\s\S]*?\}\s*$/);
  if (!match || match.index === undefined) return null;
  let meta: { options?: string[]; isFinal?: boolean };
  try {
    meta = JSON.parse(match[0]);
  } catch {
    return null;
  }
  const content = raw.slice(0, match.index).trim();
  if (!content) return null;
  return {
    content,
    options: Array.isArray(meta.options) ? meta.options : [],
    isFinal: !!meta.isFinal,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { expertType, expertTitle, ideation, analysis, messages } = await req.json();
    const history: ConsultMsg[] = Array.isArray(messages) ? messages : [];
    const userTurns = history.filter((m) => m.role === 'user').length;

    if (!isOpenAIConfigured()) {
      return NextResponse.json({
        success: true,
        message: history.length === 0
          ? firstFallbackMessage(expertType)
          : (userTurns >= 3 ? finalFallbackMessage() : firstFallbackMessage(expertType)),
      });
    }

    const focus = EXPERT_FOCUS[expertType] || EXPERT_FOCUS.field;
    const fieldExpertPrompt = expertType === 'field' ? FIELD_EXPERT_PROMPTS[ideation?.field] : undefined;

    const koreanOnlyNote = '반드시 순수한 한국어로만 답변하세요. 한자·중국어·일본어 문자를 쓰지 마세요.';

    const systemPrompt = `${expertTitle || '전문가'}로서 사용자와 1:1 상담을 진행합니다.
${focus}
${fieldExpertPrompt ? `\n[분야별 세부 관점]\n${fieldExpertPrompt}\n` : ''}
${koreanOnlyNote}
반드시 유효한 JSON만 반환하세요. 마크다운 코드블록 없이 순수 JSON만 반환하세요.`;

    const consultingBlock = analysis?.coreProblem ? `\n파악된 핵심 문제: ${analysis.coreProblem}\n` : '';
    const transcript = history.length
      ? history.map((m) => `${m.role === 'assistant' ? '전문가' : '사용자'}: ${m.content}`).join('\n')
      : '(상담 시작 전)';

    const userMessage = `사업 분야: ${ideation?.field || '미지정'}
대상 국가/지역: ${[ideation?.country, ideation?.subRegion].filter(Boolean).join(' ') || '미지정'}
사업 아이디어: ${ideation?.idea || '미지정'}
${consultingBlock}
지금까지의 상담 대화:
${transcript}

지금까지 사용자 답변 수: ${userTurns}개

[다음 메시지 생성 규칙]
1. 한 번에 하나의 질문만 쉬운 말로 하세요. 전문 용어를 쓰지 마세요.
2. 필요하면 먼저 웹 검색 도구로 관련 사례·통계·우수사례를 실제로 찾아보세요. 실제로 신뢰할 만한
   자료를 찾았으면, 질문 앞에 "(<a href=\"실제로 확인한 URL\" target=\"_blank\"
   rel=\"noopener noreferrer\">연도, 자료명, 출처</a>)" 형식의 실제 하이퍼링크로 짧게 소개한 뒤,
   "이걸 보니 어떻게 생각하시나요?" 같은 질문을 이어가세요. 검색해도 확실한 자료가 없으면 출처를
   지어내지 말고 그냥 질문만 하세요. 같은 출처를 "[도메인](URL)" 같은 마크다운 형식으로 중복해서
   다시 표시하지 마세요 — 위 <a> 형식 한 번만 쓰세요.
3. 사용자가 "모르겠다", "추천해줘", "확신이 없다" 같은 답을 하면, 막연한 일반론 대신 구체적인
   선택지 2~4개를 options로 제시하세요(가능하면 그 중 일부는 위 2번처럼 실제 출처를 찾아 근거로
   덧붙이세요).
4. 객관식이 적절하면 options에 2~4개의 구체적 선택지를 담고, 열린 질문이면 options를 빈 배열로 두세요.
5. 사용자 답변이 3개 이상 쌓였고, "지금 문제 상황이 정확히 무엇인지"와 "이 사업으로 궁극적으로
   만들고 싶은 변화"가 충분히 파악되었다면, 새 질문 대신 지금까지 파악된 내용을 2~3문장으로
   요약하고 "이 정도로 상담을 마쳐도 괜찮을까요?"라고 묻는 메시지를 만들고 isFinal을 true로,
   options는 빈 배열로 하세요.
6. 항상 사용자가 입력한 사업 아이디어의 구체적 소재(지역명, 분야 등)를 반영하세요.

다음 JSON 형식으로만 반환하세요:
{"content": "전문가 메시지(질문 또는 마무리 확인 문장)", "options": ["선택지1", "선택지2"], "isFinal": false}`;

    const result = await generateTextProSearch(userMessage, systemPrompt);

    let parsed: { content?: string; options?: string[]; isFinal?: boolean } | undefined;
    try {
      parsed = parseAIJson(result) as typeof parsed;
    } catch {
      parsed = undefined;
    }

    const message = parsed?.content
      ? { content: parsed.content, options: Array.isArray(parsed.options) ? parsed.options : [], isFinal: !!parsed.isFinal }
      : salvageMessage(result);

    if (!message) {
      return NextResponse.json({
        success: true,
        message: firstFallbackMessage(expertType),
      });
    }

    // AI가 너무 일찍 마무리로 판단해도 최소 3턴은 채우도록 강제 — "질문 몇 개는 꼭 답해야
    // 다음으로 넘어간다"는 요건을 모델 판단에만 맡기지 않고 서버에서 보장
    const MIN_USER_TURNS = 3;
    const isFinal = message.isFinal && userTurns >= MIN_USER_TURNS;

    return NextResponse.json({
      success: true,
      message: {
        role: 'assistant',
        content: message.content,
        options: message.options,
        isFinal,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '상담 대화 생성 중 오류가 발생했습니다.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
