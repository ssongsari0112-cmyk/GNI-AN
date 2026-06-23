import { NextRequest, NextResponse } from 'next/server';
import { generateTextPro, isOpenAIConfigured } from '@/lib/api/openai';
import { parseAIJson } from '@/lib/parseJSON';

interface IdeaContext {
  field?: string;
  country?: string;
  subRegion?: string;
  idea?: string;
  beneficiaries?: string;
}

interface ClarifyMsg {
  role: 'assistant' | 'user';
  content: string;
}

function firstFallbackMessage(idea: IdeaContext) {
  return {
    role: 'assistant' as const,
    content: `${idea.field || '이 분야'} 사업에서 꼭 넣고 싶은 핵심 요소가 있나요?`,
    options: ['식량 지원', '식수·위생', '교육·훈련', '소득·생계'],
    isFinal: false,
  };
}

function finalFallbackMessage() {
  return {
    role: 'assistant' as const,
    content: '지금까지 말씀해주신 내용을 보면, 핵심 문제와 원하는 변화의 방향이 어느 정도 잡힌 것 같아요. 이대로 구조화를 진행해도 괜찮을까요?',
    options: [],
    isFinal: true,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { ideaContext, consultingHistory, messages } = await req.json();
    const idea: IdeaContext = ideaContext || {};
    const history: ClarifyMsg[] = Array.isArray(messages) ? messages : [];
    const userTurns = history.filter((m) => m.role === 'user').length;

    if (!isOpenAIConfigured()) {
      return NextResponse.json({
        success: true,
        message: history.length === 0
          ? firstFallbackMessage(idea)
          : (userTurns >= 4 ? finalFallbackMessage() : firstFallbackMessage(idea)),
      });
    }

    const systemPrompt = `당신은 개발협력사업 기획을 도와주는 친근한 대화형 도우미입니다.
전문 용어(Theory of Change, Outcome, 임팩트, 베이스라인 등)를 절대 쓰지 말고, 누구나 이해할 수 있는
쉬운 한국어로만 대화하세요. 반드시 유효한 JSON만 반환하세요. 마크다운 코드블록 없이 순수 JSON만
반환하세요.`;

    const consultingBlock = consultingHistory ? `\n전문가 상담 내용 요약:\n${consultingHistory}\n` : '';
    const transcript = history.length
      ? history.map((m) => `${m.role === 'assistant' ? 'AI' : '사용자'}: ${m.content}`).join('\n')
      : '(대화 시작 전)';

    const userMessage = `다음은 사용자가 입력한 사업 아이디어와 지금까지의 대화 내용입니다.
이 사업을 구조화(문제분석·목표체계·PDM 작성)하기 위해 꼭 필요한 정보를 자연스러운 대화로
끌어내는 것이 목표입니다.

사업 분야: ${idea.field || '미지정'}
대상 국가/지역: ${[idea.country, idea.subRegion].filter(Boolean).join(' ') || '미지정'}
사업 아이디어: ${idea.idea || '미지정'}
주요 수혜자(입력값): ${idea.beneficiaries || '미지정'}
${consultingBlock}
지금까지의 대화:
${transcript}

지금까지 사용자 답변 수: ${userTurns}개

[다음 메시지 생성 규칙]
1. 아직 대화 시작 전이면, 먼저 이 사업 분야(${idea.field || '해당 분야'})에서 "꼭 넣고 싶은 핵심 요소"가
   있는지 물어보세요. 그 분야에서 실제로 자주 쓰이는 구체적인 개입 요소 3~4개를 options로 제시하세요.
   (예: 인도적지원사업이면 식량, 식수·위생, 보호(Protection), 정신건강·심리지원(PSS), 생계·소득
   등 중에서 이 아이디어와 어울리는 것)
2. 사용자의 가장 최근 답변이 "없습니다"이거나 제시된 선택지 중 어느 것도 원하지 않는다는 취지라면,
   다음 질문은 선택지를 주지 말고(options: 빈 배열) 더 깊이 파고드는 열린 질문을 하세요 — 예: "그럼
   이 사업에서 궁극적으로 가장 돕고 싶은 게 무엇인가요?" 또는 "작성자님 입장에서 가장 해결하고 싶은
   문제가 무엇인가요?"
3. 그 외의 경우, 지금까지 답변에서 아직 다뤄지지 않은 정보 중 구조화에 가장 중요한 것을 다음 질문으로
   고르세요. 우선순위: (1) 꼭 포함하고 싶은 핵심 요소/활동 (2) 가장 해결하고 싶은 핵심 문제 (3) 그
   문제의 원인 (4) 수혜자(누구, 몇 명) (5) 사업 종료 후 기대하는 변화. 이미 충분히 답변된 항목은
   다시 묻지 마세요.
4. 객관식 질문일 때는 이 사업 아이디어·대화 내용에 맞는 구체적인 options 3~4개를 제시하세요. 어떤
   사업에도 쓸 수 있는 뻔한 선택지는 금지합니다. 열린 질문일 때는 options를 빈 배열로 두세요.
5. 사용자 답변이 4개 이상 쌓였고 핵심 문제·원인·수혜자·기대 변화 중 대부분이 파악되었다면, 새 질문
   대신 마무리 단계로 전환하세요: 지금까지 파악된 핵심 문제·방향을 2~3문장으로 자연스럽게 요약하고
   "이대로 진행해도 괜찮을까요?"라고 묻는 메시지를 만들고 isFinal을 true로, options는 빈 배열로
   하세요.
6. 한 번에 하나의 메시지만 만드세요. 항상 사용자가 직접 입력한 사업 아이디어의 구체적 소재(지역명,
   분야 등)를 반영하세요.

다음 JSON 형식으로만 반환하세요:
{"content": "AI 메시지(질문 또는 마무리 확인 문장)", "options": ["선택지1", "선택지2", "선택지3"], "isFinal": false}`;

    const result = await generateTextPro([{ role: 'user', content: userMessage }], systemPrompt);
    const parsed = parseAIJson(result) as { content?: string; options?: string[]; isFinal?: boolean };

    if (!parsed?.content) {
      return NextResponse.json({
        success: true,
        message: history.length === 0 ? firstFallbackMessage(idea) : finalFallbackMessage(),
      });
    }

    return NextResponse.json({
      success: true,
      message: {
        role: 'assistant',
        content: parsed.content,
        options: Array.isArray(parsed.options) ? parsed.options : [],
        isFinal: !!parsed.isFinal,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '대화 생성 중 오류가 발생했습니다.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
