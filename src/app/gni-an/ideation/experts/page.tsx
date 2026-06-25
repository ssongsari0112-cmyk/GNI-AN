'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StepHeader } from '@/components/layout/StepHeader';
import { Button } from '@/components/ui/Button';
import { useProjectStore } from '@/lib/store/projectStore';
import type { Expert, ChatMessage } from '@/types';
import { ChevronDown, ChevronUp, Send, CheckCircle2, ArrowRight, Check } from 'lucide-react';
import { MarkdownText } from '@/components/ui/MarkdownText';
import { clsx } from 'clsx';

const NONE_LABEL = '잘 모르겠어요, 추천해주세요';

function ExpertAvatar({ expert, active }: { expert: Expert; active: boolean }) {
  const bgColors: Record<string, string> = {
    field: 'bg-blue-500',
    regional: 'bg-purple-500',
    planning: 'bg-orange-500',
    me: 'bg-teal-500',
  };

  return (
    <div className={clsx(
      'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm transition-all',
      bgColors[expert.type],
      active ? 'ring-2 ring-offset-2 ring-[#8AA81E] scale-110' : '',
      expert.status === 'completed' ? 'opacity-70' : ''
    )}>
      {expert.status === 'completed' ? <Check size={18} /> : expert.avatar}
    </div>
  );
}

export default function ExpertsPage() {
  const router = useRouter();
  const { experts, expertSessions, ideation, ideationAnalysis, completeExpert, updateExpertSession } = useProjectStore();

  const [activeExpertId, setActiveExpertId] = useState<string>(experts[0]?.id || '');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [guideOpen, setGuideOpen] = useState(false);
  const startedRef = useRef<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeExpert = experts.find((e) => e.id === activeExpertId);
  const session = expertSessions.find((s) => s.expertId === activeExpertId);
  const messages: ChatMessage[] = session?.messages || [];
  const completedCount = experts.filter((e) => e.status === 'completed').length;
  const allCompleted = completedCount === 4 && experts.length === 4;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (experts.length > 0 && !activeExpertId) {
      setActiveExpertId(experts[0].id);
    }
  }, [experts, activeExpertId]);

  // 전문가 탭을 처음 열 때 AI가 첫 질문을 직접 생성
  useEffect(() => {
    if (!activeExpert || activeExpert.status === 'completed') return;
    if (messages.length > 0 || startedRef.current.has(activeExpert.id)) return;
    startedRef.current.add(activeExpert.id);
    requestNext(activeExpert.id, []);
  }, [activeExpert?.id]);

  async function requestNext(expertId: string, history: ChatMessage[]) {
    const expert = experts.find((e) => e.id === expertId);
    if (!expert) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/gni-an/consulting/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expertType: expert.type,
          expertTitle: expert.title,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          ideation,
          analysis: ideationAnalysis,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message.content,
        options: data.message.options || [],
        isFinal: !!data.message.isFinal,
        timestamp: new Date().toISOString(),
      };
      const existingSession = expertSessions.find((s) => s.expertId === expertId);
      updateExpertSession({
        expertId,
        messages: [...history, assistantMsg],
        completed: existingSession?.completed || false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '상담 대화 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function handleSend() {
    if (!activeExpert || loading) return;
    const content = input.trim();
    if (!content) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    const history = [...messages, userMsg];
    updateExpertSession({ expertId: activeExpertId, messages: history, completed: session?.completed || false });
    setInput('');
    requestNext(activeExpertId, history);
  }

  function handleConfirmDone() {
    if (!activeExpert) return;
    completeExpert(activeExpert.id);
    updateExpertSession({ expertId: activeExpert.id, messages, completed: true });
  }

  function handleContinueTalking() {
    if (!activeExpert) return;
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: '아니요, 조금 더 이야기하고 싶어요.',
      timestamp: new Date().toISOString(),
    };
    const history = [...messages, userMsg];
    updateExpertSession({ expertId: activeExpertId, messages: history, completed: session?.completed || false });
    requestNext(activeExpertId, history);
  }

  function handleNext() {
    router.push('/gni-an/ideation/clarify');
  }

  const lastMsg = messages[messages.length - 1];
  const showFinalActions = !loading && lastMsg?.role === 'assistant' && lastMsg.isFinal && activeExpert?.status !== 'completed';
  const showOptions = !loading && lastMsg?.role === 'assistant' && !lastMsg.isFinal && (lastMsg.options?.length ?? 0) > 0;

  function selectOption(opt: string) {
    setInput(opt);
  }

  if (!experts.length) {
    return (
      <div className="min-h-screen bg-[#F7F8F2]">
        <StepHeader />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">이전 단계로 돌아가서 아이디어를 먼저 입력해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#F7F8F2] flex flex-col overflow-hidden">
      <StepHeader />

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 grid grid-cols-[60px_1fr] gap-4 overflow-hidden" style={{ minHeight: 0 }}>
        {/* Expert sidebar */}
        <div className="flex flex-col items-center gap-3 pt-2">
          {experts.map((expert) => (
            <button
              key={expert.id}
              onClick={() => setActiveExpertId(expert.id)}
              title={expert.title}
              className="focus:outline-none"
            >
              <ExpertAvatar expert={expert} active={activeExpertId === expert.id} />
            </button>
          ))}
          <div className="mt-auto mb-2 text-center">
            <div className="text-xs text-gray-400">{completedCount}/4</div>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex flex-col bg-white rounded-2xl border border-[#D9E6B7] overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <div>
              <div className="font-semibold text-[#111827] text-sm">{activeExpert?.title}</div>
              {activeExpert?.status === 'completed' && (
                <div className="flex items-center gap-1 text-xs text-[#8AA81E]">
                  <CheckCircle2 size={12} />상담 완료
                </div>
              )}
            </div>
            {allCompleted && (
              <Button size="sm" onClick={handleNext}>
                다음 단계 <ArrowRight size={14} />
              </Button>
            )}
          </div>

          {/* Guide */}
          <div className="px-5 pt-3 pb-0 border-b border-gray-50">
            <button
              onClick={() => setGuideOpen(!guideOpen)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 pb-2"
            >
              {guideOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              질문 가이드 보기
            </button>
            {guideOpen && (
              <div className="pb-3 space-y-1">
                {activeExpert?.questionGuide.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(q)}
                    className="block w-full text-left text-xs text-gray-500 hover:text-[#8AA81E] hover:bg-[#EEF5D6] rounded px-2 py-1 transition-colors"
                  >
                    • {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={clsx('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={clsx(
                  'max-w-[80%] rounded-2xl px-4 py-3 text-sm',
                  msg.role === 'user'
                    ? 'bg-[#8AA81E] text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                )}>
                  {msg.role === 'assistant'
                    ? <MarkdownText content={msg.content} />
                    : <span>{msg.content}</span>}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2 flex items-center justify-between">
                <span>{error}</span>
                <Button size="sm" variant="secondary" onClick={() => requestNext(activeExpertId, messages)}>다시 시도</Button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {showFinalActions && (
            <div className="px-4 pb-3 flex gap-2 justify-end">
              <Button size="sm" variant="secondary" onClick={handleContinueTalking}>
                다시 이야기하고 싶어요
              </Button>
              <Button size="sm" onClick={handleConfirmDone}>
                <Check size={14} />이 상담 완료할게요
              </Button>
            </div>
          )}

          {showOptions && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {[...(lastMsg!.options || []), NONE_LABEL].map((opt) => (
                <button
                  key={opt}
                  onClick={() => selectOption(opt)}
                  className="text-xs rounded-full px-3 py-1.5 border bg-white text-gray-600 border-gray-200 hover:border-[#8AA81E] hover:text-[#8AA81E] transition-colors"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          {!showFinalActions && (
            <div className="px-4 pb-4 pt-2 border-t border-gray-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder={`${activeExpert?.title}에게 답해보세요...`}
                  disabled={loading || activeExpert?.status === 'completed'}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8AA81E] disabled:bg-gray-50 disabled:text-gray-400"
                />
                <Button onClick={handleSend} disabled={!input.trim() || loading || activeExpert?.status === 'completed'} size="sm">
                  <Send size={15} />
                </Button>
              </div>
            </div>
          )}
          {!allCompleted && (
            <p className="text-xs text-gray-400 pb-3 text-center">
              {experts.filter((e) => e.status !== 'completed').map((e) => e.title.split(' ')[0]).join(', ')} 전문가 상담을 완료해야 다음 단계로 이동할 수 있습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
