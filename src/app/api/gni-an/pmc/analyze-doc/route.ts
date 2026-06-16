import { NextRequest, NextResponse } from 'next/server';
import { generateTextPro, isOpenAIConfigured } from '@/lib/api/openai';

const SYSTEM_PROMPT = `당신은 KOICA 국별협력사업(PMC) 집행계획(안) 문서 분석 전문가입니다.
제공된 문서 원문에서 사업의 핵심 정보를 정확하게 추출하세요.
문서에 없는 내용은 추가하지 말고, 있는 내용만 추출하세요.

반드시 아래 JSON 형식으로만 출력하세요:
{
  "title": "사업명 (공식 명칭 그대로)",
  "country": "사업 대상 국가",
  "region": "사업 대상 지역·도시 (있으면)",
  "field": "주요 사업 분야 (교육/보건/농촌개발 등)",
  "duration": "사업 기간 (예: 2024~2027, 3년)",
  "budget": "총 사업 예산 (있으면)",
  "coreProblem": "해결하고자 하는 핵심 문제 (1~2문장)",
  "targetBeneficiaries": "주요 수혜 대상",
  "objectives": "사업의 주요 목표 (Impact/Outcome 수준, 2~4문장)",
  "keyTasks": ["과업 1", "과업 2", "과업 3"],
  "pdmSummary": "PDM 구조 요약 (있으면, Outcome-Output 체계)",
  "koicaRequirements": "KOICA가 요구하는 핵심 조건·기준 (있으면)",
  "summary": "문서 전체 요약 (3~5문장)"
}`;

export async function POST(req: NextRequest) {
  const { extractedText, fileName } = await req.json();
  if (!extractedText) return NextResponse.json({ error: '문서 텍스트가 없습니다.' }, { status: 400 });

  // OpenAI 미설정 시 텍스트만 반환
  if (!isOpenAIConfigured()) {
    return NextResponse.json({
      success: true,
      analyzed: {
        title: fileName?.replace('.pdf', '') || 'PMC 사업',
        country: '',
        region: '',
        field: '',
        duration: '',
        budget: '',
        coreProblem: '',
        targetBeneficiaries: '',
        objectives: '',
        keyTasks: [],
        pdmSummary: '',
        koicaRequirements: '',
        summary: '(AI 분석 미지원 — 직접 내용을 확인하세요)',
      },
    });
  }

  const userPrompt = `아래 KOICA 집행계획(안) 원문에서 사업 정보를 추출하세요.
원문에 없는 내용은 빈 문자열("")로 두세요.

[원문 - ${fileName}]
${extractedText.slice(0, 12000)}

JSON만 출력:`;

  try {
    const raw = await generateTextPro([{ role: 'user', content: userPrompt }], SYSTEM_PROMPT);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON');
    const analyzed = JSON.parse(match[0]);
    return NextResponse.json({ success: true, analyzed });
  } catch {
    return NextResponse.json({
      success: true,
      analyzed: {
        title: fileName?.replace('.pdf', '') || '',
        country: '', region: '', field: '', duration: '', budget: '',
        coreProblem: '', targetBeneficiaries: '', objectives: '',
        keyTasks: [], pdmSummary: '', koicaRequirements: '',
        summary: '분석 실패 — 원문을 직접 확인하세요.',
      },
    });
  }
}
