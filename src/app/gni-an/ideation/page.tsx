'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { StepHeader } from '@/components/layout/StepHeader';
import { Button } from '@/components/ui/Button';
import { useProjectStore } from '@/lib/store/projectStore';
import type { IdeationData } from '@/types';
import { AlertCircle, Search, X, MapPin, Sparkles, Send, Loader2, Bot, User, Pencil } from 'lucide-react';
import { MarkdownText } from '@/components/ui/MarkdownText';

/* ─── 상수 ─────────────────────────────────────────────── */
const FIELDS = ['교육', '보건', '농업/식량', '식수/위생', '거버넌스', '환경/기후', '경제/소득', '젠더', '도시/주거', '인도적지원', '직업훈련', '기타'];

type Region = '전체' | '아시아' | '아프리카' | '중남미' | '중동' | 'CIS' | '오세아니아';

const COUNTRIES: { name: string; code: string; region: Region }[] = [
  // 아시아
  { name: '베트남', code: 'VN', region: '아시아' },
  { name: '라오스', code: 'LA', region: '아시아' },
  { name: '캄보디아', code: 'KH', region: '아시아' },
  { name: '미얀마', code: 'MM', region: '아시아' },
  { name: '필리핀', code: 'PH', region: '아시아' },
  { name: '인도네시아', code: 'ID', region: '아시아' },
  { name: '네팔', code: 'NP', region: '아시아' },
  { name: '방글라데시', code: 'BD', region: '아시아' },
  { name: '파키스탄', code: 'PK', region: '아시아' },
  { name: '몽골', code: 'MN', region: '아시아' },
  { name: '스리랑카', code: 'LK', region: '아시아' },
  { name: '동티모르', code: 'TL', region: '아시아' },
  { name: '태국', code: 'TH', region: '아시아' },
  { name: '인도', code: 'IN', region: '아시아' },
  { name: '아프가니스탄', code: 'AF', region: '아시아' },
  { name: '부탄', code: 'BT', region: '아시아' },
  // 아프리카
  { name: '에티오피아', code: 'ET', region: '아프리카' },
  { name: '탄자니아', code: 'TZ', region: '아프리카' },
  { name: '케냐', code: 'KE', region: '아프리카' },
  { name: '우간다', code: 'UG', region: '아프리카' },
  { name: '르완다', code: 'RW', region: '아프리카' },
  { name: '모잠비크', code: 'MZ', region: '아프리카' },
  { name: '가나', code: 'GH', region: '아프리카' },
  { name: '세네갈', code: 'SN', region: '아프리카' },
  { name: '나이지리아', code: 'NG', region: '아프리카' },
  { name: '말리', code: 'ML', region: '아프리카' },
  { name: '카메룬', code: 'CM', region: '아프리카' },
  { name: '차드', code: 'TD', region: '아프리카' },
  { name: '말라위', code: 'MW', region: '아프리카' },
  { name: '잠비아', code: 'ZM', region: '아프리카' },
  { name: '남수단', code: 'SS', region: '아프리카' },
  { name: '소말리아', code: 'SO', region: '아프리카' },
  // 중남미
  { name: '볼리비아', code: 'BO', region: '중남미' },
  { name: '콜롬비아', code: 'CO', region: '중남미' },
  { name: '에콰도르', code: 'EC', region: '중남미' },
  { name: '엘살바도르', code: 'SV', region: '중남미' },
  { name: '과테말라', code: 'GT', region: '중남미' },
  { name: '온두라스', code: 'HN', region: '중남미' },
  { name: '니카라과', code: 'NI', region: '중남미' },
  { name: '페루', code: 'PE', region: '중남미' },
  { name: '파라과이', code: 'PY', region: '중남미' },
  { name: '아이티', code: 'HT', region: '중남미' },
  // 중동
  { name: '이집트', code: 'EG', region: '중동' },
  { name: '요르단', code: 'JO', region: '중동' },
  { name: '예멘', code: 'YE', region: '중동' },
  { name: '시리아', code: 'SY', region: '중동' },
  { name: '이라크', code: 'IQ', region: '중동' },
  { name: '레바논', code: 'LB', region: '중동' },
  { name: '팔레스타인', code: 'PS', region: '중동' },
  // CIS
  { name: '우즈베키스탄', code: 'UZ', region: 'CIS' },
  { name: '키르기스스탄', code: 'KG', region: 'CIS' },
  { name: '타지키스탄', code: 'TJ', region: 'CIS' },
  { name: '아제르바이잔', code: 'AZ', region: 'CIS' },
  // 오세아니아
  { name: '피지', code: 'FJ', region: '오세아니아' },
  { name: '파푸아뉴기니', code: 'PG', region: '오세아니아' },
  { name: '솔로몬제도', code: 'SB', region: '오세아니아' },
  { name: '바누아투', code: 'VU', region: '오세아니아' },
  { name: '사모아', code: 'WS', region: '오세아니아' },
];

const REGIONS: Region[] = ['전체', '아시아', '아프리카', '중남미', '중동', 'CIS', '오세아니아'];

const IDEA_EXAMPLES = [
  {
    label: '교육 / 캄보디아',
    text: '캄보디아 농촌 지역 아동의 교육 기회 불평등 문제를 해결하기 위해 교사 역량 강화 프로그램과 학교 인프라 개선을 통한 초등교육 접근성 향상 사업을 추진하고자 합니다. 특히 여아의 취학률 제고와 학습 지속률 향상을 핵심 목표로 설정하고 있습니다.',
  },
  {
    label: '지역개발 / 에티오피아',
    text: '에티오피아 남부 농촌 지역의 만성적 식량 불안 문제를 해결하기 위해 기후 적응형 농업 기술 보급, 농민 역량 강화, 시장 접근성 향상을 통한 소농 가구의 식량 안보 및 소득 증대 사업을 추진하고자 합니다. 지역사회 주도의 지속가능한 농업 생태계 구축을 목표로 합니다.',
  },
  {
    label: '인도적지원 / 미얀마',
    text: '미얀마 분쟁 영향 지역 내 국내 실향민(IDP)의 긴급 인도적 수요를 충족하기 위해 식량, 식수·위생, 보건 서비스를 통합 제공하고, 중장기적으로는 지역사회 회복력 강화를 위한 생계 지원 및 심리사회적 지원(PSS) 프로그램을 연계 운영하고자 합니다.',
  },
];

const QUICK_PROMPTS = ['핵심 문제 분석해줘', '현지 파트너 관점 점검', '비슷한 사례 예시', '보완할 부분은?'];

/* ─── 숫자 포맷 ─────────────────────────────────────────── */
function formatNumber(val: string): string {
  const digits = val.replace(/[^0-9]/g, '');
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/* ─── 국가 모달 ─────────────────────────────────────────── */
function CountryModal({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<Region>('전체');
  const [directMode, setDirectMode] = useState(false);
  const [directInput, setDirectInput] = useState('');

  useEffect(() => { if (!open) { setQuery(''); setRegion('전체'); setDirectMode(false); setDirectInput(''); } }, [open]);

  function handleDirectConfirm() {
    const trimmed = directInput.trim();
    if (trimmed) { onChange(trimmed); setOpen(false); }
  }

  const filtered = COUNTRIES.filter((c) => {
    const matchRegion = region === '전체' || c.region === region;
    const matchQuery = !query || c.name.includes(query) || c.code.toLowerCase().includes(query.toLowerCase());
    return matchRegion && matchQuery;
  });

  const selected = COUNTRIES.find((c) => c.name === value);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-left flex items-center justify-between bg-white hover:border-[#8AA81E] transition-colors focus:outline-none focus:ring-2 focus:ring-[#8AA81E]"
      >
        {selected ? (
          <span className="flex items-center gap-2 text-gray-800">
            <span className="font-mono text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{selected.code}</span>
            {selected.name}
          </span>
        ) : (
          <span className="text-gray-400">대상 국가 선택</span>
        )}
        <MapPin size={14} className="text-gray-400" />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">대상 국가 선택</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="px-5 pt-4">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-[#8AA81E] focus-within:ring-2 focus-within:ring-[#8AA81E]/20 transition-all">
                <Search size={14} className="text-gray-400 flex-shrink-0" />
                <input autoFocus type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="국가명 검색..." className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400" />
                {query && <button type="button" onClick={() => setQuery('')}><X size={12} className="text-gray-400" /></button>}
              </div>
            </div>
            <div className="px-5 pt-3 pb-2 flex gap-1.5 flex-wrap">
              {REGIONS.map((r) => (
                <button key={r} type="button" onClick={() => setRegion(r)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${region === r ? 'bg-[#8AA81E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-[#EEF5D6] hover:text-[#5a7012]'}`}>
                  {r}
                </button>
              ))}
            </div>
            {directMode ? (
              <div className="px-5 pb-5">
                <p className="text-xs text-gray-500 mb-2">목록에 없는 국가명을 직접 입력해주세요.</p>
                <input
                  autoFocus
                  type="text"
                  value={directInput}
                  onChange={(e) => setDirectInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDirectConfirm()}
                  placeholder="예: 시에라리온, 모리타니아"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8AA81E] mb-3"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={handleDirectConfirm}
                    className="px-4 py-2 bg-[#8AA81E] text-white text-sm rounded-lg hover:bg-[#799516] transition-colors">
                    확인
                  </button>
                  <button type="button" onClick={() => setDirectMode(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition-colors">
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-5 pb-5 overflow-y-auto" style={{ maxHeight: 300 }}>
                {filtered.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-400">검색 결과가 없습니다.</div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {filtered.map((c) => (
                      <button key={c.code} type="button"
                        onClick={() => { onChange(c.name); setOpen(false); }}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm border transition-colors text-left ${value === c.name ? 'bg-[#EEF5D6] border-[#8AA81E] text-[#5a7012]' : 'bg-white border-gray-100 text-gray-700 hover:bg-[#F7F8F2] hover:border-[#D9E6B7]'}`}>
                        <span className="font-mono text-xs font-bold text-gray-400 w-6 flex-shrink-0">{c.code}</span>
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {/* 직접 입력 */}
                <button type="button" onClick={() => setDirectMode(true)}
                  className="mt-3 w-full flex items-center gap-2 px-3 py-3 rounded-xl border border-dashed border-gray-200 text-gray-400 hover:border-[#8AA81E] hover:text-[#5a7012] hover:bg-[#F7F8F2] transition-colors text-sm">
                  <Pencil size={13} />
                  <div className="text-left">
                    <p className="font-medium text-xs">직접 입력</p>
                    <p className="text-[11px] opacity-70">목록에 없는 국가를 입력합니다</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ─── AI 작성 도우미 ─────────────────────────────────────── */
interface ChatMsg { role: 'user' | 'assistant'; content: string }

const WELCOME_MSG: ChatMsg = {
  role: 'assistant',
  content: '아이디어 구체화 단계를 도와드릴게요!\n\n질문하거나 도움을 요청하시면 분석해드립니다.',
};

function AiAssistant({ formContext }: { formContext: string }) {
  const [messages, setMessages] = useState<ChatMsg[]>([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const contextMsg = formContext ? `[현재 작성 중인 사업 정보]\n${formContext}\n\n질문: ${trimmed}` : trimmed;
    const userMsg: ChatMsg = { role: 'user', content: trimmed };
    const history = [...messages, userMsg];
    setMessages([...history, { role: 'assistant', content: '' }]);
    setInput('');
    setStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch('/api/gni-an/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...history.slice(0, -1).map((m) => ({ role: m.role, content: m.content })), { role: 'user', content: contextMsg }] }),
        signal: ctrl.signal,
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const snap = acc;
        setMessages((prev) => { const next = [...prev]; next[next.length - 1] = { role: 'assistant', content: snap }; return next; });
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setMessages((prev) => { const next = [...prev]; next[next.length - 1] = { role: 'assistant', content: '오류가 발생했습니다.' }; return next; });
      }
    } finally { setStreaming(false); abortRef.current = null; }
  }, [messages, streaming, formContext]);

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-[#D9E6B7] flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-[#EEF5D6] flex items-center justify-center flex-shrink-0">
          <Sparkles size={15} className="text-[#8AA81E]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#111827]">AI 작성 도우미</p>
          <p className="text-[11px] text-gray-400">아이디어 구체화</p>
        </div>
      </div>

      {/* 메시지 */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ minHeight: 0 }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${msg.role === 'user' ? 'bg-[#8AA81E]' : 'bg-[#EEF5D6]'}`}>
              {msg.role === 'user' ? <User size={11} className="text-white" /> : <Bot size={11} className="text-[#8AA81E]" />}
            </div>
            <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs ${msg.role === 'user' ? 'bg-[#8AA81E] text-white rounded-tr-sm' : 'bg-gray-50 border border-gray-100 text-gray-700 rounded-tl-sm'}`}>
              {msg.role === 'assistant'
                ? <MarkdownText content={msg.content} />
                : <span className="whitespace-pre-wrap">{msg.content}</span>
              }
              {msg.role === 'assistant' && streaming && i === messages.length - 1 && (
                <span className="inline-block w-1 h-3 ml-0.5 bg-[#8AA81E] animate-pulse rounded-sm align-text-bottom" />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 빠른 프롬프트 */}
      {messages.length <= 1 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((q) => (
            <button key={q} onClick={() => send(q)}
              className="text-[11px] px-2.5 py-1 rounded-full border border-[#D9E6B7] bg-[#F7F8F2] text-[#5a7012] hover:bg-[#EEF5D6] hover:border-[#8AA81E] transition-colors">
              {q}
            </button>
          ))}
        </div>
      )}

      {/* 입력창 */}
      <div className="px-3 py-2.5 border-t border-[#D9E6B7] flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
          placeholder="질문하거나 도움을 요청하세요..."
          rows={1}
          disabled={streaming}
          className="flex-1 resize-none text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8AA81E] focus:border-transparent disabled:opacity-50 max-h-20 overflow-y-auto"
          onInput={(e) => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 80) + 'px'; }}
        />
        <button onClick={() => send(input)} disabled={!input.trim() || streaming}
          className="flex-shrink-0 w-7 h-7 rounded-full bg-[#8AA81E] hover:bg-[#799516] disabled:opacity-40 flex items-center justify-center transition-colors">
          {streaming ? <Loader2 size={12} className="text-white animate-spin" /> : <Send size={12} className="text-white" />}
        </button>
      </div>
    </div>
  );
}

/* ─── 메인 페이지 ────────────────────────────────────────── */
export default function IdeationPage() {
  const router = useRouter();
  const { setIdeation, setIdeationAnalysis, setExperts, ideation } = useProjectStore();

  const saved = ideation;
  const [form, setForm] = useState<IdeationData>({
    field: saved?.field ?? '',
    country: saved?.country ?? '',
    subRegion: saved?.subRegion ?? '',
    idea: saved?.idea ?? '',
    beneficiaries: saved?.beneficiaries ?? '',
    budget: saved?.budget ?? '',
    duration: saved?.duration ?? '',
  });
  const [budgetDisplay, setBudgetDisplay] = useState(saved?.budget ?? '');
  const [exampleOpen, setExampleOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = form.field && form.country && form.idea.length >= 50;

  const formContext = [
    form.field && `분야: ${form.field}`,
    form.country && `국가: ${form.country}`,
    form.subRegion && `지역: ${form.subRegion}`,
    form.idea && `아이디어: ${form.idea}`,
    form.beneficiaries && `수혜자: ${form.beneficiaries}`,
    form.budget && `사업비: ${form.budget}`,
    form.duration && `기간: ${form.duration}`,
  ].filter(Boolean).join('\n');

  function handleBudgetChange(val: string) {
    const formatted = formatNumber(val);
    setBudgetDisplay(formatted);
    setForm({ ...form, budget: formatted });
  }

  async function handleSubmit() {
    if (!isValid) return;
    setLoading(true);
    setError('');
    try {
      setIdeation(form);
      const [analyzeRes, expertsRes] = await Promise.all([
        fetch('/api/gni-an/ideation/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }),
        fetch('/api/gni-an/consulting/experts/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ field: form.field, country: form.country }) }),
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
    <div className="h-screen flex flex-col bg-[#F7F8F2] overflow-hidden">
      <StepHeader />

      {/* 콘텐츠 영역 — 남은 높이 전부 사용 */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── 좌측: 스크롤 가능한 폼 영역 ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 pb-0">
            <h1 className="text-2xl font-bold text-[#111827] mb-1">사업 아이디어 입력</h1>
            <p className="text-gray-500 text-sm mb-5">기본 정보를 입력하면 AI가 분석하고 전문가 컨설팅을 준비합니다</p>
          </div>

          <div className="px-6 pb-6">
          <div className="bg-white border border-[#D9E6B7] p-6 space-y-5">

            {/* 사업 분야 + 대상 국가 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  사업 분야 <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {FIELDS.map((f) => (
                    <button key={f} type="button" onClick={() => setForm({ ...form, field: f })}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${form.field === f ? 'bg-[#8AA81E] border-[#8AA81E] text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-[#8AA81E] hover:text-[#8AA81E]'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  대상 국가 <span className="text-red-500">*</span>
                </label>
                <CountryModal value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
              </div>
            </div>

            {/* 세부 지역 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center justify-between">
                <span>세부 지역 <span className="text-gray-400 font-normal text-xs">(직접 입력)</span></span>
                <span className="text-xs text-gray-400">{(form.subRegion || '').length}/50자</span>
              </label>
              <input type="text" value={form.subRegion} onChange={(e) => setForm({ ...form, subRegion: e.target.value })} maxLength={50}
                placeholder="예: 하노이 인근 농촌지역"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8AA81E] focus:border-transparent" />
            </div>

            {/* 사업 아이디어 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center justify-between">
                <span>사업 아이디어 <span className="text-red-500">*</span></span>
                <span className={`text-xs ${form.idea.length >= 50 ? 'text-[#8AA81E]' : 'text-orange-400'}`}>{form.idea.length}/50자</span>
              </label>

              {/* 작성 예시 토글 */}
              <div className="mb-2">
                <button type="button" onClick={() => setExampleOpen((v) => !v)}
                  className="flex items-center gap-1.5 text-xs text-[#8AA81E] hover:text-[#799516] font-medium transition-colors">
                  <span className="text-[10px]">{exampleOpen ? '▼' : '▶'}</span>
                  <span>💡 작성 예시 보기</span>
                </button>

                {exampleOpen && (
                  <div className="mt-2 space-y-2">
                    {IDEA_EXAMPLES.map((ex) => (
                      <div key={ex.label} className="bg-[#F7F8F2] border border-[#D9E6B7] rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-semibold text-[#8AA81E] mb-1 block">{ex.label}</span>
                            <p className="text-xs text-gray-600 leading-relaxed">{ex.text}</p>
                          </div>
                          <button type="button" onClick={() => { setForm({ ...form, idea: ex.text }); setExampleOpen(false); }}
                            className="flex-shrink-0 text-[11px] text-[#8AA81E] border border-[#D9E6B7] hover:border-[#8AA81E] hover:bg-[#EEF5D6] rounded px-2 py-0.5 transition-colors whitespace-nowrap">
                            적용
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <textarea value={form.idea} onChange={(e) => setForm({ ...form, idea: e.target.value })} rows={4}
                placeholder="어떤 문제를 해결하고, 어떤 활동을 하고 싶은지 자유롭게 작성해주세요. (최소 50자)"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8AA81E] focus:border-transparent resize-none" />
            </div>

            {/* 하단 3개 입력 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  주요 수혜자 <span className="text-gray-400 font-normal">(직접 입력)</span>
                </label>
                <input type="text" value={form.beneficiaries} onChange={(e) => setForm({ ...form, beneficiaries: e.target.value })}
                  placeholder="예: 임산부, 영유아"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8AA81E] focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  총사업비 <span className="text-gray-400 font-normal">(직접 입력)</span>
                </label>
                <div className="relative">
                  <input type="text" value={budgetDisplay} onChange={(e) => handleBudgetChange(e.target.value)}
                    placeholder="3,000,000"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8AA81E] focus:border-transparent pr-10" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">천원</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  예상 기간 <span className="text-gray-400 font-normal">(직접 입력)</span>
                </label>
                <div className="relative">
                  <input type="text" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="24"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8AA81E] focus:border-transparent pr-10" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">개월</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {!isValid && (
              <p className="text-center text-xs text-gray-400">분야, 국가를 선택하고 아이디어를 50자 이상 작성해주세요</p>
            )}
          </div>
          </div>{/* /px-6 */}
        </div>{/* /좌측 스크롤 영역 */}

        {/* ── 우측: AI 작성 도우미 (고정) ── */}
        <div className="w-[300px] flex-shrink-0 border-l border-[#D9E6B7] flex flex-col bg-white">
          <AiAssistant formContext={formContext} />
        </div>

      </div>{/* /콘텐츠 */}

      {/* ── 하단 고정 버튼 ── */}
      <div className="border-t border-[#D9E6B7] bg-white px-6 py-3 flex-shrink-0">
        <Button onClick={handleSubmit} disabled={!isValid} loading={loading} size="lg" className="w-full">
          {loading ? 'AI 분석 중...' : (
            <span className="flex items-center justify-center gap-2">
              <Sparkles size={16} /> AI 분석 시작 →
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
