import { SectionPage } from '@/components/proposal/SectionPage';

export default function OperationAccountingPage() {
  return (
    <SectionPage
      sectionId="operation-accounting"
      sectionTitle="회계 프로그램 운용 현황"
      fullTitle="II-3 회계 프로그램 운용 현황"
      tags={['회계 시스템', '재정 통제', '외부 감사']}
      guide={`기관의 회계 관리 체계를 기술합니다.
■ 권장 서술 구조:
① 회계 프로그램 종류 및 사용 현황: 소프트웨어, 도입 시기, 적용 범위
② 재정 관리 체계: 예산 편성·집행·정산 절차, 승인 체계, 영수증 관리
③ 내부 통제 시스템: 이중 승인, 권한 분리, 정기 점검
④ 외부 감사 현황: 감사 기관, 주기, 최근 감사 결과
※ KOICA 정산 기준에 부합하는지 확인하세요.

심사 체크포인트:
- 회계 프로그램이 적절한가
- 내부 통제 시스템이 있는가
- 외부 감사 실시 현황이 제시되었는가`}
      exampleContent={`예시 1: 회계 프로그램 — 사용 중인 프로그램: QuickBooks, SAP 또는 기관 자체 ERP
예시 2: 내부 통제 — 재정 담당자와 PM 이원 승인 체계, 월간 재정 리뷰, 외부 감사 연 1회
예시 3: 재정 관리 — 영수증 기반 관리, 6개월 기한 내 정산`}
      planningDataHints={['전문가 인사이트']}
      minWords={300}
      maxWords={800}
    />
  );
}
