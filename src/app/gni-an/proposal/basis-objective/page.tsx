import { SectionPage } from '@/components/proposal/SectionPage';

export default function BasisObjectivePage() {
  return (
    <SectionPage
      sectionId="basis-objective"
      sectionTitle="목표분석"
      fullTitle="I-1 마. 목표분석"
      tags={['목표 체계', 'SMART', '변화이론', 'ToC']}
      guide={`사업 목표를 체계적으로 제시합니다. 문제나무의 원인을 긍정적으로 전환하여 목표나무를 구성합니다.
■ 권장 서술 구조:
① 목표 분석 결과 개요: 목표 달성 방향 1~2문장 요약
② 영향(Impact): SDGs와 연계한 궁극적 변화
③ 사업목적(Outcome) 체계:
- 목적 1: [제목] — 문제 분석의 직접 원인 1에 대응
- 목적 2: [제목] — 문제 분석의 직접 원인 2에 대응
④ 변화이론(Theory of Change): 사업 활동이 최종 목표로 이어지는 경로
※ 목표 체계는 PDM과 반드시 일치해야 합니다.

심사 체크포인트:
- 목표 체계가 논리적으로 구성되었는가
- 목표가 SMART 원칙을 충족하는가
- 변화이론이 설명되었는가`}
      planningDataHints={['목표 체계', '전문가 인사이트']}
      minWords={600}
      maxWords={1500}
    />
  );
}
