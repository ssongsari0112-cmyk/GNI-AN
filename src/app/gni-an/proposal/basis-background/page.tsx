import { SectionPage } from '@/components/proposal/SectionPage';

export default function BasisBackgroundPage() {
  return (
    <SectionPage
      sectionId="basis-background"
      sectionTitle="사업배경"
      fullTitle="I-1 가. 사업배경"
      tags={['국가 현황', 'SDGs 연계', 'CPS 부합', 'SDGs', 'CPS']}
      guide={`기관의 사업 추진 배경을 기술합니다.
■ 권장 서술 구조:
① 대상 국가/지역의 개발 현황: 경제·사회 지표, 인간개발지수(HDI), 빈곤율 등 정량 데이터
② SDGs 연계: 관련 SDG 목표 및 세부목표(Target) 번호와 사업과의 구체적 연결
③ CPS(국가협력전략) 부합성: KOICA 중점협력국/분야와의 연계
④ 해당 분야 국제사회 동향: 최신 국제 정책·전략·논의 동향
⑤ 기관의 사업 추진 배경: 해당 국가/분야 경험, 사업 착수 동기
※ 각 단락에 출처를 명시하세요. (예: World Bank, UNDP HDR 등)

심사 체크포인트:
- 대상 국가 현황이 분석되었는가
- SDGs와의 연계가 명시되었는가
- KOICA CPS와의 부합성이 제시되었는가`}
      planningDataHints={['AI 초기 분석', '전문가 인사이트']}
      minWords={1000}
      maxWords={2500}
    />
  );
}
