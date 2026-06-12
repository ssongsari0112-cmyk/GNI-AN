'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowLeft, ArrowRight, Sparkles, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Collapsible } from '@/components/ui/Collapsible';
import { useProjectStore } from '@/lib/store/projectStore';
import { SECTOR_OPTIONS, DEFAULT_PROJECT_DETAILS } from '@/types';
import type { ProjectDetails, PersonInfo, PartnerOrg, YearlyBudget } from '@/types';

function CreateForm() {
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = params.get('returnTo');
  const { project, setProject, projectDetails, setProjectDetails, ideation, summary, getCompletedExpertsCount } = useProjectStore();

  const [form, setForm] = useState({
    title: '',
    organization: '굿네이버스 인터내셔날',
    country: '',
    region: '',
    startDate: '',
    endDate: '',
    budget: '',
  });

  const [details, setDetails] = useState<ProjectDetails>(projectDetails || DEFAULT_PROJECT_DETAILS);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      title: summary?.basicInfo?.title || project?.title || '',
      country: ideation?.country || project?.country || '',
      region: ideation?.subRegion || project?.region || '',
    }));
  }, [ideation, summary, project]);

  useEffect(() => {
    if (!form.startDate || !form.endDate) return;
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
    const years = Math.max(1, Math.ceil(months / 12));
    setDetails((prev) => {
      if (prev.yearlyBudgets.length === years) return prev;
      const totalBudget = parseFloat(form.budget.replace(/[^0-9.]/g, '')) || 0;
      const perYear = years > 0 ? Math.round(totalBudget / years) : 0;
      const yearlyBudgets: YearlyBudget[] = Array.from({ length: years }, (_, i) => ({
        year: i + 1,
        koica: prev.yearlyBudgets[i]?.koica ?? perYear,
        partner: prev.yearlyBudgets[i]?.partner ?? 0,
      }));
      return { ...prev, yearlyBudgets };
    });
  }, [form.startDate, form.endDate, form.budget]);

  function toggleSector(sector: string) {
    setDetails((prev) => ({
      ...prev,
      sectors: prev.sectors.includes(sector) ? prev.sectors.filter((s) => s !== sector) : [...prev.sectors, sector],
    }));
  }

  function addPerson(key: 'domesticManagers' | 'fieldManagers') {
    setDetails((prev) => ({ ...prev, [key]: [...prev[key], { id: crypto.randomUUID(), role: '', name: '' }] }));
  }
  function updatePerson(key: 'domesticManagers' | 'fieldManagers', id: string, field: keyof PersonInfo, value: string) {
    setDetails((prev) => ({ ...prev, [key]: prev[key].map((m) => (m.id === id ? { ...m, [field]: value } : m)) }));
  }
  function removePerson(key: 'domesticManagers' | 'fieldManagers', id: string) {
    setDetails((prev) => ({ ...prev, [key]: prev[key].filter((m) => m.id !== id) }));
  }

  function addPartner() {
    setDetails((prev) => ({ ...prev, partners: [...prev.partners, { id: crypto.randomUUID(), name: '', relationship: '', govRegistered: false }] }));
  }
  function updatePartner(id: string, field: keyof PartnerOrg, value: string | boolean) {
    setDetails((prev) => ({ ...prev, partners: prev.partners.map((p) => (p.id === id ? { ...p, [field]: value } : p)) }));
  }
  function removePartner(id: string) {
    setDetails((prev) => ({ ...prev, partners: prev.partners.filter((p) => p.id !== id) }));
  }

  function updateYearlyBudget(idx: number, field: 'koica' | 'partner', value: string) {
    const num = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
    setDetails((prev) => ({
      ...prev,
      yearlyBudgets: prev.yearlyBudgets.map((y, i) => (i === idx ? { ...y, [field]: num } : y)),
    }));
  }

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
    router.push(returnTo || '/gni-an/proposal/basis-background');
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

        {/* 보고서 양식 추가 정보 */}
        <div className="bg-white rounded-2xl border border-[#D9E6B7] p-6 mt-4">
          <Collapsible trigger="보고서 양식 추가 정보 (선택 - 사업개요 표지/요약표/담당자 표에 반영됩니다)" triggerClassName="text-sm font-semibold text-gray-700">
            <div className="space-y-5 pt-3">
              {/* 사업유형 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">사업 유형</label>
                <div className="flex gap-4">
                  {(['HDP-N', '긴급재난대응'] as const).map((t) => (
                    <label key={t} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="programType"
                        checked={details.programType === t}
                        onChange={() => setDetails({ ...details, programType: t })}
                        className="accent-[#8AA81E]"
                      />
                      {t}
                    </label>
                  ))}
                </div>
              </div>

              {/* 사업분야 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">사업 분야 (복수 선택)</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {SECTOR_OPTIONS.map((s) => (
                    <label key={s} className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={details.sectors.includes(s)}
                        onChange={() => toggleSector(s)}
                        className="accent-[#8AA81E]"
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </div>

              {/* 수혜자 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">직접 수혜자 수</label>
                  <input
                    type="text"
                    value={details.directBeneficiaries}
                    onChange={(e) => setDetails({ ...details, directBeneficiaries: e.target.value })}
                    placeholder="예: 1,710명"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8AA81E]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">간접 수혜자 수</label>
                  <input
                    type="text"
                    value={details.indirectBeneficiaries}
                    onChange={(e) => setDetails({ ...details, indirectBeneficiaries: e.target.value })}
                    placeholder="예: 56,212명"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8AA81E]"
                  />
                </div>
              </div>

              {/* 연차별 사업비 */}
              {details.yearlyBudgets.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">연차별 사업비 분배 (원)</label>
                  <div className="space-y-2">
                    {details.yearlyBudgets.map((y, idx) => (
                      <div key={y.year} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-14 flex-shrink-0">{y.year}차 연도</span>
                        <input
                          type="text"
                          value={y.koica.toLocaleString()}
                          onChange={(e) => updateYearlyBudget(idx, 'koica', e.target.value)}
                          placeholder="KOICA 분담금"
                          className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#8AA81E]"
                        />
                        <input
                          type="text"
                          value={y.partner.toLocaleString()}
                          onChange={(e) => updateYearlyBudget(idx, 'partner', e.target.value)}
                          placeholder="파트너 분담금"
                          className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#8AA81E]"
                        />
                      </div>
                    ))}
                    <p className="text-xs text-gray-400">각 연도의 KOICA 분담금 / 파트너 분담금을 입력하세요. (좌: KOICA, 우: 파트너)</p>
                  </div>
                </div>
              )}

              {/* 사업담당자 - 국내 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">사업담당자 (국내)</label>
                <div className="space-y-2">
                  {details.domesticManagers.map((m) => (
                    <div key={m.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={m.role}
                        onChange={(e) => updatePerson('domesticManagers', m.id, 'role', e.target.value)}
                        placeholder="직책 (예: 인도적지원팀 구양옥 팀장)"
                        className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#8AA81E]"
                      />
                      <input
                        type="text"
                        value={m.name}
                        onChange={(e) => updatePerson('domesticManagers', m.id, 'name', e.target.value)}
                        placeholder="비고 (예: 담당자명)"
                        className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#8AA81E]"
                      />
                      <button type="button" onClick={() => removePerson('domesticManagers', m.id)} className="text-gray-300 hover:text-red-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addPerson('domesticManagers')} className="flex items-center gap-1 text-xs text-[#5a7012] hover:text-[#8AA81E]">
                    <Plus size={12} /> 담당자 추가
                  </button>
                </div>
              </div>

              {/* 사업담당자 - 현지 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">사업담당자 (현지)</label>
                <div className="space-y-2">
                  {details.fieldManagers.map((m) => (
                    <div key={m.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={m.role}
                        onChange={(e) => updatePerson('fieldManagers', m.id, 'role', e.target.value)}
                        placeholder="직책 (예: PM, PO)"
                        className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#8AA81E]"
                      />
                      <input
                        type="text"
                        value={m.name}
                        onChange={(e) => updatePerson('fieldManagers', m.id, 'name', e.target.value)}
                        placeholder="이름"
                        className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#8AA81E]"
                      />
                      <button type="button" onClick={() => removePerson('fieldManagers', m.id)} className="text-gray-300 hover:text-red-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addPerson('fieldManagers')} className="flex items-center gap-1 text-xs text-[#5a7012] hover:text-[#8AA81E]">
                    <Plus size={12} /> 담당자 추가
                  </button>
                </div>
              </div>

              {/* 현지 파트너기관 대표 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">현지 파트너기관 대표</label>
                <input
                  type="text"
                  value={details.fieldRepresentative}
                  onChange={(e) => setDetails({ ...details, fieldRepresentative: e.target.value })}
                  placeholder="예: 굿네이버스 OO 고대선 대표"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8AA81E]"
                />
              </div>

              {/* 파트너기관 정보 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">파트너기관 정보</label>
                <div className="space-y-2">
                  {details.partners.map((p) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => updatePartner(p.id, 'name', e.target.value)}
                        placeholder="기관명"
                        className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#8AA81E]"
                      />
                      <input
                        type="text"
                        value={p.relationship}
                        onChange={(e) => updatePartner(p.id, 'relationship', e.target.value)}
                        placeholder="관계 (예: 협약, MOU 체결예정)"
                        className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#8AA81E]"
                      />
                      <label className="flex items-center gap-1 text-xs text-gray-600 flex-shrink-0 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={p.govRegistered}
                          onChange={(e) => updatePartner(p.id, 'govRegistered', e.target.checked)}
                          className="accent-[#8AA81E]"
                        />
                        등록
                      </label>
                      <button type="button" onClick={() => removePartner(p.id)} className="text-gray-300 hover:text-red-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addPartner} className="flex items-center gap-1 text-xs text-[#5a7012] hover:text-[#8AA81E]">
                    <Plus size={12} /> 파트너기관 추가
                  </button>
                </div>
              </div>

              {/* 좌표 & 비고 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">사업 시행 좌표</label>
                  <input
                    type="text"
                    value={details.coordinates}
                    onChange={(e) => setDetails({ ...details, coordinates: e.target.value })}
                    placeholder={`예: 13°39'47.4"S, 33°52'05.2"E`}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8AA81E]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">표지 비고</label>
                  <input
                    type="text"
                    value={details.documentNote}
                    onChange={(e) => setDetails({ ...details, documentNote: e.target.value })}
                    placeholder="예: 변경안"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8AA81E]"
                  />
                </div>
              </div>
            </div>
          </Collapsible>
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
