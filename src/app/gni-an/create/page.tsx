'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowLeft, ArrowRight, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useProjectStore } from '@/lib/store/projectStore';
import { DEFAULT_PROJECT_DETAILS } from '@/types';
import type { ProjectDetails } from '@/types';

function CreateForm() {
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = params.get('returnTo');
  const { project, setProject, projectDetails, setProjectDetails, ideation, summary, getCompletedExpertsCount, projectType, pmcSourceDocs } = useProjectStore();

  const [form, setForm] = useState({
    title: '',
    organization: '굿네이버스 인터내셔날',
    country: '',
    region: '',
    startDate: '',
    endDate: '',
    budget: '',
  });

  const [details] = useState<ProjectDetails>(projectDetails || DEFAULT_PROJECT_DETAILS);

  const pmcAnalyzed = projectType === 'pmc' ? pmcSourceDocs[0]?.analyzed : undefined;

  useEffect(() => {
    // KOICA 집행계획(안) 원문에서 추출한 기간(예: "2024~2027")을 시작일/종료일로 변환
    let pmcStart = '';
    let pmcEnd = '';
    const durationMatch = pmcAnalyzed?.duration?.match(/(\d{4})\s*[-~](\d{4})/);
    if (durationMatch) {
      pmcStart = `${durationMatch[1]}-01-01`;
      pmcEnd = `${durationMatch[2]}-12-31`;
    }

    setForm((prev) => ({
      ...prev,
      title: summary?.basicInfo?.title || project?.title || pmcAnalyzed?.title || prev.title,
      country: ideation?.country || project?.country || pmcAnalyzed?.country || prev.country,
      region: ideation?.subRegion || project?.region || pmcAnalyzed?.region || prev.region,
      startDate: project?.startDate || pmcStart || prev.startDate,
      endDate: project?.endDate || pmcEnd || prev.endDate,
      budget: project?.budget ? String(project.budget) : (pmcAnalyzed?.budget || prev.budget),
    }));
  }, [ideation, summary, project, pmcAnalyzed]);

  const isValid = form.title && form.organization && form.country && form.startDate && form.endDate && form.budget;

  function handleSubmit() {
    if (!isValid) return;
    setProject({
      ...project!,
      title: form.title,
      organization: form.organization,
      country: form.country,
      region: form.region,
      startDate: form.startDate,
      endDate: form.endDate,
      budget: parseFloat(form.budget.replace(/[^0-9.]/g, '')),
      updatedAt: new Date().toISOString(),
    });
    setProjectDetails(details);
    router.push(returnTo || '/gni-an/proposal/generating');
  }

  const completedExperts = getCompletedExpertsCount();
  const outcomesCount = useProjectStore.getState().structure?.objectiveTree?.outcomes?.length || 0;

  return (
    <div className="min-h-screen bg-[#F7F8F2]">
      <header className="border-b border-[#D9E6B7] bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center gap-2">
          <Link href={returnTo || '/gni-an/ideation/summary'} className="flex items-center gap-1.5 text-gray-400 hover:text-[#8AA81E] transition-colors text-sm">
            <ArrowLeft size={15} />이전
          </Link>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="text-sm font-medium text-[#111827]">프로젝트 정보 확인</span>
          <button
            onClick={() => router.push(returnTo || '/gni-an/proposal/basis-background')}
            title={returnTo ? '변경 없이 돌아가기' : '점검용 건너뛰기'}
            className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-[#8AA81E] border border-gray-200 hover:border-[#8AA81E] rounded-lg px-2.5 py-1.5 transition-colors"
          >
            {returnTo ? '돌아가기' : '건너뛰기'}<ArrowRight size={13} />
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {pmcAnalyzed && (
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
              🏛 KOICA 집행계획(안) 기반 자동 입력됨
            </span>
            <span className="text-xs text-gray-400">필요한 항목은 직접 수정할 수 있습니다</span>
          </div>
        )}
        {/* Summary card */}
        <div className="bg-[#EEF5D6] border border-[#D9E6B7] rounded-2xl p-5 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-[#8AA81E] flex items-center justify-center">
              <Sparkles size={12} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-[#5a7012]">기획 단계 연동 정보</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: '분야', value: ideation?.field || '-' },
              { label: '대상국', value: ideation?.country || '-' },
              { label: '전문가 상담', value: `${completedExperts}개 완료` },
              { label: '프로그램', value: '시민사회협력사업(진입형)' },
            ].map((item) => (
              <div key={item.label}>
                <div className="text-xs text-[#799516] mb-0.5">{item.label}</div>
                <div className="text-sm font-medium text-[#111827] truncate">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#111827] mb-1">프로젝트 정보 입력</h1>
          <p className="text-gray-500 text-sm">제안서 전체에 반영될 기본 정보를 입력해주세요.</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#D9E6B7] p-6 space-y-5">
          {/* 필수 */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">필수 정보</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                사업명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="사업명을 입력하세요"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8AA81E]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                수행기관명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.organization}
                onChange={(e) => setForm({ ...form, organization: e.target.value })}
                placeholder="수행기관명을 입력하세요"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8AA81E]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                대상 국가 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8AA81E]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  사업 시작일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8AA81E]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  사업 종료일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8AA81E]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {[3, 5].map((years) => (
                <button
                  key={years}
                  type="button"
                  onClick={() => {
                    if (!form.startDate) return;
                    const end = new Date(form.startDate);
                    end.setFullYear(end.getFullYear() + years);
                    end.setDate(end.getDate() - 1);
                    setForm({ ...form, endDate: end.toISOString().slice(0, 10) });
                  }}
                  disabled={!form.startDate}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:border-[#8AA81E] hover:text-[#5a7012] hover:bg-[#F7F8F2] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {years}년
                </button>
              ))}
              <span className="text-xs text-gray-400">시작일을 선택하고 버튼을 누르세요</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                총 예산 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                placeholder="예: 300,000,000원 또는 3억원"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8AA81E]"
              />
            </div>
          </div>

          {/* 선택 */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">선택 정보</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">대상 지역</label>
              <input
                type="text"
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                placeholder="예: 남부 농촌 지역"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8AA81E]"
              />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button size="lg" className="w-full" disabled={!isValid} onClick={handleSubmit}>
            제안서 작성 시작 <ArrowRight size={16} />
          </Button>
          {!isValid && (
            <p className="text-center text-xs text-gray-400 mt-2">모든 필수 항목을 입력해주세요.</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense>
      <CreateForm />
    </Suspense>
  );
}
