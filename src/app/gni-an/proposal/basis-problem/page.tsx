import { SectionPage } from '@/components/proposal/SectionPage';
import { ProblemTreeEditor } from '@/components/proposal/ProblemTreeEditor';

export default function BasisProblemPage() {
  return (
    <SectionPage
      sectionId="basis-problem"
      sectionTitle="문제분석"
      fullTitle="I-1 라. 문제분석"
      tags={['핵심 문제', '문제나무', '직접 원인', '근본 원인']}
      guide={`문제나무(Problem Tree) 시각화로 문제 인과관계를 분석합니다.

■ 구조:
① 결과/영향 (Effects): 핵심 문제가 해결되지 않을 때 나타나는 최종 영향
② 핵심 문제 (Core Problem): 사업이 해결하고자 하는 중심 문제
③ 직접 원인 (Immediate Causes): 핵심 문제의 직접적 원인 (2~3개)
④ 세부 원인 (Underlying Causes): 각 직접 원인의 하위 원인 (각 2개 이상)
⑤ 근본 원인 (Root Causes): 사회·경제·문화·제도적 원인

■ 편집 방법:
- 노드 클릭 → 텍스트 편집
- 노드 호버 → ✎(편집) ✕(삭제) 버튼
- 노드 하단 호버 → +형제 / +하위 버튼

심사 체크포인트:
- 핵심 문제가 명확히 정의되었는가
- 원인 분석이 3단계 이상 체계적으로 구성되었는가
- 근본 원인이 사회/구조적 수준까지 식별되었는가`}
      planningDataHints={['문제 분석', 'AI 초기 분석', '전문가 인사이트']}
      customContent
      autoDraft={false}
    >
      <ProblemTreeEditor />
    </SectionPage>
  );
}
