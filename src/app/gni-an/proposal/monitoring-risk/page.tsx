import { SectionPage } from '@/components/proposal/SectionPage';

export default function MonitoringRiskPage() {
  return (
    <SectionPage
      sectionId="monitoring-risk"
      sectionTitle="위험관리계획"
      fullTitle="III-3 위험관리계획"
      tags={['위험 식별', '대응 방안', '비상 체계', 'Risk Matrix']}
      guide={`사업 수행 시 예상되는 위험과 관리 방안을 기술합니다.
■ 권장 서술 구조:
① 위험 식별 및 분석 표:
| 위험 유형 | 위험 내용 | 발생가능성 | 영향도 | 위험 등급 | 대응 방안 | 책임자 |
- 내부(조직·인력·재정) 및 외부(정치·경제·자연재해) 위험 구분
② 위험 유형별 상세 대응 방안: 예방 조치 및 완화 조치
③ 비상 연락 체계: 현장→본부→KOICA→대사관, 보고 절차
④ 위기 시 사업 지속/중단 기준
※ 위험 매트릭스(발생가능성 × 영향도)로 위험 등급을 산정하세요.

심사 체크포인트:
- 주요 위험이 식별되었는가
- 대응 방안이 구체적인가
- 비상 연락망 및 대응 절차가 있는가`}
      exampleContent={`예시 1: 위험 식별 — 정치적 불안정(발생가능성: 중, 영향도: 고), 환율 변동(발생가능성: 높음, 영향도: 중)
예시 2: 대응 방안 — 정치 불안정: 대체 활동지역 확보 / 환율 변동: 현지 자금 사전 확보
예시 3: 비상 연락 — 24시간 비상연락망 구축, 주재국 대사관 연락처 공유`}
      planningDataHints={['전문가 인사이트']}
      minWords={600}
      maxWords={1500}
    />
  );
}
