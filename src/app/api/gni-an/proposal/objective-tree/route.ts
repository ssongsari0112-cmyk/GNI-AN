import { NextRequest, NextResponse } from 'next/server';
import { generateTextPro, isOpenAIConfigured } from '@/lib/api/openai';

/* ── 목표나무 생성 (문제나무의 부정적 표현 → 긍정적 전환) ─────────────── */

const SYSTEM_PROMPT = `당신은 KOICA 국제개발사업 기획 전문가입니다.
주어진 사업 정보 및 문제나무를 바탕으로 목표나무(Objective Tree)를 JSON으로 생성하세요.

목표나무 구조 규칙:
1. Impact(영향/목표): SDGs와 연계한 장기 변화 목표 (1개)
2. Purpose(사업목적): 사업 종료 시 달성할 핵심 목적 (1개)
3. Outcomes(성과/산출목적): 구체적인 사업 성과 (2~3개, 각각 outputs 포함)
   - 문제나무의 직접 원인을 긍정적으로 전환
   - 각 성과에 산출물(Output) 2~3개 추가

작성 규칙:
- 모든 노드 텍스트는 "긍정적 목표 형태"로 작성 (향상, 강화, 확대, 구축 등)
- SMART 원칙 적용: 측정 가능하고 구체적인 표현
- PDM과 연계 가능한 논리 구조

반드시 아래 JSON 형식으로만 출력:
{
  "impact": "영향 목표 텍스트 (SDGs 연계)",
  "purpose": "사업목적 텍스트",
  "outcomes": [
    {
      "id": "oc1",
      "text": "성과 1",
      "level": "outcome",
      "children": [
        {"id": "op1-1", "text": "산출물 1.1", "level": "output"},
        {"id": "op1-2", "text": "산출물 1.2", "level": "output"}
      ]
    }
  ],
  "outputs": [],
  "activities": []
}`;

const FALLBACK_TREE = {
  impact: 'SDG 1, 8 달성을 통한 취약계층의 지속가능한 삶의 질 향상',
  purpose: '취약계층의 경제적 역량 강화 및 자립 기반 구축',
  outcomes: [
    {
      id: 'oc1',
      text: '소득 창출 역량 강화',
      level: 'outcome',
      children: [
        { id: 'op1-1', text: '직업 기술 교육 프로그램 운영', level: 'output' },
        { id: 'op1-2', text: '시장 연계 지원 체계 구축', level: 'output' },
        { id: 'op1-3', text: '소규모 창업 지원 활성화', level: 'output' },
      ],
    },
    {
      id: 'oc2',
      text: '지원 서비스 체계 강화',
      level: 'outcome',
      children: [
        { id: 'op2-1', text: '사회안전망 제도 역량 강화', level: 'output' },
        { id: 'op2-2', text: '민관 협력 파트너십 구축', level: 'output' },
      ],
    },
    {
      id: 'oc3',
      text: '젠더 평등 및 사회적 포용 증진',
      level: 'outcome',
      children: [
        { id: 'op3-1', text: '여성 경제 참여 확대 프로그램 운영', level: 'output' },
        { id: 'op3-2', text: '취약계층 사회 참여 지원', level: 'output' },
      ],
    },
  ],
  outputs: [],
  activities: [],
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, country, field, idea, coreProblem, problemTree, expertInsights } = body;

  if (!isOpenAIConfigured()) {
    return NextResponse.json({ success: true, tree: FALLBACK_TREE });
  }

  const contextLines = [
    title && `사업명: ${title}`,
    country && `대상 국가: ${country}`,
    field && `사업 분야: ${field}`,
    idea && `핵심 아이디어: ${idea}`,
    coreProblem && `핵심 문제: ${coreProblem}`,
    problemTree && `문제나무 구조: ${problemTree}`,
    expertInsights && `전문가 인사이트:\n${expertInsights}`,
  ].filter(Boolean).join('\n');

  const userPrompt = `아래 사업 정보를 바탕으로 KOICA 제안서에 사용할 목표나무를 생성하세요.
문제나무의 각 원인을 긍정적 목표로 전환하세요.

[사업 정보]
${contextLines}

[생성 요구사항]
- Impact: SDGs 목표 번호 포함, 장기 변화 1개
- Purpose: SMART 목적 1개 (사업 기간 내 달성)
- Outcomes: 2~3개 (직접 원인 전환, 각각 산출물 2~3개 포함)

JSON만 출력:`;

  try {
    const raw = await generateTextPro([{ role: 'user', content: userPrompt }], SYSTEM_PROMPT);

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');

    const tree = JSON.parse(jsonMatch[0]);

    if (!tree.impact || !tree.purpose || !Array.isArray(tree.outcomes)) {
      throw new Error('Invalid tree structure');
    }

    if (!tree.outputs) tree.outputs = [];
    if (!tree.activities) tree.activities = [];

    return NextResponse.json({ success: true, tree });
  } catch {
    return NextResponse.json({ success: true, tree: FALLBACK_TREE });
  }
}
