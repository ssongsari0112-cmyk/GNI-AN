'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StepHeader } from '@/components/layout/StepHeader';
import { Button } from '@/components/ui/Button';
import { useProjectStore } from '@/lib/store/projectStore';
import type { Expert, ChatMessage, ExpertSession } from '@/types';
import { Check, ChevronDown, ChevronUp, Send, CheckCircle2, ArrowRight } from 'lucide-react';
import { MarkdownText } from '@/components/ui/MarkdownText';
import { clsx } from 'clsx';

const EXPERT_INTROS: Record<string, { years: string; areas: string[]; perspective: string }> = {
  field: {
    years: '15년 이상',
    areas: ['분야별 문제 분석', '이해관계자 전략', '성과 지표 설계', '모범사례 적용'],
    perspective: '분야 전문',
  },
  regional: {
    years: '10년 이상',
    areas: ['현지 정책 및 CPS', '문화·사회적 맥락', '현지 파트너십', '리스크 분석'],
    perspective: '현지 정책',
  },
  planning: {
    years: '20년 이상',
    areas: ['사업 설계 및 ToC', 'PDM 작성', '수혜 대상 설정', '출구 전략'],
    perspective: '사업 설계',
  },
  me: {
    years: '15년 이상',
    areas: ['SMART 지표 설계', '기초선 조사 설계', '데이터 수집 체계', '성과 관리'],
    perspective: '지표 설계',
  },
};

function getIntroMessage(expert: Expert, idea?: string): string {
  const intro = EXPERT_INTROS[expert.type] || EXPERT_INTROS.field;
  const areaList = intro.areas.map((a) => '- ' + a).join('\n');
  const ideaSnip = idea ? idea.slice(0, 120) + (idea.length > 120 ? '...' : '') : '';
  const ideaText = idea ? '\n말씀하신 사업 아이디어를 확인했습니다:\n"' + ideaSnip + '"\n' : '';
  return '안녕하세요! ' + expert.title + '입니다. 해당 분야에서 ' + intro.years + '의 경험을 가진 전문가입니다. 다양한 국가에서 ODA 사업을 기획하고 실행한 경험이 있습니다.\n\n' + areaList + '\n\n위와 같은 분야에서 도움을 드릴 수 있습니다.' + ideaText + '\n이 내용을 바탕으로 ' + intro.perspective + ' 관점에서 도움을 드리겠습니다. 더 구체적인 질문이나 논의하고 싶은 부분이 있으시면 자유롭게 말씀해주세요.';
}

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
  const [streaming, setStreaming] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeExpert = experts.find((e) => e.id === activeExpertId);
  const session = expertSessions.find((s) => s.expertId === activeExpertId);
  const messages: ChatMessage[] = session?.messages || [];
  const completedCount = experts.filter((e) => e.status === 'completed').length;
  const allCompleted = completedCount === 4 && experts.length === 4;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (experts.length > 0 && !activeExpertId) {
      setActiveExpertId(experts[0].id);
    }
  }, [experts]);

  async function sendMessage() {
    if (!input.trim() || !activeExpert || streaming) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    updateExpertSession({ expertId: activeExpertId, messages: newMessages, completed: session?.completed || false });
    setInput('');
    setStreaming(true);

    const assistantMsgId = crypto.randomUUID();
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };
    updateExpertSession({ expertId: activeExpertId, messages: [...newMessages, assistantMsg], completed: session?.completed || false });

    try {
      const res = await fetch('/api/gni-an/consulting/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expertType: activeExpert.type,
          expertTitle: activeExpert.title,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          ideation,
          analysis: ideationAnalysis,
        }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        updateExpertSession({
          expertId: activeExpertId,
          messages: [...newMessages, { ...assistantMsg, content: accumulated }],
          completed: session?.completed || false,
        });
      }
    } catch {
      updateExpertSession({
        expertId: activeExpertId,
        messages: [...newMessages, { ...assistantMsg, content: '응답 중 오류가 발생했습니다.' }],
        completed: session?.completed || false,
      });
    } finally {
      setStreaming(false);
    }
  }

  function handleComplete() {
    if (!activeExpert || messages.filter((m) => m.role === 'user').length === 0) return;
    completeExpert(activeExpertId);
    updateExpertSession({ expertId: activeExpertId, messages, completed: true });
  }

  function handleNext() {
    router.push('/gni-an/ideation/structure');
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
            <div className="flex items-center gap-2">
              {allCompleted ? (
                <Button size="sm" onClick={handleNext}>
                  다음 단계 <ArrowRight size={14} />
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleComplete}
                  disabled={messages.filter((m) => m.role === 'user').length === 0 || activeExpert?.status === 'completed'}
                >
                  상담 완료
                </Button>
              )}
            </div>
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
            {/* 인트로 메시지 */}
            {activeExpert && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-3 text-sm bg-gray-100 text-gray-800">
                  <MarkdownText content={getIntroMessage(activeExpert, ideation?.idea)} />
                </div>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={clsx('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={clsx(
                  'max-w-[80%] rounded-2xl px-4 py-3 text-sm',
                  msg.role === 'user'
                    ? 'bg-[#8AA81E] text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                )}>
                  {msg.content ? (
                    msg.role === 'assistant'
                      ? <MarkdownText content={msg.content} />
                      : <span>{msg.content}</span>
                  ) : (streaming && msg.role === 'assistant' ? (
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </span>
                  ) : null)}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 pb-4 pt-2 border-t border-gray-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={`${activeExpert?.title}에게 질문하세요...`}
                disabled={streaming || activeExpert?.status === 'completed'}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8AA81E] disabled:bg-gray-50 disabled:text-gray-400"
              />
              <Button onClick={sendMessage} disabled={!input.trim() || streaming} size="sm">
                <Send size={15} />
              </Button>
            </div>
            {!allCompleted && (
              <p className="text-xs text-gray-400 mt-1.5 text-center">
                {experts.filter((e) => e.status !== 'completed').map((e) => e.title.split(' ')[0]).join(', ')} 전문가 상담을 완료해야 다음 단계로 이동할 수 있습니다.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
