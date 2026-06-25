import { NextRequest, NextResponse } from 'next/server';
import { generateTextPro, isOpenAIConfigured } from '@/lib/api/openai';
import { buildPmcPromptBlock, buildReferencePromptBlock } from '@/lib/pmcContext';
import { parseAIJson } from '@/lib/parseJSON';

/* ── 목표나무 생성 (문제나무의 부정적 표현 → 긍정적 전환) ─────────────── */

const SYSTEM_PROMPT = `당신은 KOICA 국제개발사업 기획 전문가입니다.
주어진 사업 정보 및 문제나무를 바탕으로 목표나무(Objective Tree)를 JSON으로 생성하세요.

[절대 원칙 — 문제나무와 1:1 구조 대응, 절대 독립적으로 새로 만들지 말 것]
목표나무는 문제나무를 "그대로 뒤집은 거울"이어야 합니다. 완전히 새로운 내용을 만들지 말고,
문제나무에 이미 있는 노드의 핵심 소재(대상·분야·이슈)는 그대로 유지한 채 부정적 서술어만
긍정적 서술어로 치환하세요.
- Outcome 개수 = 문제나무의 직접 원인(causes) 개수와 정확히 동일, 순서도 동일하게 1:1 대응
  (문제나무에 직접 원인이 3개면 Outcome도 반드시 3개)
- 각 Outcome의 Output 개수 = 그 직접 원인에 속한 세부 원인(children) 개수와 동일하게 대응하되,
  세부 원인이 1개뿐이면 그 측면을 2개의 구체적 결과물로 세분화하여 Output을 반드시 2개 이상
  작성 (Output 1개는 절대 금지 — 최소 2개 보장이 1:1 대응보다 우선)
- 절대 금지: 문제나무 원인 개수와 다른 개수의 Outcome/Output을 만들거나, 원인과 무관한
  새로운 주제의 Outcome/Output을 추가하는 것

[부정→긍정 단어 치환 — 반드시 적용]
문제나무 노드의 핵심 명사(대상·분야)는 유지하고, 아래처럼 부정적 서술어만 긍정 서술어로 바꿀 것:
상실→회복/확보, 파괴→재건/구축, 부족→충족/확보, 약화→강화, 저하→향상, 감소→증가,
부재→구축/마련, 미흡→강화, 단절→연계/구축, 제한→확대, 악화→개선
예: "쿼카서식지 모니터링 인프라 미비" → "쿼카서식지 모니터링 인프라 구축"
   (절대: "지역사회 역량 강화" 같은 전혀 다른 일반론으로 바꾸지 말 것)

목표나무 구조 규칙 (최소 개수 반드시 충족 — 부실하게 만들지 말 것):
1. Impact(영향/목표): SDGs와 연계한 장기 변화 목표 (1개)
2. Purpose(사업목적): 사업 종료 시 달성할 핵심 목적 (1개)
3. Outcomes(성과/산출목적): 위 1:1 대응 원칙에 따른 개수, 각각 outputs 포함
4. Activities(활동): 모든 Output을 합쳐 각 Output당 1~2개씩 구체적인 활동을 만들어
   activities 배열에 담을 것(절대 빈 배열로 두지 말 것). 이후 PDM 단계에서 이 활동들이
   그대로 이어져 확장되므로, 추상적 구호가 아니라 실행 가능한 구체적 활동으로 작성

작성 규칙:
- 모든 노드 텍스트는 "긍정적 목표 형태"로 작성 (향상, 강화, 확대, 구축 등)
- SMART 원칙 적용: 측정 가능하고 구체적인 표현
- Output 텍스트는 추상적 구호가 아니라 구체적인 결과물로 작성
  ❌ 역량 강화  →  ✅ 교사 대상 상담기법 교육과정 개발 및 운영
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
  "activities": [
    {"id": "act1", "text": "산출물 1.1을 위한 구체적 활동", "level": "activity"},
    {"id": "act2", "text": "산출물 1.2를 위한 구체적 활동", "level": "activity"}
  ]
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
  const { title, country, field, idea, coreProblem, problemTree, expertInsights, projectType, pmcSourceDocs } = body;

  if (!isOpenAIConfigured()) {
    return NextResponse.json({ success: true, tree: FALLBACK_TREE });
  }

  const pmcBlock = projectType === 'pmc' ? buildPmcPromptBlock(pmcSourceDocs) : buildReferencePromptBlock(pmcSourceDocs);

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
문제나무 구조를 그대로 따라가며, 각 원인의 핵심 소재는 유지한 채 부정 서술어만 긍정 서술어로
전환하세요 (시스템 프롬프트의 단어 치환표·1:1 대응 원칙을 정확히 따를 것).
${pmcBlock}
[사업 정보]
${contextLines}

[생성 요구사항 — 문제나무와 정확히 1:1 대응, 임의로 개수를 바꾸지 말 것]
- Impact: SDGs 목표 번호 포함, 장기 변화 1개
- Purpose: SMART 목적 1개 (사업 기간 내 달성)
- Outcomes: 위 문제나무의 직접 원인(causes) 개수와 정확히 동일한 개수, 같은 순서로 1개씩 대응.
  각 Outcome의 Output 개수는 해당 직접 원인의 세부 원인(children) 개수에 맞추되, 세부 원인이
  1개뿐이면 Output을 2개 이상으로 세분화 (Output 1개는 절대 금지)
- Activities: activities를 빈 배열로 두지 말 것. 모든 Output에 대해 1~2개씩 구체적 활동을
  만들어 합산한 flat 배열로 작성 (Output 개수가 N개면 activities는 최소 N개 이상)

[최우선 — "핵심 아이디어"에 사용자가 명시적으로 요청한 내용은 절대 누락 금지]
"핵심 아이디어" 텍스트 안에 "~꼭 추가해줘", "~포함해줘", "~빠지지 않게 해줘"처럼 사용자가 직접
요청한 구체적 내용이 있으면, 가장 알맞은 Outcome 또는 Output에 반드시 반영하세요. 일반적인 설명으로
취급하지 말고, 명시적 요청은 결과물에 빠짐없이 나타나야 합니다.

JSON만 출력:`;

  try {
    const raw = await generateTextPro([{ role: 'user', content: userPrompt }], SYSTEM_PROMPT);
    const tree = parseAIJson(raw) as {
      impact?: string;
      purpose?: string;
      outcomes?: unknown[];
      outputs?: unknown[];
      activities?: unknown[];
    };

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
