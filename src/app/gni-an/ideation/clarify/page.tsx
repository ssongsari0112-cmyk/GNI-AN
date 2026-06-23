'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StepHeader } from '@/components/layout/StepHeader';
import { Button } from '@/components/ui/Button';
import { useProjectStore } from '@/lib/store/projectStore';
import type { ClarifyQuestion } from '@/types';
import { Loader2, ArrowRight, MessageCircleQuestion } from 'lucide-react';

export default function ClarifyPage() {
  const router = useRouter();
  const {
    ideation, expertSessions,
    clarifyQuestions, setClarifyQuestions,
    clarifyAnswers, setClarifyAnswer,
  } = useProjectStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (clarifyQuestions.length > 0 || fetchedRef.current) return;
    if (!ideation) return;
    fetchedRef.current = true;
    fetchQuestions();
  }, [ideation, clarifyQuestions.length]);

  async function fetchQuestions() {
    setLoading(true);
    setError('');
    try {
      const consultingHistory = expertSessions
        .filter((s) => s.completed)
        .map((s) => `[${s.expertId} 전문가] ${s.messages.slice(-3).map((m) => m.content).join(' / ')}`)
        .join('\n');

      const res = await fetch('/api/gni-an/clarify/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaContext: ideation, consultingHistory }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setClarifyQuestions(data.questions as ClarifyQuestion[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '질문 생성 중 오류가 발생했습니다.');
      fetchedRef.current = false;
    } finally {
      setLoading(false);
    }
  }

  const allAnswered = clarifyQuestions.length === 5 &&
    clarifyQuestions.every((q) => (clarifyAnswers[q.id] || '').trim().length > 0);

  function handleNext() {
    router.push('/gni-an/ideation/structure');
  }

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
    <div className="min-h-screen bg-[#F7F8F2]">
      <StepHeader />

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#EEF5D6] flex items-center justify-center">
            <MessageCircleQuestion size={16} className="text-[#8AA81E]" />
          </div>
          <h1 className="text-xl font-bold text-[#111827]">사업 구체화</h1>
        </div>
        <p className="text-sm text-gray-500 mb-8">
          입력하신 아이디어와 전문가 상담 내용을 바탕으로 만든 질문입니다. 편하게 아는 만큼 답해주시면
          이후 구조화·개요서 작성에 그대로 반영됩니다.
        </p>

        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <Loader2 size={28} className="text-[#8AA81E] animate-spin" />
            <p className="text-sm text-gray-500">사업에 맞는 질문을 생성하고 있어요...</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-6 flex items-center justify-between">
            <span>{error}</span>
            <Button size="sm" variant="secondary" onClick={fetchQuestions}>다시 시도</Button>
          </div>
        )}

        {!loading && clarifyQuestions.length > 0 && (
          <div className="space-y-6">
            {clarifyQuestions.map((q, i) => (
              <div key={q.id} className="bg-white border border-[#D9E6B7] rounded-xl p-5">
                <div className="flex items-start gap-2 mb-3">
                  <span className="w-5 h-5 rounded-full bg-[#8AA81E] text-white text-[11px] font-bold flex items-center justify-center mt-0.5 shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-sm font-medium text-[#111827] leading-relaxed">{q.question}</p>
                </div>
                <textarea
                  value={clarifyAnswers[q.id] || ''}
                  onChange={(e) => setClarifyAnswer(q.id, e.target.value)}
                  placeholder={q.placeholder}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#8AA81E] resize-none"
                />
              </div>
            ))}

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-400">
                {clarifyQuestions.filter((q) => (clarifyAnswers[q.id] || '').trim().length > 0).length}/5 답변 완료
              </p>
              <Button size="lg" onClick={handleNext} disabled={!allAnswered}>
                다음 단계 <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
