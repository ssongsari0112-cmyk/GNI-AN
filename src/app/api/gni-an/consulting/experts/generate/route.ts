import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { field, country, analysis } = await req.json();

    const experts = [
      {
        id: 'field',
        type: 'field',
        name: `${field} 분야 전문가`,
        title: `${field} 분야 전문가`,
        avatar: 'F',
        status: 'pending',
        questionGuide: [
          `이 사업에서 해결하려는 핵심 ${field} 문제를 어떻게 정의하면 좋을까요?`,
          '주요 이해관계자와 협력 전략은 어떻게 구성해야 하나요?',
          '성과를 측정할 때 어떤 산출·성과 지표가 적절한가요?',
          '반복적으로 나타나는 실패 요인과 예방 방법은 무엇인가요?',
        ],
      },
      {
        id: 'regional',
        type: 'regional',
        name: `${country} 지역 전문가`,
        title: `${country} 지역 전문가`,
        avatar: 'R',
        status: 'pending',
        questionGuide: [
          `${country}의 최신 국가개발계획 또는 정책 우선순위는 무엇인가요?`,
          'KOICA CPS와 제 아이디어는 어떤 부분에서 부합하나요?',
          '현지에서 반드시 고려해야 할 정치·안보·기후·문화 리스크는 무엇인가요?',
          '함께 수행 가능한 현지 파트너 후보와 강점은 무엇인가요?',
        ],
      },
      {
        id: 'planning',
        type: 'planning',
        name: '사업기획 전문가',
        title: '사업기획 전문가',
        avatar: 'P',
        status: 'pending',
        questionGuide: [
          '제 아이디어의 핵심 문제를 Problem Tree 관점에서 정의한다면 원인·결과 구조는 어떻게 잡는 것이 좋을까요?',
          'Theory of Change로 풀어내면 투입→활동→산출→성과→영향의 변화 경로는 어떻게 구성해야 하나요?',
          '사업 규모와 예산을 고려할 때 수혜 대상과 개입 범위는 어느 수준으로 잡는 것이 현실적인가요?',
          '종료 후에도 지속되려면 어떤 출구 전략을 설계해야 하나요?',
        ],
      },
      {
        id: 'me',
        type: 'me',
        name: 'M&E 전문가',
        title: 'M&E 전문가',
        avatar: 'M',
        status: 'pending',
        questionGuide: [
          '기대 성과를 측정할 Outcome 지표 후보 2~3개를 SMART 원칙에 맞춰 제안해주세요.',
          '국제적으로 통용되는 표준 지표 프레임워크가 있다면 어떻게 활용할 수 있나요?',
          '기초선 조사를 처음 설계한다면 어떤 수집 방법과 표본 원칙이 적절한가요?',
          '데이터 수집이 어려운 상황에서 실현 가능한 모니터링 체계는 어떻게 설계해야 하나요?',
        ],
      },
    ];

    return NextResponse.json({ success: true, data: experts });
  } catch (error) {
    const message = error instanceof Error ? error.message : '전문가 생성 중 오류가 발생했습니다.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
