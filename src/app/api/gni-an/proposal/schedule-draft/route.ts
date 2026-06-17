import { NextRequest, NextResponse } from 'next/server';
import { generateTextPro, isOpenAIConfigured } from '@/lib/api/openai';

const SYSTEM_PROMPT = `당신은 KOICA 제안서 "부문별 상세 사업 추진일정"(간트차트) 수립 전문가입니다.
주어진 활동 목록과 전체 사업 기간(월 수)을 바탕으로, 각 활동이 몇 번째 달부터
몇 번째 달까지 수행되는지 결정하세요.

[배정 원칙]
- 조직 구성·MOU 체결·기초선 조사 등 착수 활동은 1차년도 초반에 배정
- 교육·시범사업 등 반복 활동은 여러 분기에 걸쳐 분산 배정 (사업 기간 내내 또는 일부 구간)
- M&E·모니터링·보고 관련 활동은 사업 전체 기간에 걸쳐 분기 단위로 분산
- 종료평가·이양·인수인계 등 마무리 활동은 마지막 1~2개 분기에 배정
- 활동 간 논리적 선후관계(예: 커리큘럼 개발 → 교육 실시 → 평가)를 반영하여 순서대로 시작 시점을 배정
- 같은 Output에 속한 활동들은 가능한 비슷한 시기에 배정하되, 순서는 지킬 것

[출력 형식 — 절대 규칙]
다음 JSON 객체만 출력하세요 (코드블록·설명 문장 없이):
{ "schedule": [ { "id": "활동 id", "startMonth": 0, "endMonth": 5 }, ... ] }
- startMonth/endMonth는 0부터 (monthsCount-1) 사이의 정수, startMonth <= endMonth
- 입력으로 받은 모든 활동에 대해 빠짐없이 항목을 생성하세요`;

export async function POST(req: NextRequest) {
  try {
    const { activities, monthsCount, projectType, pmcSourceDocs, projectContext } = await req.json();

    if (!Array.isArray(activities) || activities.length === 0) {
      return NextResponse.json({ success: false, error: '활동 목록이 없습니다.' }, { status: 400 });
    }
    if (!isOpenAIConfigured()) {
      return NextResponse.json({ success: false, error: 'AI가 설정되지 않아 자동완성을 사용할 수 없습니다.' }, { status: 400 });
    }

    let pmcSection = '';
    if (projectType === 'pmc' && Array.isArray(pmcSourceDocs) && pmcSourceDocs.length > 0) {
      const combined = pmcSourceDocs
        .map((doc: { fileName: string; extractedText: string }) => `--- ${doc.fileName} ---\n${doc.extractedText.slice(0, 6000)}`)
        .join('\n\n')
        .slice(0, 12000);
      pmcSection = `\n[KOICA 집행계획(안) 원문 — 아래 원문에 제시된 추진일정·연차별 계획을 최대한 그대로 반영하세요]\n${combined}\n[/집행계획(안)]\n`;
    }

    const contextLine = projectContext
      ? `사업명=${projectContext.title || '-'}, 국가=${projectContext.country || '-'}, 분야=${projectContext.field || '-'}`
      : '';

    const userPrompt = `[프로젝트 정보] ${contextLine}
[전체 사업 기간] ${monthsCount}개월${pmcSection}

[활동 목록]
${JSON.stringify(activities.map((a: { id: string; code: string; name: string }) => ({ id: a.id, code: a.code, name: a.name })))}

${projectType === 'pmc' ? 'PMC 사업이므로 위 KOICA 집행계획(안) 원문의 일정을 최대한 반영하세요.' : '사업 특성에 맞게 합리적으로 판단하여 배정하세요.'}
위 형식의 JSON 객체만 출력:`;

    const raw = await generateTextPro([{ role: 'user', content: userPrompt }], SYSTEM_PROMPT);
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let parsed: { schedule?: { id: string; startMonth: number; endMonth: number }[] } = {};
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ success: false, error: '일정 생성 결과를 해석하지 못했습니다.' }, { status: 500 });
    }

    const schedule = Array.isArray(parsed.schedule) ? parsed.schedule : [];
    const clamp = (n: number) => Math.max(0, Math.min(monthsCount - 1, Math.round(n)));
    const validated = schedule
      .filter((s) => s && typeof s.id === 'string')
      .map((s) => {
        const start = clamp(s.startMonth ?? 0);
        const end = clamp(s.endMonth ?? start);
        return { id: s.id, startMonth: Math.min(start, end), endMonth: Math.max(start, end) };
      });

    return NextResponse.json({ success: true, schedule: validated });
  } catch (error) {
    const message = error instanceof Error ? error.message : '일정 생성 중 오류가 발생했습니다.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
