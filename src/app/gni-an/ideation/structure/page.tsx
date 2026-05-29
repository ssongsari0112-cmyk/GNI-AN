'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StepHeader } from '@/components/layout/StepHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useProjectStore } from '@/lib/store/projectStore';
import type { StructureData, Insight, PDMRow, ProblemTreeNode } from '@/types';
import { ArrowRight, RefreshCw, Lightbulb, AlertTriangle, X, Plus, Pencil, Check } from 'lucide-react';
import { clsx } from 'clsx';

type Tab = 'problem' | 'objective' | 'pdm';

function InsightsModal({ insights, onClose }: { insights: Insight[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold">인사이트 ({insights.length}개)</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="overflow-y-auto p-4 space-y-3">
          <div className="flex gap-2 text-xs text-gray-500 mb-3">
            <Badge variant="green">높음</Badge>
            <span>신뢰할 수 있는 인사이트</span>
            <Badge variant="blue">보통</Badge>
            <Badge variant="gray">낮음 — 참고용</Badge>
          </div>
          {insights.map((insight) => (
            <div key={insight.id} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
              <Badge variant={insight.confidence === 'high' ? 'green' : insight.confidence === 'medium' ? 'blue' : 'gray'}>
                {insight.confidence === 'high' ? '높음' : insight.confidence === 'medium' ? '보통' : '낮음'}
              </Badge>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-400 mb-1">{insight.category} • {insight.source}</div>
                <p className="text-sm text-gray-700 leading-relaxed">{insight.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EditableNode({ text, onEdit, onDelete }: { text: string; onEdit: (t: string) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(text);

  return (
    <div className="flex items-center gap-1 group">
      {editing ? (
        <>
          <input
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="flex-1 text-sm border border-[#8AA81E] rounded px-2 py-0.5 focus:outline-none"
          />
          <button onClick={() => { onEdit(val); setEditing(false); }} className="text-[#8AA81E]"><Check size={14} /></button>
        </>
      ) : (
        <>
          <span className="text-sm text-gray-700 flex-1">{text}</span>
          <button onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-[#8AA81E]">
            <Pencil size={12} />
          </button>
          <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400">
            <X size={12} />
          </button>
        </>
      )}
    </div>
  );
}

function PDMCard({ row, level = 0 }: { row: PDMRow; level?: number }) {
  const [expanded, setExpanded] = useState(false);
  const bgColors: Record<string, string> = {
    impact: 'bg-purple-50 border-purple-200',
    purpose: 'bg-blue-50 border-blue-200',
    outcome: 'bg-green-50 border-green-200',
    output: 'bg-yellow-50 border-yellow-200',
    activity: 'bg-gray-50 border-gray-200',
  };
  const levelLabels: Record<string, string> = {
    impact: '영향',
    purpose: '사업목적',
    outcome: '성과',
    output: '산출물',
    activity: '활동',
  };

  return (
    <div className={`ml-${level * 4}`}>
      <div
        className={clsx('border rounded-lg mb-2 overflow-hidden', bgColors[row.level])}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-2 p-3 text-left"
        >
          <Badge variant={row.level === 'impact' ? 'blue' : row.level === 'purpose' ? 'olive' : 'gray'}>
            {levelLabels[row.level]}
          </Badge>
          <span className="text-xs text-gray-400">{row.code}</span>
          <span className="text-sm text-gray-700 font-medium flex-1">{row.narrative}</span>
          <span className="text-gray-400 text-xs">{expanded ? '▲' : '▼'}</span>
        </button>
        {expanded && (
          <div className="px-4 pb-3 grid grid-cols-2 gap-3">
            {[
              { label: '지표 (OVI)', value: row.indicators },
              { label: '검증수단 (MOV)', value: row.verificationMeans },
              { label: '가정', value: row.assumptions },
            ].map((field) => (
              <div key={field.label} className={field.label === '가정' ? 'col-span-2' : ''}>
                <div className="text-xs font-medium text-gray-500 mb-1">{field.label}</div>
                <div className="text-sm text-gray-700 bg-white rounded p-2 border border-gray-200">{field.value || '-'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {row.children?.map((child) => (
        <PDMCard key={child.id} row={child} level={level + 1} />
      ))}
    </div>
  );
}

export default function StructurePage() {
  const router = useRouter();
  const { ideation, ideationAnalysis, expertSessions, setStructure, setInsights, insights, structure } = useProjectStore();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('problem');
  const [showInsights, setShowInsights] = useState(false);
  const [error, setError] = useState('');

  const generated = !!structure;

  async function handleGenerate() {
    setLoading(true);
    setError('');
    try {
      const sessions = expertSessions.map((s) => ({
        expertId: s.expertId,
        summary: s.messages.slice(-2).map((m) => m.content).join('\n'),
      }));

      const res = await fetch('/api/gni-an/structure/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideation, analysis: ideationAnalysis, expertSessions: sessions }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setStructure({
        problemTree: data.data.problemTree,
        objectiveTree: data.data.objectiveTree,
        pdm: data.data.pdm,
      });
      setInsights(data.data.insights || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '구조 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F8F2]">
      <StepHeader />
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#111827] mb-1">사업 구조화</h1>
            <p className="text-gray-500 text-sm">전문가 상담 결과를 바탕으로 문제분석, 목표체계, PDM을 설계합니다.</p>
          </div>
          {insights.length > 0 && (
            <button
              onClick={() => setShowInsights(true)}
              className="flex items-center gap-1.5 bg-[#EEF5D6] border border-[#D9E6B7] rounded-full px-3 py-1.5 text-sm text-[#5a7012] font-medium hover:bg-[#D9E6B7] transition-colors"
            >
              <Lightbulb size={14} />
              인사이트 {insights.length}개
            </button>
          )}
        </div>

        {!generated ? (
          <div className="bg-white rounded-2xl border border-[#D9E6B7] p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#EEF5D6] flex items-center justify-center mx-auto mb-5">
              <Lightbulb size={28} className="text-[#8AA81E]" />
            </div>
            <h2 className="text-lg font-semibold text-[#111827] mb-2">AI로 사업 구조 생성하기</h2>
            <p className="text-gray-400 text-sm mb-2">전문가 상담 결과와 아이디어 분석을 바탕으로<br />문제분석, 목표체계, PDM 초안을 자동 생성합니다.</p>
            {loading && (
              <div className="flex items-center justify-center gap-2 text-sm text-orange-500 mb-3">
                <AlertTriangle size={14} />
                생성 중 다른 화면으로 이동하면 작업이 중단됩니다.
              </div>
            )}
            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}
            <Button onClick={handleGenerate} loading={loading} size="lg">
              {loading ? '구조 생성 중...' : 'AI로 사업 구조 생성하기'}
            </Button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-1 bg-white border border-[#D9E6B7] rounded-xl p-1 mb-4">
              {([
                { id: 'problem', label: '문제분석' },
                { id: 'objective', label: '목표체계' },
                { id: 'pdm', label: 'PDM 초안' },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'flex-1 py-2 text-sm font-medium rounded-lg transition-colors',
                    activeTab === tab.id ? 'bg-[#8AA81E] text-white' : 'text-gray-500 hover:text-[#8AA81E]'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Regenerate */}
            <div className="flex justify-end mb-3">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#8AA81E] transition-colors"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                재생성
              </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl border border-[#D9E6B7] p-6">
              {activeTab === 'problem' && structure?.problemTree && (
                <div className="space-y-4">
                  {/* Effects */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">결과 (Effects)</h3>
                    <div className="space-y-1">
                      {structure.problemTree.effects.map((e) => (
                        <div key={e.id} className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                          <span className="text-sm text-red-700">{e.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Core Problem */}
                  <div className="bg-orange-100 border-2 border-orange-400 rounded-xl p-4 text-center">
                    <div className="text-xs font-semibold text-orange-600 mb-1">핵심 문제 (Core Problem)</div>
                    <div className="font-semibold text-orange-900">{structure.problemTree.coreProblem}</div>
                  </div>
                  {/* Causes */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">원인 (Causes)</h3>
                    <div className="space-y-2">
                      {structure.problemTree.causes.map((cause) => (
                        <div key={cause.id}>
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 font-medium text-sm text-yellow-900">
                            {cause.text}
                          </div>
                          {cause.children?.map((child) => (
                            <div key={child.id} className="ml-4 mt-1 bg-yellow-50/50 border border-yellow-100 rounded px-3 py-1.5 text-xs text-yellow-800">
                              └ {child.text}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'objective' && structure?.objectiveTree && (
                <div className="space-y-3">
                  {[
                    { label: '영향 (Impact)', value: structure.objectiveTree.impact, color: 'bg-purple-50 border-purple-300' },
                    { label: '사업목적 (Purpose)', value: structure.objectiveTree.purpose, color: 'bg-blue-50 border-blue-300' },
                  ].map((item) => (
                    <div key={item.label} className={`border rounded-xl p-4 ${item.color}`}>
                      <div className="text-xs font-semibold text-gray-500 mb-1">{item.label}</div>
                      <div className="text-sm text-gray-800">{item.value}</div>
                    </div>
                  ))}
                  <div className="border border-green-200 rounded-xl p-4 bg-green-50">
                    <div className="text-xs font-semibold text-gray-500 mb-2">성과 (Outcomes)</div>
                    {structure.objectiveTree.outcomes.map((o) => (
                      <div key={o.id} className="mb-2">
                        <div className="text-sm font-medium text-green-800 mb-1">{o.text}</div>
                        {o.children?.map((child) => (
                          <div key={child.id} className="ml-3 text-xs text-green-700 py-0.5">· {child.text}</div>
                        ))}
                      </div>
                    ))}
                  </div>
                  {structure.objectiveTree.activities.length > 0 && (
                    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                      <div className="text-xs font-semibold text-gray-500 mb-2">활동 (Activities)</div>
                      {structure.objectiveTree.activities.map((a) => (
                        <div key={a.id} className="text-xs text-gray-600 py-0.5">· {a.text}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'pdm' && structure?.pdm && (
                <div>
                  {structure.pdm.map((row) => (
                    <PDMCard key={row.id} row={row} />
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button size="lg" onClick={() => router.push('/gni-an/ideation/summary')}>
                다음 단계 <ArrowRight size={16} />
              </Button>
            </div>
          </>
        )}
      </main>

      {showInsights && <InsightsModal insights={insights} onClose={() => setShowInsights(false)} />}
    </div>
  );
}
