import { SectionPage } from '@/components/proposal/SectionPage';

export default function BasisProblemPage() {
  return (
    <SectionPage
      sectionId="basis-problem"
      sectionTitle="문제분석"
      fullTitle="I-1 라. 문제분석"
      tags={['핵심 문제', '문제나무', '근본 원인']}
      guide={`해결하고자 하는 문제를 체계적으로 분석합니다.
■ 권장 서술 구조:
① 문제 분석 결과 개요: 핵심 문제를 한 문장으로 진술
② 원인 분석(문제나무 텍스트):
- 핵심 문제: 한 문장으로
- 직접 원인 1: [제목] — 하위 원인들
- 직접 원인 2: [제목] — 하위 원인들
- 근본 원인: 각 직접 원인의 깊은 원인
③ 문제의 결과/영향: 문제가 지속될 경우 예상 결과
※ 문제나무를 텍스트 기반으로 구조화하여 논리적 인과관계를 명확히 하세요.

심사 체크포인트:
- 핵심 문제가 명확히 정의되었는가
- 문제나무 분석이 체계적인가
- 근본 원인이 식별되었는가`}
      planningDataHints={['문제 분석', 'AI 초기 분석', '전문가 인사이트']}
      minWords={800}
      maxWords={2000}
    />
  );
}
