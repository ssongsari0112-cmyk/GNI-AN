'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StepHeader } from '@/components/layout/StepHeader';
import { Button } from '@/components/ui/Button';
import { useProjectStore } from '@/lib/store/projectStore';
import type { IdeationData } from '@/types';
import { AlertCircle, ChevronDown, ChevronUp, Search, X } from 'lucide-react';

const FIELDS = ['교육', '보건', '농업/식량', '식수/위생', '거버넌스', '환경/기후', '경제/소득', '젠더', '도시/주거', '인도적지원', '직업훈련', '기타'];

const COUNTRIES: { name: string; code: string }[] = [
  { name: '네팔', code: 'NPL' },
  { name: '방글라데시', code: 'BGD' },
  { name: '캄보디아', code: 'KHM' },
  { name: '라오스', code: 'LAO' },
  { name: '미얀마', code: 'MMR' },
  { name: '몽골', code: 'MNG' },
  { name: '필리핀', code: 'PHL' },
  { name: '스리랑카', code: 'LKA' },
  { name: '우즈베키스탄', code: 'UZB' },
  { name: '키르기스스탄', code: 'KGZ' },
  { name: '타지키스탄', code: 'TJK' },
  { name: '파키스탄', code: 'PAK' },
  { name: '에티오피아', code: 'ETH' },
  { name: '가나', code: 'GHA' },
  { name: '케냐', code: 'KEN' },
  { name: '모잠비크', code: 'MOZ' },
  { name: '르완다', code: 'RWA' },
  { name: '세네갈', code: 'SEN' },
  { name: '탄자니아', code: 'TZA' },
  { name: '우간다', code: 'UGA' },
  { name: '볼리비아', code: 'BOL' },
  { name: '콜롬비아', code: 'COL' },
  { name: '에콰도르', code: 'ECU' },
  { name: '엘살바도르', code: 'SLV' },
  { name: '과테말라', code: 'GTM' },
  { name: '기타', code: 'ETC' },
];

const IDEA_EXAMPLES = [
  {
    label: '교육 / 캄보디아',
    text: '캄보디아 농촌 지역 아동의 교육 기회 불평등 문제를 해결하기 위해 교사 역량 강화 프로그램과 학교 인프라 개선을 통한 초등교육 접근성 향상 사업을 추진하고자 합니다.',
  },
  {
    label: '보건 / 에티오피아',
    text: '에티오피아 농촌 지역의 모자보건 서비스 접근성 부족 문제를 해결하기 위해 지역사회 보건요원 역량 강화와 보건소 시설 개선을 통한 산모 및 아동 건강 증진 사업을 추진하고자 합니다.',
  },
  {
    label: '직업훈련 / 네팔',
    text: '네팔 청년층의 높은 실업률과 기술 역량 부족 문제를 해결하기 위해 시장 수요 기반의 직업기술 훈련 프로그램 운영과 취업 연계 지원을 통한 청년 경제적 자립 역량 강화 사업을 추진하고자 합니다.',
  },
];

function CountrySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.includes(query) ||
      c.code.toLowerCase().includes(query.toLowerCase())
  );

  const selected = COUNTRIES.find((c) => c.name === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#8AA81E] focus:border-transparent bg-white"
      >
        {selected ? (
          <span className="text-gray-800">
            {selected.name}
            <span className="ml-2 text-xs text-gray-400 font-mono">{selected.code}</span>
          </span>
        ) : (
          <span className="text-gray-400">국가를 선택하세요</span>
        )}
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg">
              <Search size={13} className="text-gray-400 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="국가명 또는 코드로 검색"
                className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')}>
                  <X size={12} className="text-gray-400" />
                </button>
              )}
            </div>
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-400 text-center">검색 결과 없음</li>
            ) : (
              filtered.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(c.name);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-[#EEF5D6] transition-colors ${
                      value === c.name ? 'bg-[#EEF5D6] text-[#5a7012] font-medium' : 'text-gray-700'
                    }`}
                  >
                    <span>{c.name}</span>
                    <span className="text-xs font-mono text-gray-400">{c.code}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function IdeaExampleToggle({ onUse }: { onUse: (text: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs text-[#8AA81E] hover:text-[#799516] transition-colors font-medium"
      >
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        사업 아이디어 작성예시
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {IDEA_EXAMPLES.map((ex) => (
            <div key={ex.label} className="bg-[#F7F8F2] border border-[#D9E6B7] rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-semibold text-[#8AA81E] uppercase tracking-wide mb-1 block">{ex.label}</span>
                  <p className="text-xs text-gray-600 leading-relaxed">{ex.text}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onUse(ex.text)}
                  className="flex-shrink-0 text-[11px] text-[#8AA81E] hover:text-[#799516] font-medium border border-[#D9E6B7] hover:border-[#8AA81E] rounded px-2 py-0.5 transition-colors whitespace-nowrap"
                >
                  적용
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function IdeationPage() {
  const router = useRouter();
  const { setIdeation, setIdeationAnalysis, setExperts } = useProjectStore();

  const [form, setForm] = useState<IdeationData>({
    field: '',
    country: '',
    subRegion: '',
    idea: '',
    beneficiaries: '',
    budget: '',
    duration: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = form.field && form.country && form.idea.length >= 50;

  async function handleSubmit() {
    if (!isValid) return;
    setLoading(true);
    setError('');

    try {
      setIdeation(form);

      const [analyzeRes, expertsRes] = await Promise.all([
        fetch('/api/gni-an/ideation/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }),
        fetch('/api/gni-an/consulting/experts/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ field: form.field, country: form.country }),
        }),
      ]);

      const [analyzeData, expertsData] = await Promise.all([analyzeRes.json(), expertsRes.json()]);

      if (!analyzeData.success) throw new Error(analyzeData.error);
      if (!expertsData.success) throw new Error(expertsData.error);

      setIdeationAnalysis(analyzeData.data);
      setExperts(expertsData.data);

      router.push('/gni-an/ideation/experts');
    } catch (err) {
      setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F8F2]">
      <StepHeader />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#111827] mb-2">사업 아이디어 입력</h1>
          <p className="text-gray-500 text-sm">핵심 정보를 입력하면 AI가 분석하고 전문가 상담으로 연결됩니다.</p>
        </div>

        <div className="space-y-5">
          {/* 필수 항목 */}
          <div className="bg-white rounded-2xl border border-[#D9E6B7] p-6 space-y-5">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
              필수 입력
              <span className="text-red-500">*</span>
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                사업 분야 <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {FIELDS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setForm({ ...form, field: f })}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      form.field === f
                        ? 'bg-[#8AA81E] border-[#8AA81E] text-white'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-[#8AA81E] hover:text-[#8AA81E]'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                대상 국가 <span className="text-red-500">*</span>
              </label>
              <CountrySelect
                value={form.country}
                onChange={(v) => setForm({ ...form, country: v })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                사업 아이디어 <span className="text-red-500">*</span>
                <span className="text-gray-400 font-normal ml-2">최소 50자</span>
              </label>
              <textarea
                value={form.idea}
                onChange={(e) => setForm({ ...form, idea: e.target.value })}
                rows={5}
                placeholder="해결하고자 하는 문제와 사업 방향을 자유롭게 작성해주세요."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8AA81E] focus:border-transparent resize-none"
              />
              <div className={`text-right text-xs mt-1 ${form.idea.length >= 50 ? 'text-[#8AA81E]' : 'text-gray-400'}`}>
                {form.idea.length}자 {form.idea.length < 50 && `(${50 - form.idea.length}자 더 입력)`}
              </div>
              <IdeaExampleToggle onUse={(text) => setForm({ ...form, idea: text })} />
            </div>
          </div>

          {/* 선택 항목 */}
          <div className="bg-white rounded-2xl border border-[#D9E6B7] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">선택 입력</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">세부 지역</label>
                <input
                  type="text"
                  value={form.subRegion}
                  onChange={(e) => setForm({ ...form, subRegion: e.target.value })}
                  placeholder="예: 남부 농촌 지역"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8AA81E] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">주요 수혜자</label>
                <input
                  type="text"
                  value={form.beneficiaries}
                  onChange={(e) => setForm({ ...form, beneficiaries: e.target.value })}
                  placeholder="예: 초등학교 아동 500명"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8AA81E] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">총사업비</label>
                <input
                  type="text"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  placeholder="예: 3억원"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8AA81E] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">예상 기간</label>
                <input
                  type="text"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="예: 3년"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8AA81E] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            loading={loading}
            size="lg"
            className="w-full"
          >
            {loading ? 'AI 분석 중...' : 'AI 분석 시작'}
          </Button>
          {!isValid && (
            <p className="text-center text-xs text-gray-400">필수 항목(분야, 국가, 아이디어 50자 이상)을 모두 입력해주세요.</p>
          )}
        </div>
      </main>
    </div>
  );
}
