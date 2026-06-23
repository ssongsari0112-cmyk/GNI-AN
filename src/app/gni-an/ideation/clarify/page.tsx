'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StepHeader } from '@/components/layout/StepHeader';
import { Button } from '@/components/ui/Button';
import { useProjectStore } from '@/lib/store/projectStore';
import type { ClarifyMessage } from '@/types';
import { Send, MessageCircleQuestion, Check } from 'lucide-react';
import { clsx } from 'clsx';

const NONE_LABEL = '없습니다';
const ALL_LABEL = '전체 선택합니다';

export default function ClarifyPage() {
  const router = useRouter();
  const {
    ideation, expertSessions,
    clarifyMessages, setClarifyMessages,
    clarifyConfirmed, setClarifyConfirmed,
  } = useProjectStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [input, setInput] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const startedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [clarifyMessages, loading]);

  useEffect(() => {
    if (startedRef.current || clarifyMessages.length > 0 || !ideation) return;
    startedRef.current = true;
    requestNext([]);
  }, [ideation, clarifyMessages.length]);

  function buildConsultingHistory(): string {
    return expertSessions
      .filter((s) => s.completed)
      .map((s) => `[${s.expertId} 전문가] ${s.messages.slice(-3).map((m) => m.content).join(' / ')}`)
      .join('\n');
  }

  async function requestNext(history: ClarifyMessage[]) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/gni-an/clarify/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaContext: ideation,
          consultingHistory: buildConsultingHistory(),
          messages: history,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setClarifyMessages([...history, data.message as ClarifyMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '대화 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function toggleOption(opt: string) {
    if (opt === NONE_LABEL) {
      setSelected([NONE_LABEL]);
      return;
    }
    setSelected((prev) => {
      const withoutNone = prev.filter((p) => p !== NONE_LABEL);
      return withoutNone.includes(opt) ? withoutNone.filter((p) => p !== opt) : [...withoutNone, opt];
    });
  }

  function selectAll(options: string[]) {
    setSelected(options);
  }

  function handleSend() {
    const parts = [...selected];
    if (input.trim()) parts.push(input.trim());
    const content = parts.join(', ');
    if (!content) return;

    const userMsg: ClarifyMessage = { role: 'user', content };
    const history = [...clarifyMessages, userMsg];
    setClarifyMessages(history);
    setSelected([]);
    setInput('');
    requestNext(history);
  }

  function handleConfirmDone() {
    setClarifyConfirmed(true);
    router.push('/gni-an/ideation/structure');
  }

  function handleContinueTalking() {
    const userMsg: ClarifyMessage = { role: 'user', content: '아니요, 조금 더 이야기하고 싶어요.' };
    const history = [...clarifyMessages, userMsg];
    setClarifyMessages(history);
    requestNext(history);
  }

  const lastMsg = clarifyMessages[clarifyMessages.length - 1];
  const showFinalActions = !loading && lastMsg?.role === 'assistant' && lastMsg.isFinal && !clarifyConfirmed;
  const showOptions = !loading && lastMsg?.role === 'assistant' && !lastMsg.isFinal && (lastMsg.options?.length ?? 0) > 0;

  if (!ideation) {
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

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-[#EEF5D6] flex items-center justify-center">
            <MessageCircleQuestion size={16} className="text-[#8AA81E]" />
          </div>
          <h1 className="text-lg font-bold text-[#111827]">사업 구체화</h1>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          몇 가지 질문에 답해주시면 구조화 단계에 바로 반영됩니다. 편하게 답해주세요.
        </p>

        <div className="flex-1 bg-white border border-[#D9E6B7] rounded-xl flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {clarifyMessages.map((msg, idx) => (
              <div key={idx} className={clsx('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={clsx(
                  'max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap',
                  msg.role === 'user'
                    ? 'bg-[#8AA81E] text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                )}>
                  {msg.content}
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
                <Button size="sm" variant="secondary" onClick={() => requestNext(clarifyMessages)}>다시 시도</Button>
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
                <Check size={14} />네, 이대로 진행할게요
              </Button>
            </div>
          )}

          {showOptions && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {[...(lastMsg!.options || []), NONE_LABEL, ALL_LABEL].map((opt) => (
                <button
                  key={opt}
                  onClick={() => opt === ALL_LABEL ? selectAll(lastMsg!.options || []) : toggleOption(opt)}
                  className={clsx(
                    'text-xs rounded-full px-3 py-1.5 border transition-colors',
                    selected.includes(opt)
                      ? 'bg-[#8AA81E] text-white border-[#8AA81E]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#8AA81E] hover:text-[#8AA81E]'
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {!showFinalActions && (
            <div className="px-4 pb-4 pt-2 border-t border-gray-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="직접 입력하거나 위 선택지를 골라주세요..."
                  disabled={loading}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8AA81E] disabled:bg-gray-50 disabled:text-gray-400"
                />
                <Button onClick={handleSend} disabled={loading || (!input.trim() && selected.length === 0)} size="sm">
                  <Send size={15} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
