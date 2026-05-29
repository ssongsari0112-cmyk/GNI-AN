import { SectionPage } from '@/components/proposal/SectionPage';

export default function PlanCrosscuttingPage() {
  return (
    <SectionPage
      sectionId="plan-crosscutting"
      sectionTitle="범분야 이슈 고려"
      fullTitle="I-2 라. 범분야 이슈 고려"
      tags={['젠더', '환경', '포용성', 'Gender', 'HRBA']}
      guide={`범분야 이슈에 대한 고려 방안을 기술합니다.
■ 권장 서술 구조:
① 젠더 주류화: 젠더 분석 결과, 여성 참여율 목표, GBV 예방 계획
② 환경 영향 평가: 긍정/부정 영향 분석, 최소화 방안, 기후변화 적응 전략
③ 포용성: 장애 포용성, 소외계층(소수민족, 여성가장, 고령자 등) 포함 방안
- HRBA(인권기반접근) 적용: 권리 보유자/의무 이행자 분석
※ 범분야 이슈는 모든 활동에 통합적으로 반영해야 합니다.

심사 체크포인트:
- 젠더 주류화가 고려되었는가
- 환경 영향이 고려되었는가
- 사회적 포용성이 고려되었는가`}
      planningDataHints={['전문가 인사이트']}
      minWords={500}
      maxWords={1500}
    />
  );
}
