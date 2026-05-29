import { SectionPage } from '@/components/proposal/SectionPage';

export default function BasisSelfAssessmentPage() {
  return (
    <SectionPage
      sectionId="basis-self-assessment"
      sectionTitle="파트너기관 자체 평가 결과"
      fullTitle="I-1 바. 파트너기관 자체 평가 결과"
      tags={['파트너 역량', '재정 관리', '개선 계획', 'OCAT', 'Capacity Building']}
      guide={`현지 파트너기관에 대한 자체 평가 결과를 기술합니다.
■ 권장 서술 구조:
① 파트너기관 개요: 설립 연도, 조직 규모, 활동 분야, 주요 사업 실적
② 역량평가 결과: OCAT 등 표준 도구를 활용한 평가
- 평가 항목별 점수(거버넌스, 재정관리, 사업수행, 인사관리, 모니터링 등)
③ 강점 분석: 파트너기관의 비교우위, 현지 네트워크, 전문성
④ 약점 및 개선 계획: 식별된 약점별 구체적 역량 강화 계획
※ 역량평가 도구(OCAT 등)의 점수를 구체적으로 제시하세요.

심사 체크포인트:
- 파트너기관 역량이 평가되었는가
- 재정 관리 역량이 평가되었는가
- 역량 강화 계획이 있는가`}
      planningDataHints={['전문가 인사이트']}
      minWords={500}
      maxWords={1500}
    />
  );
}
