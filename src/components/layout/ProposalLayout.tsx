'use client';
import { useState, useEffect, useRef, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Sparkles, Save, Eye, FileDown, Menu, X, ChevronRight, ChevronLeft, ChevronDown, MessageSquare, Send, Settings, Paperclip, Check, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { useProjectStore } from '@/lib/store/projectStore';
import { PROPOSAL_SECTIONS } from '@/types';
import type { SectionId } from '@/types';
import { MarkdownText } from '@/components/ui/MarkdownText';
import { FindReplaceModal } from '@/components/proposal/FindReplaceModal';

const STATUS_ICONS = {
  empty: '○',
  'in-progress': '!',
  completed: '✓',
};
const STATUS_COLORS = {
  empty: 'text-gray-300',
  'in-progress': 'text-orange-400',
  completed: 'text-[#8AA81E]',
};

const SECTION_GROUPS: { id: string; title: string; subtitle: string; sectionIds: SectionId[]; labels?: string[] }[] = [
  {
    id: 'basis',
    title: 'I-1. 사업 근거',
    subtitle: '배경, 수요, 문제/목표 분석',
    sectionIds: ['basis-background', 'basis-demand', 'basis-stakeholder', 'basis-problem', 'basis-objective', 'basis-self-assessment'],
    labels: ['가', '나', '다', '라', '마', '바'],
  },
  {
    id: 'plan',
    title: 'I-2. 사업추진계획',
    subtitle: 'PDM, 추진방안, 지속가능성 전략 등',
    sectionIds: ['plan-pdm', 'plan-detail', 'plan-sustainability', 'plan-crosscutting'],
    labels: ['가', '나', '다', '라'],
  },
  {
    id: 'operation',
    title: 'II. 사업운영',
    subtitle: '조직, 예산, 회계',
    sectionIds: ['operation-organization', 'operation-budget', 'operation-accounting'],
  },
  {
    id: 'monitoring',
    title: 'III. 모니터링 및 평가',
    subtitle: 'M&E, 위험관리, 일정',
    sectionIds: ['monitoring-plan', 'monitoring-endline', 'monitoring-risk', 'monitoring-schedule'],
  },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { sections, getCompletedSectionsCount, getQualityLabel } = useProjectStore();
  const completed = getCompletedSectionsCount();
  const quality = getQualityLabel();
  const progress = Math.round((completed / 17) * 100);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ basis: true, plan: true, operation: false, monitoring: false });

  useEffect(() => {
    const activeGroup = SECTION_GROUPS.find((g) => g.sectionIds.some((id) => PROPOSAL_SECTIONS.find((s) => s.id === id)?.path === pathname));
    if (activeGroup) {
      setOpenGroups((prev) => (prev[activeGroup.id] ? prev : { ...prev, [activeGroup.id]: true }));
    }
  }, [pathname]);

  const qualityColors: Record<string, string> = {
    '완료': 'text-[#8AA81E]',
    '양호': 'text-blue-500',
    '보통': 'text-yellow-500',
    '미흡': 'text-orange-400',
    '매우 미흡': 'text-red-400',
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-[#D9E6B7]">
      {/* Logo */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <Link href="/gni-an" className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-md bg-[#8AA81E] flex items-center justify-center">
            <Sparkles size={12} className="text-white" />
          </div>
          <span className="text-sm font-bold text-[#111827]">GNI-AN</span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 lg:hidden"><X size={18} /></button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {SECTION_GROUPS.map((group) => {
          const groupSections = group.sectionIds.map((id) => PROPOSAL_SECTIONS.find((s) => s.id === id)!);
          const groupCompleted = groupSections.filter((s) => sections[s.id]?.status === 'completed').length;
          const groupProgress = Math.round((groupCompleted / groupSections.length) * 100);
          const isOpen = openGroups[group.id];

          return (
            <div key={group.id}>
              <button
                onClick={() => setOpenGroups((prev) => ({ ...prev, [group.id]: !prev[group.id] }))}
                className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[#F7F8F2] transition-colors text-left"
              >
                <ChevronDown size={13} className={clsx('flex-shrink-0 text-gray-400 transition-transform', !isOpen && '-rotate-90')} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#111827] truncate">{group.title}</span>
                    <span className="text-[10px] font-bold text-[#8AA81E] flex-shrink-0">{groupCompleted}/{groupSections.length}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 truncate">{group.subtitle}</p>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-[#8AA81E] rounded-full transition-all duration-500" style={{ width: `${groupProgress}%` }} />
                  </div>
                </div>
              </button>

              {isOpen && groupSections.map((section, i) => {
                const sectionData = sections[section.id];
                const status = sectionData?.status || 'empty';
                const active = pathname === section.path;
                const label = group.labels?.[i] ?? section.code;

                return (
                  <Link
                    key={section.id}
                    href={section.path}
                    onClick={onClose}
                    className={clsx(
                      'flex items-center gap-2 pl-9 pr-4 py-2 text-xs transition-colors hover:bg-[#F7F8F2]',
                      active ? 'bg-[#EEF5D6] text-[#5a7012] font-medium' : 'text-gray-600'
                    )}
                  >
                    <span className={clsx('text-base leading-none w-4 flex-shrink-0 text-center', STATUS_COLORS[status])}>
                      {STATUS_ICONS[status]}
                    </span>
                    <span className="text-gray-400 flex-shrink-0">{label}.</span>
                    <span className="truncate">{section.title}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Progress */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">진행률</span>
          <span className="text-xs font-bold text-[#8AA81E]">{completed}/17</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-[#8AA81E] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
          <span className="text-xs text-gray-500">품질 상태</span>
          <span className={clsx('text-xs font-semibold', qualityColors[quality])}>{quality}</span>
        </div>
      </div>
    </div>
  );
}

function AiAssistant({ sectionId, sectionTitle }: { sectionId: string; sectionTitle: string }) {
  const { sections, ideation, project, structure, setStructure, updateSection, updateSectionAiDraft } = useProjectStore();
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; image?: string; updated?: boolean }[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const currentContent = sections[sectionId]?.content || '';
  const isPdmPage = sectionId === 'plan-pdm';

  function handleImageSelect(file: File) {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 첨부할 수 있습니다.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 파일은 5MB 이하만 첨부할 수 있습니다.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAttachedImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          handleImageSelect(file);
        }
        break;
      }
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'));
    if (file) handleImageSelect(file);
  }

  const quickQuestions: Record<string, string[]> = {
    'basis-background': ['배경 분석 충분해?', 'SDGs/CPS 연계 명확해?', '부족한 부분은?', '예시 보여줘'],
    'basis-demand': ['수요 조사 충분해?', '기초선 데이터 있어?', '지역 선정 근거 명확해?', '개선점은?'],
    'basis-problem': ['문제나무 논리적이야?', '핵심 문제 명확해?', '원인 분석 충분해?', '개선점은?'],
    'basis-objective': ['목표 체계 적절해?', 'SMART 충족해?', '변화이론 있어?', '예시 보여줘'],
    'plan-pdm': ['활동 2개 추가해줘', 'Output 1개 추가해줘', 'PDM 논리 연결 확인해줘', '지표가 SMART해?'],
    'monitoring-risk': ['위험 식별 충분해?', '대응 방안 구체적이야?', '비상 연락 체계 있어?', '개선점은?'],
  };
  const questions = quickQuestions[sectionId] || ['검토해줘', '개선점은?', '예시 보여줘', '더 구체적으로'];

  async function sendPdmMessage(question: string) {
    const userMsg = { role: 'user' as const, content: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setStreaming(true);

    const assistantPlaceholder = { role: 'assistant' as const, content: '' };
    setMessages((prev) => [...prev, assistantPlaceholder]);

    try {
      const res = await fetch('/api/gni-an/proposal/pdm-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdm: structure?.pdm || [],
          message: question,
          projectContext: { field: ideation?.field, country: ideation?.country, title: project?.title },
        }),
      });
      const data = await res.json();

      if (data.success && Array.isArray(data.updatedPdm) && structure) {
        setStructure({ ...structure, pdm: data.updatedPdm });
        updateSection('plan-pdm', JSON.stringify(data.updatedPdm), 'in-progress');
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: 'assistant' as const, content: data.reply || '수정했습니다.', updated: true },
        ]);
      } else {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: 'assistant' as const, content: data.reply || data.error || '처리 중 문제가 발생했습니다.' },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant' as const, content: '오류가 발생했습니다.' },
      ]);
    } finally {
      setStreaming(false);
    }
  }

  async function sendMessage(text?: string) {
    const question = text || input.trim();
    if (!question || streaming) return;

    if (isPdmPage) {
      await sendPdmMessage(question);
      return;
    }

    const imageToSend = attachedImage;

    const userMsg = { role: 'user' as const, content: question, image: imageToSend || undefined };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setAttachedImage(null);
    setStreaming(true);

    const assistantPlaceholder = { role: 'assistant' as const, content: '' };
    setMessages((prev) => [...prev, assistantPlaceholder]);

    try {
      const res = await fetch('/api/gni-an/proposal/section/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionTitle,
          content: currentContent,
          message: question,
          projectContext: { field: ideation?.field, country: ideation?.country, title: project?.title },
          imageDataUrl: imageToSend || undefined,
        }),
      });
      const data = await res.json();

      if (data.success && typeof data.updatedHtml === 'string') {
        updateSection(sectionId, data.updatedHtml, 'in-progress');
        updateSectionAiDraft(sectionId, data.updatedHtml);
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: 'assistant' as const, content: data.reply || '수정했습니다.', updated: true },
        ]);
      } else {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: 'assistant' as const, content: data.reply || data.error || '처리 중 문제가 발생했습니다.' },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant' as const, content: '오류가 발생했습니다.' },
      ]);
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div
      className="relative flex flex-col h-full bg-white border-l border-[#D9E6B7]"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {dragOver && (
        <div className="absolute inset-0 z-20 bg-[#EEF5D6]/90 border-2 border-dashed border-[#8AA81E] flex items-center justify-center pointer-events-none">
          <p className="text-sm font-medium text-[#5a7012]">이미지를 여기에 놓으세요</p>
        </div>
      )}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#8AA81E] flex items-center justify-center">
            <MessageSquare size={12} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-[#111827]">AI 작성 도우미</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">{sectionTitle} 섹션을 도와드립니다.</p>
      </div>

      {/* Quick questions */}
      <div className="px-3 pt-3 pb-2 border-b border-gray-50 flex flex-wrap gap-1.5">
        {questions.map((q) => (
          <button
            key={q}
            onClick={() => sendMessage(q)}
            disabled={streaming}
            className="text-xs bg-[#EEF5D6] text-[#5a7012] border border-[#D9E6B7] rounded-full px-2 py-1 hover:bg-[#D9E6B7] transition-colors disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">위 빠른 질문을 클릭하거나<br />자유롭게 질문해주세요.</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={clsx('text-xs rounded-xl px-3 py-2 leading-relaxed', msg.role === 'user' ? 'bg-[#8AA81E] text-white ml-4' : 'bg-gray-100 text-gray-700 mr-4')}>
            {msg.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={msg.image} alt="첨부 이미지" className="rounded-lg mb-1.5 max-h-32 object-cover" />
            )}
            {msg.updated && (
              <div className="flex items-center gap-1 text-[#8AA81E] font-semibold mb-1">
                <Check size={11} /> {isPdmPage ? 'PDM이' : '본문이'} 직접 수정되었습니다
              </div>
            )}
            {msg.content ? (
              msg.role === 'assistant' ? (
                <MarkdownText content={msg.content} className="text-xs" />
              ) : (
                <span className="whitespace-pre-wrap">{msg.content}</span>
              )
            ) : (
              streaming && msg.role === 'assistant' ? '...' : ''
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100">
        {attachedImage && (
          <div className="relative inline-block mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={attachedImage} alt="첨부 미리보기" className="h-14 rounded-lg border border-gray-200 object-cover" />
            <button
              onClick={() => setAttachedImage(null)}
              className="absolute -top-1.5 -right-1.5 bg-white border border-gray-200 rounded-full p-0.5 text-gray-400 hover:text-red-400"
            >
              <X size={10} />
            </button>
          </div>
        )}
        <div className="flex gap-1.5">
          <button
            onClick={() => imageInputRef.current?.click()}
            disabled={streaming}
            title="이미지 첨부"
            className="flex-shrink-0 border border-gray-200 rounded-lg p-1.5 text-gray-400 hover:text-[#8AA81E] hover:border-[#8AA81E] transition-colors disabled:opacity-40"
          >
            <Paperclip size={13} />
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); e.target.value = ''; }}
          />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            onPaste={handlePaste}
            placeholder={isPdmPage ? '예: 활동 2개 추가해줘' : '예: 두 번째 문단에 수치 추가해줘'}
            disabled={streaming}
            className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#8AA81E] disabled:bg-gray-50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || streaming}
            className="bg-[#8AA81E] hover:bg-[#799516] text-white rounded-lg p-1.5 disabled:opacity-40 transition-colors"
          >
            <Send size={12} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          {isPdmPage
            ? '"활동 추가해줘", "Outcome 2 지표 수정해줘"처럼 요청하면 PDM이 바로 수정됩니다.'
            : '"이렇게 바꿔줘", "수치 추가해줘"처럼 요청하면 본문이 바로 수정됩니다. 이미지는 Ctrl+V로 붙여넣거나 드래그해서 첨부할 수 있습니다.'}
        </p>
      </div>
    </div>
  );
}

interface ProposalLayoutProps {
  children: ReactNode;
  sectionId: SectionId;
  sectionTitle: string;
}

export function ProposalLayout({ children, sectionId, sectionTitle }: ProposalLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [findReplaceOpen, setFindReplaceOpen] = useState(false);
  const { sections, project } = useProjectStore();
  const sectionData = sections[sectionId];
  const router = useRouter();
  const pathname = usePathname();

  const sectionIndex = PROPOSAL_SECTIONS.findIndex((s) => s.id === sectionId);
  const prevSection = sectionIndex > 0 ? PROPOSAL_SECTIONS[sectionIndex - 1] : null;
  const nextSection = sectionIndex >= 0 && sectionIndex < PROPOSAL_SECTIONS.length - 1 ? PROPOSAL_SECTIONS[sectionIndex + 1] : null;

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <header className="h-12 border-b border-[#D9E6B7] bg-white flex items-center px-4 gap-3 flex-shrink-0">
        <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-gray-600">
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-gray-400 truncate max-w-32">{project?.title || '제안서'}</span>
          <ChevronRight size={12} className="text-gray-300" />
          <span className="font-medium text-[#111827] truncate">{sectionTitle}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={clsx(
            'text-xs',
            sectionData?.status === 'completed' ? 'text-[#8AA81E]' : sectionData?.status === 'in-progress' ? 'text-orange-400' : 'text-gray-400'
          )}>
            {sectionData?.status === 'completed' ? '완료' : sectionData?.status === 'in-progress' ? '작성중' : '미작성'}
          </span>
          <button
            onClick={() => router.push(`/gni-an/create?returnTo=${encodeURIComponent(pathname)}`)}
            title="프로젝트 정보 수정 (사업기간, 예산 등)"
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#8AA81E] border border-gray-200 hover:border-[#8AA81E] rounded-lg px-2.5 py-1.5 transition-colors"
          >
            <Settings size={13} />프로젝트 정보 수정
          </button>
          <button
            onClick={() => setFindReplaceOpen(true)}
            title="제안서 전체에서 단어 한 번에 바꾸기"
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#8AA81E] border border-gray-200 hover:border-[#8AA81E] rounded-lg px-2.5 py-1.5 transition-colors"
          >
            <Search size={13} />찾아바꾸기
          </button>
          <button
            onClick={() => prevSection && router.push(prevSection.path)}
            disabled={!prevSection}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#8AA81E] border border-gray-200 hover:border-[#8AA81E] rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={13} />이전
          </button>
          <button
            onClick={() => nextSection && router.push(nextSection.path)}
            disabled={!nextSection}
            title="점검용 건너뛰기"
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#8AA81E] border border-gray-200 hover:border-[#8AA81E] rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            건너뛰기<ChevronRight size={13} />
          </button>
          <button
            onClick={() => router.push('/gni-an/proposal/pdf-preview')}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#8AA81E] border border-gray-200 hover:border-[#8AA81E] rounded-lg px-2.5 py-1.5 transition-colors"
          >
            <Eye size={13} />미리보기
          </button>
          <button className="flex items-center gap-1.5 text-xs bg-[#8AA81E] hover:bg-[#799516] text-white rounded-lg px-2.5 py-1.5 transition-colors">
            <FileDown size={13} />PDF 저장
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-64 h-full">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar desktop */}
        <div className="hidden lg:block w-60 flex-shrink-0 overflow-y-auto">
          <Sidebar />
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* AI assistant */}
        <div className="hidden xl:flex w-80 flex-shrink-0 flex-col overflow-hidden">
          <AiAssistant sectionId={sectionId} sectionTitle={sectionTitle} />
        </div>
      </div>

      {findReplaceOpen && <FindReplaceModal onClose={() => setFindReplaceOpen(false)} />}
    </div>
  );
}
