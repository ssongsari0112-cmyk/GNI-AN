import { SectionPage } from '@/components/proposal/SectionPage';

export default function PlanDetailPage() {
  return (
    <SectionPage
      sectionId="plan-detail"
      sectionTitle="세부 추진방안"
      fullTitle="I-2 나. 세부 추진방안"
      tags={['활동 구체성', '추진 방법', '역할 분담']}
      guide={`PDM의 활동별 세부 추진 방안을 기술합니다.
■ 각 활동별 권장 서술 구조:
[활동 X.X.X. 활동명]
- 활동 대상: 직접 수혜자 N명(남성 N명, 여성 N명)
- 활동 빈도: N차년도 N회
- 수행 주체: 한국 수행기관 / 현지 파트너
- 수행자 선정 기준
- 활동 세부 내용: 구체적 방법, 절차, 도구
- 역할 분담: 한국 측 / 현지 측
※ 각 활동이 PDM의 어떤 산출물(Output)에 기여하는지 번호로 연결하세요.
※ 수혜자 데이터는 성별로 분리하세요.

심사 체크포인트:
- 세부 활동이 구체적으로 기술되었는가
- 추진 방법이 적절한가
- 파트너기관과의 역할 분담이 명확한가`}
      planningDataHints={['목표 체계', '전문가 인사이트']}
      minWords={1500}
      maxWords={4000}
    />
  );
}
