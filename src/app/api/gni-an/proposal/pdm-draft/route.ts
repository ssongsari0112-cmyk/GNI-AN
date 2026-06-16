import { NextRequest, NextResponse } from 'next/server';
import type { PDMRow } from '@/types';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function buildFallbackPdm(ctx: Record<string, string>): PDMRow[] {
  const country = ctx.country || '대상 국가';
  const field = ctx.field || '농촌개발';
  const problem = ctx.coreProblem || '기후변화 취약성 및 식량 불안정';

  return [
    {
      id: uid(),
      level: 'impact',
      code: 'Impact',
      narrative: `${country} 농촌 지역 주민의 식량 안보 향상 및 빈곤 감소`,
      indicators: `대상 지역 식량 불안정 가구 비율 62% → 35% 이하 (사업 종료 후 5년)\n농촌 가구 평균 소득 40% 이상 향상`,
      verificationMeans: '정부 통계, 수혜자 가구 조사',
      assumptions: '거시경제 안정 및 국가 식량 정책 지속',
    },
    {
      id: uid(),
      level: 'purpose',
      code: 'Purpose',
      narrative: `기후변화 대응 농업 기술 보급을 통한 ${field} 분야 역량 강화`,
      indicators: `직접 수혜 농민의 70% 이상이 기후적응 기술 습득 및 현장 적용 (사업 종료 시)\n여성 농민 참여율 50% 이상`,
      verificationMeans: '기술 이수율 조사, 현장 적용 관찰 기록',
      assumptions: '지방정부의 정책 지지 유지\n극단적 기후 사건 미발생',
      children: [
        {
          id: uid(),
          level: 'outcome',
          code: 'Outcome 1',
          narrative: '기후변화 대응 농민 역량 강화',
          indicators: `기후적응 기술 훈련 이수율 70% (3차년도)\n시범 포장 수확량 전통 농법 대비 30% 증가`,
          verificationMeans: '교육 이수 명단, 수확량 기록부',
          assumptions: '농민의 교육 참여 의지 유지',
          children: [
            {
              id: uid(),
              level: 'output',
              code: 'Output 1.1',
              narrative: '기후적응 농업 기술 훈련 프로그램 운영 완료',
              indicators: `훈련 총 회수 26회 (3년 합계)\n훈련 참여 농민 3,000명 (남성 1,350 / 여성 1,650)`,
              verificationMeans: '훈련 참석자 명단, 사진 기록',
              assumptions: '훈련 시설 및 강사 확보 가능',
              children: [
                {
                  id: uid(),
                  level: 'activity',
                  code: 'A 1.1.1',
                  narrative: '기후변화 대응 농업 기술 교육 실시 (농민학교 FFS 방식)',
                  indicators: '연간 교육 횟수 달성',
                  verificationMeans: '교육 보고서, 참석자 명단',
                  assumptions: '농민 동원 협조',
                },
                {
                  id: uid(),
                  level: 'activity',
                  code: 'A 1.1.2',
                  narrative: '현장 시범 포장(Demo Plot) 운영 및 결과 공유 워크숍',
                  indicators: '마을별 시범 포장 15개소 운영',
                  verificationMeans: '현장 방문 기록, 워크숍 참석자 명단',
                  assumptions: '토지 사용 허가 획득',
                },
              ],
            },
            {
              id: uid(),
              level: 'output',
              code: 'Output 1.2',
              narrative: '기후적응 고수확 품종 현장 시험 재배 완료',
              indicators: `시험 재배 품종 3종 이상 선발\n시범 재배 농가 500가구 이상`,
              verificationMeans: '품종 시험 결과 보고서, 수확량 기록',
              assumptions: '국립 농업연구원(NARC) 협력 유지',
              children: [
                {
                  id: uid(),
                  level: 'activity',
                  code: 'A 1.2.1',
                  narrative: '기후적응 품종 선발 및 500가구 종자 보급',
                  indicators: '500가구 종자 배포 완료',
                  verificationMeans: '종자 배포 명단',
                  assumptions: '종자 수급 안정',
                },
                {
                  id: uid(),
                  level: 'activity',
                  code: 'A 1.2.2',
                  narrative: '현장 시험 재배 관리 및 데이터 수집',
                  indicators: '수확량 데이터 500건 수집',
                  verificationMeans: '수확 기록부',
                  assumptions: '농민의 기록 협조',
                },
              ],
            },
          ],
        },
        {
          id: uid(),
          level: 'outcome',
          code: 'Outcome 2',
          narrative: '개선된 종자·투입재 공급 체계 구축',
          indicators: `공인 개량 종자 접근 농가 비율 21% → 60% (3차년도)\n마을 종자 은행 5개소 자립 운영`,
          verificationMeans: '종자 은행 운영 기록, 농가 조사',
          assumptions: '지방정부의 제도화 지원',
          children: [
            {
              id: uid(),
              level: 'output',
              code: 'Output 2.1',
              narrative: '마을 종자 은행 5개소 설립 및 운영 체계 구축',
              indicators: `1차년도 종료 시 5개소 설립 완료\n운영위원회 구성(여성 위원 50% 이상)`,
              verificationMeans: '종자 은행 등록 서류, 운영위원회 명단',
              assumptions: '마을 토지·공간 확보',
              children: [
                {
                  id: uid(),
                  level: 'activity',
                  code: 'A 2.1.1',
                  narrative: '마을 종자 은행 시설 설치 및 초기 재고 확보',
                  indicators: '5개소 설치 완료, 마을당 250kg 초기 재고',
                  verificationMeans: '시설 사진, 재고 기록부',
                  assumptions: '건설 자재 수급 가능',
                },
                {
                  id: uid(),
                  level: 'activity',
                  code: 'A 2.1.2',
                  narrative: '운영위원회 구성 및 종자 관리 역량 교육',
                  indicators: '운영위원 교육 이수 100%',
                  verificationMeans: '교육 이수 명단',
                  assumptions: '위원회 구성원 참여 의지',
                },
              ],
            },
            {
              id: uid(),
              level: 'output',
              code: 'Output 2.2',
              narrative: '지방정부 연계 종자 품질 관리 체계 구축',
              indicators: `지방 종자품질관리소(SQCC) MOU 체결\n2차년도까지 종자 품질 검사 시스템 도입`,
              verificationMeans: 'MOU 문서, 검사 기록',
              assumptions: '지방 SQCC의 협력 의지',
              children: [
                {
                  id: uid(),
                  level: 'activity',
                  code: 'A 2.2.1',
                  narrative: '지방 SQCC와 협력 약정 체결 및 역할 분담 확정',
                  indicators: 'MOU 체결 (1차년도 내)',
                  verificationMeans: 'MOU 문서',
                  assumptions: '정부 기관 협력 승인',
                },
                {
                  id: uid(),
                  level: 'activity',
                  code: 'A 2.2.2',
                  narrative: '종자 품질 관리 매뉴얼 현지어 번역 및 보급',
                  indicators: '매뉴얼 500부 배포',
                  verificationMeans: '배포 명단',
                  assumptions: '번역 전문가 확보',
                },
              ],
            },
          ],
        },
      ],
    },
  ];
}

export async function POST(req: NextRequest) {
  try {
    const { projectContext } = await req.json();
    const pdm = buildFallbackPdm(projectContext || {});
    return NextResponse.json({ success: true, pdm });
  } catch (error) {
    const message = error instanceof Error ? error.message : '오류가 발생했습니다.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
