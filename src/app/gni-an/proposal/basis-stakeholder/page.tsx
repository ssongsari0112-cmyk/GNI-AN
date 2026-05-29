import { SectionPage } from '@/components/proposal/SectionPage';

export default function BasisStakeholderPage() {
  return (
    <SectionPage
      sectionId="basis-stakeholder"
      sectionTitle="이해관계자 식별 및 분석"
      fullTitle="I-1 다. 이해관계자 식별 및 분석"
      tags={['수혜자 분석', '성별 분리', '이해관계자', 'Gender']}
      guide={`사업 관련 이해관계자를 식별하고 분석합니다.
■ 권장 서술 구조:
① 직접 수혜자: 성별/연령별 분류 표로 정리(남성/여성, 아동/청소년/성인/노인)
- 수혜자 수, 선정 기준, 취약계층 포함 비율
② 간접 수혜자: 사업의 간접적 혜택을 받는 대상(가족, 지역사회 등)
③ 이해관계자 분석 표:
| 이해관계자 | 역할 | 강점 | 약점 |
- 정부 기관, 지역사회 리더, 유관 기관 등 포함
④ 파트너 기관 분석: 현지 파트너의 역량, 네트워크, 경험 분석
※ 직접 수혜자 데이터는 반드시 성별·연령별로 분리하세요.

심사 체크포인트:
- 수혜자가 구체적으로 분류되었는가
- 성별/연령별 분리 데이터가 있는가
- 이해관계자가 체계적으로 분석되었는가`}
      planningDataHints={['수혜자', '전문가 인사이트']}
      minWords={600}
      maxWords={1500}
    />
  );
}
