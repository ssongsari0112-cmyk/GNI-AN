import { SectionPage } from '@/components/proposal/SectionPage';

export default function BasisDemandPage() {
  return (
    <SectionPage
      sectionId="basis-demand"
      sectionTitle="사업 수요"
      fullTitle="I-1 나. 사업 수요"
      tags={['수요 조사', '기초선 데이터', '지역 선정', 'Baseline']}
      guide={`대상 지역의 구체적인 사업 수요를 분석합니다.
■ 권장 서술 구조:
① 대상 지역 현황 표: 주요 지표(인구, 빈곤율, 교육률, 보건 접근성 등)를 표로 정리
② 현지 수요 조사 결과: 조사 방법(설문, 인터뷰, FGD 등) 및 주요 발견사항
③ 기초선(Baseline) 데이터: 사업 핵심 지표의 현재 수준
④ 분야별 수요 분석: 소제목으로 분야를 구분하여 기술
⑤ 대상 지역 선정 근거: 왜 이 지역이 가장 적합한지에 대한 비교 분석
※ 정량적 지표와 정성적 지표를 균형 있게 포함하세요.

심사 체크포인트:
- 현지 수요 조사 결과가 제시되었는가
- 기초선 데이터가 있는가
- 대상 지역 선정 근거가 명확한가`}
      planningDataHints={['수혜자', '전문가 인사이트']}
      minWords={800}
      maxWords={2000}
    />
  );
}
