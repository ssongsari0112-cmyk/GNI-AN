import { NextRequest, NextResponse } from 'next/server';
import { generateTextPro, isOpenAIConfigured } from '@/lib/api/openai';
import { buildPmcPromptBlock } from '@/lib/pmcContext';

/* ── 작성 지침 기반 문제나무 생성 ─────────────────────────────────────── */

const SYSTEM_PROMPT = `당신은 KOICA 국제개발사업 기획 전문가입니다.
주어진 사업 정보를 바탕으로 문제나무(Problem Tree) 구조를 JSON으로 생성하세요.

문제나무 구조 규칙 (최소 개수 반드시 충족 — 부실하게 만들지 말 것):
1. 결과(Effects): 핵심 문제가 해결되지 않을 때 발생하는 최종 영향 (반드시 2개 이상)
2. 핵심 문제(Core Problem): 사업이 해결하고자 하는 중심 문제 (1개)
3. 직접 원인(Immediate Causes): 핵심 문제의 직접적 원인 (반드시 2~3개, 서로 다른 차원)
4. 세부 원인(Underlying Causes): 각 직접 원인의 하위 원인 (각각 반드시 2개 이상)
5. 근본 원인(Root Causes): 각 세부 원인마다 최소 1개 이상 반드시 추가 (사회·경제·문화·제도적
   수준의 더 깊은 원인 — "필요시"가 아니라 매번 작성할 것)

작성 규칙:
- 모든 노드 텍스트는 "문제 형태"로 작성 (부족, 낮음, 미흡, 부재 등)
- 국제개발사업 제안서 수준의 구체적 표현 사용
- 해당 분야에 맞는 실제 문제 용어 사용

반드시 아래 JSON 형식으로만 출력하세요. 다른 설명 없이 JSON만:
{
  "effects": [
    {"id": "e1", "text": "결과 1"}
  ],
  "coreProblem": "핵심 문제 텍스트",
  "causes": [
    {
      "id": "c1",
      "text": "직접 원인 1",
      "children": [
        {
          "id": "c1-1",
          "text": "세부 원인 1.1",
          "children": [
            {"id": "c1-1-1", "text": "근본 원인 1.1.1"}
          ]
        },
        {"id": "c1-2", "text": "세부 원인 1.2", "children": []}
      ]
    }
  ]
}`;

const FALLBACK_TREE = {
  effects: [
    { id: 'e1', text: '지역 내 취약계층의 생계 기반 붕괴 심화' },
    { id: 'e2', text: '사회 불평등 및 빈곤층 증가' },
  ],
  coreProblem: '취약계층의 낮은 경제적 역량 및 자립 기반 부족',
  causes: [
    {
      id: 'c1',
      text: '소득 창출 역량 부족',
      children: [
        {
          id: 'c1-1',
          text: '직업 기술 교육 접근성 부족',
          children: [
            { id: 'c1-1-1', text: '교육 인프라 및 교사 부족', children: [] },
            { id: 'c1-1-2', text: '교육 비용 부담 과중', children: [] },
          ],
        },
        {
          id: 'c1-2',
          text: '시장 접근성 미흡',
          children: [
            { id: 'c1-2-1', text: '운송 인프라 부족', children: [] },
            { id: 'c1-2-2', text: '시장 정보 접근 어려움', children: [] },
          ],
        },
      ],
    },
    {
      id: 'c2',
      text: '지원 서비스 체계 미흡',
      children: [
        {
          id: 'c2-1',
          text: '정부 사회안전망 부재',
          children: [
            { id: 'c2-1-1', text: '예산 및 재원 부족', children: [] },
            { id: 'c2-1-2', text: '행정 역량 부족', children: [] },
          ],
        },
        {
          id: 'c2-2',
          text: '민간-공공 협력 체계 부족',
          children: [
            { id: 'c2-2-1', text: '파트너십 제도 미비', children: [] },
          ],
        },
      ],
    },
    {
      id: 'c3',
      text: '사회문화적 취약성',
      children: [
        {
          id: 'c3-1',
          text: '젠더 불평등 및 여성 경제 참여 제한',
          children: [
            { id: 'c3-1-1', text: '가부장적 사회 규범 지속', children: [] },
            { id: 'c3-1-2', text: '여성 이동성·의사결정권 제한', children: [] },
          ],
        },
        {
          id: 'c3-2',
          text: '취약계층 사회적 배제',
          children: [
            { id: 'c3-2-1', text: '차별적 제도 및 관행', children: [] },
          ],
        },
      ],
    },
  ],
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, country, field, idea, coreProblem, targetBeneficiaries, expertInsights, projectType, pmcSourceDocs } = body;

  if (!isOpenAIConfigured()) {
    return NextResponse.json({ success: true, tree: FALLBACK_TREE });
  }

  const pmcBlock = projectType === 'pmc' ? buildPmcPromptBlock(pmcSourceDocs) : '';

  const contextLines = [
    title && `사업명: ${title}`,
    country && `대상 국가: ${country}`,
    field && `사업 분야: ${field}`,
    idea && `핵심 아이디어: ${idea}`,
    coreProblem && `기존 식별된 핵심 문제: ${coreProblem}`,
    targetBeneficiaries && `주요 수혜 대상: ${targetBeneficiaries}`,
    expertInsights && `전문가 인사이트:\n${expertInsights}`,
  ].filter(Boolean).join('\n');

  const userPrompt = `아래 사업 정보를 바탕으로 KOICA 제안서에 사용할 문제나무를 생성하세요.
${pmcBlock}
[사업 정보]
${contextLines}

[생성 요구사항 — 최소 개수 반드시 충족]
- 결과(Effects): 반드시 2개 이상
- 핵심 문제: 사업 분야에 맞는 구체적 문제 1개
- 직접 원인: 반드시 2~3개 (각각 다른 차원의 원인)
- 세부 원인: 각 직접 원인당 반드시 2개 이상
- 근본 원인: 각 세부 원인마다 반드시 1개 이상 추가 (절대 빠뜨리지 말 것)

JSON만 출력:`;

  try {
    const raw = await generateTextPro([{ role: 'user', content: userPrompt }], SYSTEM_PROMPT);

    // JSON 추출 (마크다운 코드블록 제거)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');

    const tree = JSON.parse(jsonMatch[0]);

    if (!tree.coreProblem || !Array.isArray(tree.causes) || !Array.isArray(tree.effects)) {
      throw new Error('Invalid tree structure');
    }

    return NextResponse.json({ success: true, tree });
  } catch {
    return NextResponse.json({ success: true, tree: FALLBACK_TREE });
  }
}
