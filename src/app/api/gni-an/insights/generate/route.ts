import { NextRequest, NextResponse } from 'next/server';
import { generateText, isOpenAIConfigured } from '@/lib/api/openai';
import { PROMPTS } from '@/lib/prompts';
import { parseAIJson } from '@/lib/parseJSON';

export async function POST(req: NextRequest) {
  try {
    const { ideation, analysis, expertSessions } = await req.json();

    if (!isOpenAIConfigured()) {
      return NextResponse.json({
        success: true,
        data: [
          { id: 'i1', category: '문제 정의', content: `${ideation?.country || '대상국'} ${ideation?.field || '해당 분야'} 분야의 핵심 문제가 구체적으로 분석되었습니다.`, confidence: 'high', source: '전문가 상담' },
          { id: 'i2', category: '수혜자', content: '직·간접 수혜자 성별·연령 분류 및 참여형 수요 조사를 통한 타겟 명확화가 필요합니다.', confidence: 'high', source: '전문가 상담' },
          { id: 'i3', category: '개입 전략', content: 'KOICA CPS 우선순위와 연계한 개입 방안 구체화 및 현지 파트너십 전략 수립이 중요합니다.', confidence: 'medium', source: '전문가 상담' },
          { id: 'i4', category: '리스크', content: '현지 정치·보안 상황 및 파트너 역량 리스크에 대한 사전 완화 계획이 필요합니다.', confidence: 'medium', source: '전문가 상담' },
          { id: 'i5', category: '지속가능성', content: '사업 종료 후 현지 역량 이전 및 정부 예산 연계를 통한 지속가능성 확보 전략이 필요합니다.', confidence: 'high', source: '전문가 상담' },
        ],
      });
    }

    const consultingContext = expertSessions
      ?.map((s: { expertId: string; messages: { role: string; content: string }[] }) => {
        const msgs = s.messages.slice(-6).map((m) => `[${m.role === 'user' ? '질문' : '답변'}] ${m.content}`).join('\n');
        return `=== ${s.expertId} 전문가 상담 ===\n${msgs}`;
      })
      .join('\n\n') || '';

    const systemPrompt = PROMPTS.insightsSystem;

    const userMessage = `다음 사업 정보와 전문가 상담 내용을 바탕으로 핵심 인사이트 5개를 도출해주세요.

[사업 정보]
- 분야: ${ideation?.field}
- 국가: ${ideation?.country}
- 아이디어: ${ideation?.idea}
- 핵심 문제: ${analysis?.coreProblem}
- 기대 성과: ${analysis?.expectedOutcomes}

[전문가 상담 내용]
${consultingContext}

아래 JSON 배열 형식으로 반환하세요:
[
  {"id":"i1","category":"문제 정의","content":"구체적 인사이트 내용 (2-3문장)","confidence":"high","source":"전문가 상담"},
  {"id":"i2","category":"수혜자","content":"구체적 인사이트 내용","confidence":"high","source":"전문가 상담"},
  {"id":"i3","category":"개입 전략","content":"구체적 인사이트 내용","confidence":"medium","source":"전문가 상담"},
  {"id":"i4","category":"리스크","content":"구체적 인사이트 내용","confidence":"medium","source":"전문가 상담"},
  {"id":"i5","category":"지속가능성","content":"구체적 인사이트 내용","confidence":"high","source":"전문가 상담"}
]`;

    const result = await generateText([{ role: 'user', content: userMessage }], systemPrompt);

    let parsed;
    parsed = parseAIJson(result);

    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    const message = error instanceof Error ? error.message : '인사이트 생성 중 오류가 발생했습니다.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
