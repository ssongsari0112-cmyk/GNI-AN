import { SectionPage } from '@/components/proposal/SectionPage';
import { ObjectiveTreeVisual } from '@/components/proposal/ObjectiveTreeVisual';

export default function BasisObjectivePage() {
  return (
    <SectionPage
      sectionId="basis-objective"
      sectionTitle="목표분석"
      fullTitle="I-1 마. 목표분석"
      tags={['목표 체계', 'SMART', '변화이론', 'ToC', 'SDGs']}
      guide={`목표나무(Objective Tree) 시각화로 목표 체계를 구성합니다.
문제나무의 원인을 긍정적 목표로 전환하여 논리적 인과관계를 구성합니다.

■ 구조:
① Impact(영향): SDGs와 연계한 궁극적 장기 변화 목표
② Purpose(사업목적): 사업 기간 내 달성할 핵심 목적 (SMART)
③ Outcomes(성과): 구체적 성과 목표 (문제나무 직접 원인 대응)
④ Outputs(산출물): 각 성과를 달성하기 위한 산출물

■ 편집 방법:
- 노드 클릭 → 텍스트 편집
- 노드 호버 → ✎(편집) ✕(삭제) 버튼
- 노드 하단 호버 → +형제 / +하위 버튼

심사 체크포인트:
- 목표 체계가 PDM과 일치하는가
- Impact → Purpose → Outcomes 논리 흐름이 명확한가
- SMART 원칙이 적용되었는가`}
      planningDataHints={['목표 체계', '전문가 인사이트']}
      customContent
      autoDraft={false}
    >
      <ObjectiveTreeVisual />
    </SectionPage>
  );
}
