import { SectionPage } from '@/components/proposal/SectionPage';

export default function MonitoringEndlinePage() {
  return (
    <SectionPage
      sectionId="monitoring-endline"
      sectionTitle="종료평가 관련 준비 예정 사항"
      fullTitle="III-2 종료평가 관련 준비 예정 사항"
      tags={['종료평가 계획', '교훈 공유', '평가 방법론', 'OECD DAC']}
      guide={`사업 종료평가 준비 계획을 기술합니다.
■ 권장 서술 구조:
① 종료평가 시기 및 방법: 평가 시기(사업 종료 3~6개월 전), 내부/외부 평가 방식
② 평가 기준: OECD DAC 기준(적절성, 효과성, 효율성, 영향력, 지속가능성)
③ 데이터 수집 계획: 종료선 조사 설계, 기초선과 비교 분석 방법
④ 평가 결과 활용 및 교훈 공유: 보고서, 워크숍, KOICA 제출
※ 기초선(Baseline) 조사와 동일한 방법론으로 종료선(Endline) 조사를 실시해야 합니다.

심사 체크포인트:
- 종료평가 계획이 있는가
- 교훈 도출 계획이 있는가
- 기초선과 동일한 방식으로 종료선 조사가 계획되었는가`}
      exampleContent={`예시 1: 종료평가 시기 — 사업 종료 4개월 전 외부평가자 선정, 종료 2개월 전 현장 평가
예시 2: OECD DAC 기준 — 적절성, 효과성, 효율성, 영향력, 지속가능성 기준 적용
예시 3: 교훈 공유 — 내부 결과 공유 워크숍, 파트너기관 공동 리뷰, KOICA 제출`}
      planningDataHints={['전문가 인사이트']}
      minWords={400}
      maxWords={1000}
    />
  );
}
