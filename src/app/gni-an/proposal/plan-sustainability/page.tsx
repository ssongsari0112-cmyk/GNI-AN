import { SectionPage } from '@/components/proposal/SectionPage';

export default function PlanSustainabilityPage() {
  return (
    <SectionPage
      sectionId="plan-sustainability"
      sectionTitle="사업 지속가능성 전략"
      fullTitle="I-2 다. 사업 지속가능성 전략"
      tags={['출구 전략', '이관 계획', '역량 강화', 'Exit Strategy', 'Ownership']}
      guide={`사업 종료 후 지속가능성 확보 전략을 기술합니다.
■ 권장 서술 구조:
① 출구 전략(Exit Strategy): 단계적 철수 계획 — 이관 시점/대상/조건 명시
② 현지 이관 계획: 역량 이전(ToT, 매뉴얼), 기술 이전(장비·시설, 운영교육)
③ 재정적 지속가능성: 현지 정부 예산 반영 계획, 수익 모델, 자체 기금
④ 제도적 지속가능성: 정책·제도화를 통한 지속성 확보
※ 출구 전략은 사업 기획 단계부터 명확히 수립해야 합니다.

심사 체크포인트:
- 출구 전략이 구체적인가
- 현지 이관 계획이 있는가
- 자립을 위한 역량 강화가 계획되었는가`}
      planningDataHints={['전문가 인사이트']}
      minWords={800}
      maxWords={2000}
    />
  );
}
