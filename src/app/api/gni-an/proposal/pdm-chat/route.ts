import { NextRequest, NextResponse } from 'next/server';
import { generateText, isOpenAIConfigured } from '@/lib/api/openai';
import { buildPmcPromptBlock, buildReferencePromptBlock } from '@/lib/pmcContext';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const SYSTEM_PROMPT = `당신은 KOICA 제안서 PDM(Project Design Matrix) 편집 도우미입니다.
사용자의 메시지가 "PDM 수정 요청"인지 "질문/검토 요청"인지 먼저 판단하세요.

[PDM 계층 구조 규칙]
- Impact: 최상위 1개, children에 Outcome 포함 (Purpose 계층 없음)
- Outcome: Impact의 children에 2~3개
- Output: 각 Outcome의 children에 2~3개 (절대 1개만 두지 말 것)
- Activity: 각 Output의 children에 3~4개 (절대 1~2개만 두지 말 것)
- 번호 체계: Outcome "Outcome 1/2/3", Output "Output 1.1/1.2", Activity "A 1.1.1/1.1.2"
- 새로 추가하는 항목은 같은 부모 안의 기존 형제 항목과 동일한 스타일(지표 SMART 형식,
  검증수단은 실제 문서 유형, 가정은 외부 조건)로 작성하고, 형제 항목과 내용이 중복되지 않게 작성
- 모든 narrative/indicators/verificationMeans/assumptions는 간결체·명사형 종결로 작성
  ("~함", "~음", "~됨" 또는 명사 종결). "~합니다", "~한다" 등 종결형 사용 금지.

[수정 요청인 경우 — 가장 중요한 규칙: "외과적(surgical) 편집"만 수행]
- 요청과 관련 없는 기존 행(Outcome/Output/Activity)의 narrative, indicators,
  verificationMeans, assumptions, code, id는 글자 하나도 바꾸지 말고 입력받은
  그대로 출력에 포함하세요. 전체를 다시 쓰거나 문장을 "다듬지" 마세요.
- 요청된 추가/수정/삭제 작업만 정확히 수행하세요.
- "활동 몇 개 추가해줘"처럼 구체적 개수가 없으면 2~3개를 적절히 추가하세요.
- 새 항목의 "id"는 빈 문자열("")로 두세요 (서버에서 채웁니다).
- 어느 Outcome/Output에 추가할지 메시지에 명시가 없으면, 가장 적절하거나 항목이 적은 곳에 추가하세요.
- updatedPdm에는 전체 PDM 배열을 담되, 변경 대상이 아닌 행은 입력과 완전히 동일해야 합니다.

[질문/검토 요청인 경우]
- updatedPdm은 null로 두고, reply에 검토 의견이나 답변만 작성하세요. PDM은 변경하지 마세요.

[출력 형식 — 절대 규칙]
다음 JSON 객체만 출력하세요 (코드블록·설명 문장 없이):
{
  "reply": "사용자에게 보여줄 짧은 한국어 답변 (수정한 경우 무엇을 추가/변경했는지 요약, 2~4문장)",
  "updatedPdm": [...] 또는 null
}`;

export async function POST(req: NextRequest) {
  try {
    const { pdm, message, projectContext, projectType, pmcSourceDocs } = await req.json();

    if (!isOpenAIConfigured()) {
      return NextResponse.json({
        success: true,
        reply: 'AI가 설정되지 않아 PDM을 직접 수정할 수 없습니다. .env.local에 OPENAI_API_KEY를 설정해주세요.',
        updatedPdm: null,
      });
    }

    const contextLine = projectContext
      ? `사업명=${projectContext.title || '미지정'}, 국가=${projectContext.country || '-'}, 분야=${projectContext.field || '-'}`
      : '';
    const pmcBlock = projectType === 'pmc' ? buildPmcPromptBlock(pmcSourceDocs) : buildReferencePromptBlock(pmcSourceDocs);

    const userPrompt = `[프로젝트 정보] ${contextLine}
${pmcBlock}
[현재 PDM JSON]
${JSON.stringify(pdm || [])}

[사용자 메시지]
${message}

위 형식의 JSON 객체만 출력:`;

    const raw = await generateText([{ role: 'user', content: userPrompt }], SYSTEM_PROMPT);
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let parsed: { reply?: string; updatedPdm?: unknown } = {};
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ success: true, reply: raw, updatedPdm: null });
    }

    let updatedPdm = null;
    if (Array.isArray(parsed.updatedPdm)) {
      // 빈 id 보완
      updatedPdm = JSON.parse(
        JSON.stringify(parsed.updatedPdm).replace(/"id"\s*:\s*""/g, () => `"id":"${uid()}"`)
      );
    }

    return NextResponse.json({
      success: true,
      reply: parsed.reply || '처리했습니다.',
      updatedPdm,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PDM 처리 중 오류가 발생했습니다.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
