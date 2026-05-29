import { SectionPage } from '@/components/proposal/SectionPage';

export default function OperationOrganizationPage() {
  return (
    <SectionPage
      sectionId="operation-organization"
      sectionTitle="사업 운영 조직"
      fullTitle="II-1 사업 운영 조직"
      tags={['조직 구조', '핵심 인력', '파트너 협력']}
      guide={`사업 운영 조직과 체계를 기술합니다.
■ 권장 서술 구조:
① 사업팀 구성 표: | 직위 | 성명 | 소속 | 담당 역할 | 투입 비율 |
② PM 역량: 경력, 자격, 주요 수행 사업 실적, 현지 언어 능력
③ 현지 파트너 기관: 조직 구조, 핵심 인력, 유사 사업 경험
④ 역할 분담: 한국 수행기관 / 현지 파트너
⑤ 의사결정 체계: 보고 체계, 월간 팀 회의, 분기별 현지 방문
※ 사업실행계획서의 '사업운영 조직' 양식을 참고하세요.

심사 체크포인트:
- 사업 수행 조직이 명확한가
- PM 등 핵심 인력이 적절한가
- 현지 파트너와의 협력이 구체적인가`}
      exampleContent={`예시 1: "사업 수행 조직" — 본부 운영팀(팀장 1명, 담당자 2명), 현지 조직(현지 코디네이터 1명 상주, 파트너기관 담당자 2명)
예시 2: "PM 역량" — PM(국제개발 10년 경력, 동아프리카 교육사업 3건 수행), 재정담당자, 모니터링 담당자
예시 3: "의사결정 체계" — 월간 팀 회의, 분기별 현지 방문, PM 중심 의사결정 체계`}
      planningDataHints={['전문가 인사이트']}
      minWords={1500}
      maxWords={3500}
    />
  );
}
