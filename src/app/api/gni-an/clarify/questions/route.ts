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

function fallbackQuestions(idea: IdeaContext) {
  const place = [idea.country, idea.subRegion].filter(Boolean).join(' ') || '사업 대상 지역';
  return [
    { id: 'q1', question: `${place}에서 지금 가장 힘든 상황은 정확히 무엇인가요? 누가 어떤 어려움을 겪고 있는지 구체적으로 적어주세요.`, placeholder: '예: OO마을 주민들이 깨끗한 물을 구하지 못해 왕복 2시간씩 걸어서 물을 길어옵니다.' },
    { id: 'q2', question: '그 문제는 왜 생겼다고 보시나요? 가장 큰 원인 한두 가지를 적어주세요.', placeholder: '예: 마을에 우물이나 정수 시설이 없고, 관리할 사람도 정해져 있지 않습니다.' },
    { id: 'q3', question: '이 사업이 끝났을 때, 그 지역이나 사람들의 모습이 어떻게 달라져 있으면 좋을까요?', placeholder: '예: 주민들이 걸어서 10분 안에 깨끗한 물을 구할 수 있고, 마을 자체적으로 시설을 관리하고 있습니다.' },
    { id: 'q4', question: '이 사업으로 직접 도움을 받는 사람은 누구이고, 대략 몇 명 정도일까요?', placeholder: '예: OO마을 주민 약 1,200명, 그중 여성과 아동이 다수' },
    { id: 'q5', question: '문제를 해결하기 위해 구체적으로 어떤 활동을 하면 좋을까요?', placeholder: '예: 마을 우물 설치, 주민 운영위원회 구성 및 교육' },
  ];
}

export async function POST(req: NextRequest) {
  try {
    const { ideaContext, consultingHistory } = await req.json();
    const idea: IdeaContext = ideaContext || {};

    if (!isOpenAIConfigured()) {
      return NextResponse.json({ success: true, questions: fallbackQuestions(idea) });
    }

    const systemPrompt = `당신은 개발협력사업 초보 기획자도 쉽게 답할 수 있도록 질문을 만드는 도우미입니다.
전문 용어(예: Theory of Change, Outcome, 임팩트, 베이스라인 등)를 절대 쓰지 말고, 누구나 이해할 수 있는
쉬운 한국어로만 질문을 작성하세요.
반드시 유효한 JSON만 반환하세요. 마크다운 코드블록 없이 순수 JSON만 반환하세요.`;

    const consultingBlock = consultingHistory
      ? `\n전문가 상담 내용 요약:\n${consultingHistory}\n`
      : '';

    const userMessage = `다음 사업 아이디어와 전문가 상담 내용을 참고하여, 이 사업에 대해 더 깊이 이해하기
위한 질문 5개를 만들어주세요.

사업 분야: ${idea.field || '미지정'}
대상 국가/지역: ${[idea.country, idea.subRegion].filter(Boolean).join(' ') || '미지정'}
사업 아이디어: ${idea.idea || '미지정'}
주요 수혜자(입력값): ${idea.beneficiaries || '미지정'}
${consultingBlock}
[질문 작성 규칙]
- 5개의 질문은 각각 아래 5가지 정보를 끌어내야 합니다 (이 순서를 그대로 따르세요):
  1. 핵심 문제: 지금 정확히 어떤 상황이 벌어지고 있는지 (구체적 상황)
  2. 문제의 원인: 그 문제가 왜 생겼는지
  3. 사업 종료 후 달라질 모습: 사업이 끝나면 무엇이 어떻게 바뀌어 있을지
  4. 수혜자: 누가, 몇 명 정도 도움을 받는지
  5. 주요 개입 방식: 문제를 풀기 위해 구체적으로 무엇을 할 것인지
- 각 질문은 위 사업 아이디어와 상담 내용에 등장하는 구체적인 소재(지역명, 분야, 대상 등)를 활용해서
  "이 사업에만 해당하는" 질문으로 만드세요. "이 사업의 목표는 무엇인가요?"처럼 어떤 사업에도 똑같이
  쓸 수 있는 뻔하고 일반적인 질문은 금지합니다.
- placeholder는 사용자가 어떤 식으로 답하면 되는지 보여주는 짧은 예시 문장으로, "예: "로 시작하세요.

다음 JSON 형식으로만 반환하세요:
{
  "questions": [
    {"id": "q1", "question": "핵심 문제를 끌어내는 구체적 질문", "placeholder": "예: ..."},
    {"id": "q2", "question": "원인을 끌어내는 구체적 질문", "placeholder": "예: ..."},
    {"id": "q3", "question": "종료 후 모습을 끌어내는 구체적 질문", "placeholder": "예: ..."},
    {"id": "q4", "question": "수혜자를 끌어내는 구체적 질문", "placeholder": "예: ..."},
    {"id": "q5", "question": "개입 방식을 끌어내는 구체적 질문", "placeholder": "예: ..."}
  ]
}`;

    const result = await generateTextPro([{ role: 'user', content: userMessage }], systemPrompt);
    const parsed = parseAIJson(result) as { questions?: unknown };
    const questions = Array.isArray(parsed?.questions) && parsed.questions.length === 5
      ? parsed.questions
      : fallbackQuestions(idea);

    return NextResponse.json({ success: true, questions });
  } catch (error) {
    const message = error instanceof Error ? error.message : '질문 생성 중 오류가 발생했습니다.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
