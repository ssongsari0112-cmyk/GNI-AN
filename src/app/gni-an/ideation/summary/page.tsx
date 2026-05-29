'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StepHeader } from '@/components/layout/StepHeader';
import { Button } from '@/components/ui/Button';
import { useProjectStore } from '@/lib/store/projectStore';
import type { ProjectSummary } from '@/types';
import { Sparkles, Pencil, Check, X, ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react';

interface EditableSectionProps {
  label: string;
  value: string;
  onSave: (v: string) => void;
}

function EditableSection({ label, value, onSave }: EditableSectionProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  return (
    <div className="relative group">
      <div className="text-xs font-semibold text-gray-500 mb-1">{label}</div>
      {editing ? (
        <div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            className="w-full border border-[#8AA81E] rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
          />
          <div className="flex gap-2 mt-1">
            <Button size="sm" onClick={() => { onSave(draft); setEditing(false); }}>
              <Check size={12} /> 저장
            </Button>
            <Button size="sm" variant="secondary" onClick={() => { setDraft(value); setEditing(false); }}>
              <X size={12} /> 취소
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <p className="text-sm text-gray-700 leading-relaxed">{value}</p>
          <button
            onClick={() => { setDraft(value); setEditing(true); }}
            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-[#8AA81E] bg-[#EEF5D6] border border-[#D9E6B7] rounded px-2 py-0.5 transition-opacity"
          >
            <Pencil size={10} /> 편집
          </button>
        </div>
      )}
    </div>
  );
}

export default function SummaryPage() {
  const router = useRouter();
  const { ideation, ideationAnalysis, structure, expertSessions, getCompletedExpertsCount, setSummary, summary } = useProjectStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const completedExperts = getCompletedExpertsCount();
  const outcomesCount = structure?.objectiveTree?.outcomes?.length || 0;

  async function handleGenerate() {
    setLoading(true);
    setError('');
    try {
      const sessions = expertSessions.map((s) => ({
        expertId: s.expertId,
        summary: s.messages.slice(-3).map((m) => m.content).join('\n'),
      }));

      const res = await fetch('/api/gni-an/summary/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideation, analysis: ideationAnalysis, structure, expertSessions: sessions }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSummary(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '개요서 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function updateSection(path: string[], value: string) {
    if (!summary) return;
    const updated = JSON.parse(JSON.stringify(summary)) as ProjectSummary;
    let obj: Record<string, unknown> = updated as unknown as Record<string, unknown>;
    for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]] as Record<string, unknown>;
    obj[path[path.length - 1]] = value;
    setSummary(updated);
  }

  return (
    <div className="min-h-screen bg-[#F7F8F2]">
      <StepHeader />
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#111827] mb-2">사업개요서</h1>
          <p className="text-gray-500 text-sm">기획 완료 내용을 바탕으로 AI가 사업개요서를 생성합니다.</p>
        </div>

        {/* Status box */}
        <div className="bg-white border border-[#D9E6B7] rounded-2xl p-4 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: '분야', value: ideation?.field || '-' },
            { label: '대상국', value: ideation?.country || '-' },
            { label: '전문가 상담', value: `${completedExperts}개 완료` },
            { label: '성과 수', value: `${outcomesCount}개` },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-xs text-gray-400 mb-0.5">{item.label}</div>
              <div className="text-sm font-semibold text-[#111827]">{item.value}</div>
            </div>
          ))}
        </div>

        {!summary ? (
          <div className="bg-white rounded-2xl border border-[#D9E6B7] p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#EEF5D6] flex items-center justify-center mx-auto mb-4">
              <Sparkles size={24} className="text-[#8AA81E]" />
            </div>
            <h2 className="text-lg font-semibold mb-2">AI로 사업개요서 생성하기</h2>
            <p className="text-gray-400 text-sm mb-4">앞 단계의 아이디어, 전문가 상담, 구조화 결과를 종합하여<br />사업개요서를 자동 생성합니다.</p>
            {loading && (
              <p className="text-orange-500 text-xs flex items-center justify-center gap-1 mb-3">
                <AlertTriangle size={12} />생성 중 다른 화면으로 이동하면 작업이 중단됩니다.
              </p>
            )}
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <Button onClick={handleGenerate} loading={loading} size="lg">
              {loading ? '사업개요서 생성 중...' : 'AI로 사업개요서 생성하기'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="bg-white rounded-2xl border border-[#D9E6B7] p-5">
              <h3 className="font-semibold text-[#111827] mb-4">1. 기본정보</h3>
              <div className="space-y-4">
                <EditableSection label="사업 제목" value={summary.basicInfo.title} onSave={(v) => updateSection(['basicInfo', 'title'], v)} />
                <EditableSection label="사업 요약" value={summary.basicInfo.summary} onSave={(v) => updateSection(['basicInfo', 'summary'], v)} />
              </div>
            </div>

            {/* Background */}
            <div className="bg-white rounded-2xl border border-[#D9E6B7] p-5">
              <h3 className="font-semibold text-[#111827] mb-4">2. 배경 및 필요성</h3>
              <div className="space-y-4">
                <EditableSection label="사업 배경" value={summary.background.background} onSave={(v) => updateSection(['background', 'background'], v)} />
                <EditableSection label="수요 분석" value={summary.background.demandAnalysis} onSave={(v) => updateSection(['background', 'demandAnalysis'], v)} />
              </div>
            </div>

            {/* Objectives */}
            <div className="bg-white rounded-2xl border border-[#D9E6B7] p-5">
              <h3 className="font-semibold text-[#111827] mb-4">3. 목표 체계</h3>
              <div className="space-y-4">
                <EditableSection label="영향" value={summary.objectives.impact} onSave={(v) => updateSection(['objectives', 'impact'], v)} />
                <EditableSection label="사업 목적" value={summary.objectives.purpose} onSave={(v) => updateSection(['objectives', 'purpose'], v)} />
                <EditableSection label="주요 성과" value={summary.objectives.outcomes} onSave={(v) => updateSection(['objectives', 'outcomes'], v)} />
              </div>
            </div>

            {/* Beneficiaries */}
            <div className="bg-white rounded-2xl border border-[#D9E6B7] p-5">
              <h3 className="font-semibold text-[#111827] mb-4">4. 수혜자</h3>
              <div className="space-y-4">
                <EditableSection label="주요 수혜자" value={summary.beneficiaries.direct} onSave={(v) => updateSection(['beneficiaries', 'direct'], v)} />
                <EditableSection label="간접 수혜자" value={summary.beneficiaries.indirect} onSave={(v) => updateSection(['beneficiaries', 'indirect'], v)} />
              </div>
            </div>

            {/* Implementation */}
            <div className="bg-white rounded-2xl border border-[#D9E6B7] p-5">
              <h3 className="font-semibold text-[#111827] mb-4">5. 실행계획</h3>
              <div className="space-y-4">
                <EditableSection label="수행 방법" value={summary.implementation.approach} onSave={(v) => updateSection(['implementation', 'approach'], v)} />
                <EditableSection label="파트너십 전략" value={summary.implementation.partnershipStrategy} onSave={(v) => updateSection(['implementation', 'partnershipStrategy'], v)} />
              </div>
            </div>

            {/* Risks */}
            <div className="bg-white rounded-2xl border border-[#D9E6B7] p-5">
              <h3 className="font-semibold text-[#111827] mb-4">6. 리스크 및 지속 가능성</h3>
              <div className="space-y-4">
                <EditableSection label="주요 리스크-완화 방안" value={summary.risks.mainRisks} onSave={(v) => updateSection(['risks', 'mainRisks'], v)} />
                <EditableSection label="지속가능성 계획" value={summary.risks.sustainabilityPlan} onSave={(v) => updateSection(['risks', 'sustainabilityPlan'], v)} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#8AA81E] transition-colors border border-gray-200 hover:border-[#8AA81E] rounded-xl px-4 py-2.5"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                다시 생성하기
              </button>
              <Button size="lg" className="flex-1" onClick={() => router.push('/gni-an/create?from=ideation')}>
                제안서 작성 시작 <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
