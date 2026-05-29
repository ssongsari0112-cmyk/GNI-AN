import { SectionPage } from '@/components/proposal/SectionPage';

export default function MonitoringPlanPage() {
  return (
    <SectionPage
      sectionId="monitoring-plan"
      sectionTitle="사업 이행 모니터링 및 성과 평가"
      fullTitle="III-1 사업 이행 모니터링 및 성과 평가"
      tags={['모니터링 체계', '지표 관리', '데이터 수집', 'M&E']}
      guide={`사업 모니터링 및 평가 체계를 기술합니다.
■ 권장 서술 구조:
① 모니터링 체계 표: | 주기 | 활동 | 방법 | 담당자 |
- 월간, 분기, 반기, 연간 모니터링 활동 구분
② 성과지표 관리: PDM 지표별 데이터 수집 계획, 수집 방법, 빈도, 담당자
③ 중간 평가 계획: 시기, 방법(내부/외부 평가), 평가 기준
④ 데이터 수집 및 분석: 정량/정성 데이터 수집 도구
⑤ 성과 환류: 모니터링 결과를 사업 활동에 반영하는 절차
※ 모니터링 체계는 PDM 지표와 직접 연결되어야 합니다.

심사 체크포인트:
- 모니터링 체계가 구체적인가
- 성과지표 관리 방안이 있는가
- 데이터 수집 계획이 있는가`}
      exampleContent={`예시 1: 모니터링 주기 — 월간 진도보고, 분기별 현장 모니터링, 연간 성과검토
예시 2: 성과지표 관리 — PDM 지표별 데이터 수집표, 기초선/중간값/목표값 추적
예시 3: 데이터 수집 — 수혜자 설문조사 연 2회, 정부기관 통계 월간 확인`}
      planningDataHints={['전문가 인사이트']}
      minWords={800}
      maxWords={2000}
    />
  );
}
