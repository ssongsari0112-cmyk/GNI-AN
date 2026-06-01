'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { StepHeader } from '@/components/layout/StepHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useProjectStore } from '@/lib/store/projectStore';
import type { Insight, PDMRow } from '@/types';
import { ArrowRight, RefreshCw, Lightbulb, AlertTriangle, X, Plus, Pencil, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';

type Tab = 'problem' | 'objective' | 'pdm';

/* ── 인사이트 모달 ──────────────────────────────── */
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  '문제 정의':  { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200' },
  '수혜자':     { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200' },
  '개입 전략':  { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
  '리스크':     { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  '지속가능성': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};

function InsightsModal({ insights, onClose }: { insights: Insight[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-[#F7F8F2]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#EEF5D6] flex items-center justify-center">
              <Lightbulb size={16} className="text-[#8AA81E]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#111827] text-sm">AI 인사이트</h3>
              <p className="text-[11px] text-gray-400">컨설팅 상담에서 도출된 핵심 인사이트</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        {insights.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-gray-500">아직 인사이트가 없습니다</p>
            <p className="text-xs text-gray-400 mt-1">AI로 사업 구조 생성 후 확인하세요</p>
          </div>
        ) : (
          <div className="overflow-y-auto p-5 space-y-3">
            {insights.map((ins, idx) => {
              const c = CATEGORY_COLORS[ins.category] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
              return (
                <div key={ins.id} className={`rounded-xl border p-4 ${c.bg} ${c.border}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-white bg-gray-400 rounded-full w-4 h-4 flex items-center justify-center">{idx + 1}</span>
                      <span className={`text-xs font-semibold ${c.text}`}>{ins.category}</span>
                    </div>
                    <Badge variant={ins.confidence === 'high' ? 'green' : ins.confidence === 'medium' ? 'blue' : 'gray'}>
                      {ins.confidence === 'high' ? '신뢰도 높음' : ins.confidence === 'medium' ? '신뢰도 보통' : '참고용'}
                    </Badge>
                  </div>
                  <p className={`text-sm leading-relaxed ${c.text}`}>{ins.content}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 인라인 편집 컴포넌트 ──────────────────────── */
function InlineEdit({
  value, onSave, onDelete, multiline = false,
  className = '', placeholder = '내용 입력...',
}: {
  value: string; onSave: (v: string) => void; onDelete?: () => void;
  multiline?: boolean; className?: string; placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  function save() { if (val.trim()) onSave(val.trim()); setEditing(false); }

  if (editing) {
    const sharedClass = 'w-full border border-[#8AA81E] rounded px-2 py-1 text-sm focus:outline-none bg-white';
    return (
      <div className="flex items-start gap-1 w-full">
        {multiline ? (
          <textarea ref={inputRef as React.RefObject<HTMLTextAreaElement>} value={val}
            onChange={(e) => setVal(e.target.value)} rows={2}
            className={`${sharedClass} resize-none`} placeholder={placeholder}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); } if (e.key === 'Escape') setEditing(false); }}
          />
        ) : (
          <input ref={inputRef as React.RefObject<HTMLInputElement>} value={val}
            onChange={(e) => setVal(e.target.value)}
            className={sharedClass} placeholder={placeholder}
            onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
          />
        )}
        <button onClick={save} className="text-[#8AA81E] p-1 flex-shrink-0"><Check size={14} /></button>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-1 group w-full ${className}`}>
      <span className="flex-1 text-sm leading-relaxed">{value}</span>
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button onClick={() => { setVal(value); setEditing(true); }} className="text-gray-400 hover:text-[#8AA81E] p-0.5">
          <Pencil size={12} />
        </button>
        {onDelete && (
          <button onClick={onDelete} className="text-gray-400 hover:text-red-400 p-0.5">
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ── 문제분석 편집기 ──────────────────────────── */
function ProblemEditor({ structure, setStructure }: { structure: any; setStructure: (s: any) => void }) {
  const pt = structure.problemTree;

  function updateEffect(id: string, text: string) {
    setStructure({ ...structure, problemTree: { ...pt, effects: pt.effects.map((e: any) => e.id === id ? { ...e, text } : e) } });
  }
  function deleteEffect(id: string) {
    setStructure({ ...structure, problemTree: { ...pt, effects: pt.effects.filter((e: any) => e.id !== id) } });
  }
  function addEffect() {
    const id = 'e' + Date.now();
    setStructure({ ...structure, problemTree: { ...pt, effects: [...pt.effects, { id, text: '새 결과' }] } });
  }
  function updateCoreProblem(text: string) {
    setStructure({ ...structure, problemTree: { ...pt, coreProblem: text } });
  }
  function updateCause(id: string, text: string) {
    setStructure({ ...structure, problemTree: { ...pt, causes: pt.causes.map((c: any) => c.id === id ? { ...c, text } : c) } });
  }
  function deleteCause(id: string) {
    setStructure({ ...structure, problemTree: { ...pt, causes: pt.causes.filter((c: any) => c.id !== id) } });
  }
  function addCause() {
    const id = 'c' + Date.now();
    setStructure({ ...structure, problemTree: { ...pt, causes: [...pt.causes, { id, text: '새 직접 원인', children: [] }] } });
  }
  function updateSubCause(causeId: string, childId: string, text: string) {
    setStructure({ ...structure, problemTree: { ...pt, causes: pt.causes.map((c: any) => c.id === causeId ? { ...c, children: c.children.map((ch: any) => ch.id === childId ? { ...ch, text } : ch) } : c) } });
  }
  function deleteSubCause(causeId: string, childId: string) {
    setStructure({ ...structure, problemTree: { ...pt, causes: pt.causes.map((c: any) => c.id === causeId ? { ...c, children: c.children.filter((ch: any) => ch.id !== childId) } : c) } });
  }
  function addSubCause(causeId: string) {
    const id = 'c' + Date.now();
    setStructure({ ...structure, problemTree: { ...pt, causes: pt.causes.map((c: any) => c.id === causeId ? { ...c, children: [...c.children, { id, text: '새 근본 원인' }] } : c) } });
  }

  return (
    <div className="space-y-5">
      {/* 결과 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">결과 (Effects)</h3>
          <button onClick={addEffect} className="flex items-center gap-1 text-xs text-[#8AA81E] hover:text-[#799516]">
            <Plus size={12} /> 결과 추가
          </button>
        </div>
        <div className="space-y-1.5">
          {pt.effects.map((e: any) => (
            <div key={e.id} className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <InlineEdit value={e.text} onSave={(v) => updateEffect(e.id, v)} onDelete={() => deleteEffect(e.id)} className="text-red-700" />
            </div>
          ))}
        </div>
      </div>

      {/* 핵심 문제 */}
      <div className="bg-orange-100 border-2 border-orange-400 rounded-xl p-4">
        <div className="text-xs font-semibold text-orange-600 mb-2 text-center">핵심 문제 (Core Problem)</div>
        <InlineEdit value={pt.coreProblem} onSave={updateCoreProblem} multiline className="font-semibold text-orange-900 text-center" />
      </div>

      {/* 원인 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">원인 (Causes)</h3>
          <button onClick={addCause} className="flex items-center gap-1 text-xs text-[#8AA81E] hover:text-[#799516]">
            <Plus size={12} /> 직접 원인 추가
          </button>
        </div>
        <div className="space-y-2">
          {pt.causes.map((cause: any) => (
            <div key={cause.id}>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                <InlineEdit value={cause.text} onSave={(v) => updateCause(cause.id, v)} onDelete={() => deleteCause(cause.id)} className="font-medium text-yellow-900" />
              </div>
              <div className="ml-4 mt-1 space-y-1">
                {cause.children?.map((child: any) => (
                  <div key={child.id} className="bg-yellow-50/50 border border-yellow-100 rounded px-3 py-1.5 flex items-center gap-1">
                    <span className="text-yellow-600 text-xs mr-1">└</span>
                    <InlineEdit value={child.text} onSave={(v) => updateSubCause(cause.id, child.id, v)} onDelete={() => deleteSubCause(cause.id, child.id)} className="text-yellow-800 text-xs" />
                  </div>
                ))}
                <button onClick={() => addSubCause(cause.id)} className="flex items-center gap-1 text-[10px] text-yellow-500 hover:text-yellow-700 ml-2">
                  <Plus size={10} /> 근본 원인 추가
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 목표체계 편집기 ──────────────────────────── */
function ObjectiveEditor({ structure, setStructure }: { structure: any; setStructure: (s: any) => void }) {
  const ot = structure.objectiveTree;

  function updateField(field: string, value: string) {
    setStructure({ ...structure, objectiveTree: { ...ot, [field]: value } });
  }
  function updateOutcome(id: string, text: string) {
    setStructure({ ...structure, objectiveTree: { ...ot, outcomes: ot.outcomes.map((o: any) => o.id === id ? { ...o, text } : o) } });
  }
  function deleteOutcome(id: string) {
    setStructure({ ...structure, objectiveTree: { ...ot, outcomes: ot.outcomes.filter((o: any) => o.id !== id) } });
  }
  function addOutcome() {
    const id = 'o' + Date.now();
    setStructure({ ...structure, objectiveTree: { ...ot, outcomes: [...ot.outcomes, { id, text: '새 성과', level: 'outcome', children: [] }] } });
  }
  function updateOutput(outcomeId: string, childId: string, text: string) {
    setStructure({ ...structure, objectiveTree: { ...ot, outcomes: ot.outcomes.map((o: any) => o.id === outcomeId ? { ...o, children: o.children.map((c: any) => c.id === childId ? { ...c, text } : c) } : o) } });
  }
  function deleteOutput(outcomeId: string, childId: string) {
    setStructure({ ...structure, objectiveTree: { ...ot, outcomes: ot.outcomes.map((o: any) => o.id === outcomeId ? { ...o, children: o.children.filter((c: any) => c.id !== childId) } : o) } });
  }
  function addOutput(outcomeId: string) {
    const id = 'o' + Date.now();
    setStructure({ ...structure, objectiveTree: { ...ot, outcomes: ot.outcomes.map((o: any) => o.id === outcomeId ? { ...o, children: [...o.children, { id, text: '새 산출물', level: 'output' }] } : o) } });
  }
  function updateActivity(id: string, text: string) {
    setStructure({ ...structure, objectiveTree: { ...ot, activities: ot.activities.map((a: any) => a.id === id ? { ...a, text } : a) } });
  }
  function deleteActivity(id: string) {
    setStructure({ ...structure, objectiveTree: { ...ot, activities: ot.activities.filter((a: any) => a.id !== id) } });
  }
  function addActivity() {
    const id = 'a' + Date.now();
    setStructure({ ...structure, objectiveTree: { ...ot, activities: [...(ot.activities || []), { id, text: '새 활동', level: 'activity' }] } });
  }

  return (
    <div className="space-y-3">
      {/* Impact */}
      <div className="border border-purple-300 rounded-xl p-4 bg-purple-50">
        <div className="text-xs font-semibold text-gray-500 mb-2">영향 (Impact)</div>
        <InlineEdit value={ot.impact} onSave={(v) => updateField('impact', v)} multiline className="text-purple-800" />
      </div>

      {/* Purpose */}
      <div className="border border-blue-300 rounded-xl p-4 bg-blue-50">
        <div className="text-xs font-semibold text-gray-500 mb-2">사업목적 (Purpose)</div>
        <InlineEdit value={ot.purpose} onSave={(v) => updateField('purpose', v)} multiline className="text-blue-800" />
      </div>

      {/* Outcomes */}
      <div className="border border-green-200 rounded-xl p-4 bg-green-50">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-gray-500">성과 (Outcomes)</div>
          <button onClick={addOutcome} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800">
            <Plus size={11} /> 성과 추가
          </button>
        </div>
        <div className="space-y-3">
          {ot.outcomes.map((o: any) => (
            <div key={o.id}>
              <div className="bg-white border border-green-200 rounded-lg px-3 py-2 mb-1">
                <InlineEdit value={o.text} onSave={(v) => updateOutcome(o.id, v)} onDelete={() => deleteOutcome(o.id)} className="font-medium text-green-800" />
              </div>
              <div className="ml-4 space-y-1">
                {o.children?.map((c: any) => (
                  <div key={c.id} className="flex items-center gap-1 bg-green-50 border border-green-100 rounded px-3 py-1">
                    <span className="text-green-400 text-xs mr-1">·</span>
                    <InlineEdit value={c.text} onSave={(v) => updateOutput(o.id, c.id, v)} onDelete={() => deleteOutput(o.id, c.id)} className="text-green-700 text-xs" />
                  </div>
                ))}
                <button onClick={() => addOutput(o.id)} className="flex items-center gap-1 text-[10px] text-green-500 hover:text-green-700 ml-2">
                  <Plus size={10} /> 산출물 추가
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activities */}
      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-gray-500">활동 (Activities)</div>
          <button onClick={addActivity} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
            <Plus size={11} /> 활동 추가
          </button>
        </div>
        <div className="space-y-1">
          {(ot.activities || []).map((a: any) => (
            <div key={a.id} className="flex items-center gap-1 py-0.5">
              <span className="text-gray-400 text-xs">·</span>
              <InlineEdit value={a.text} onSave={(v) => updateActivity(a.id, v)} onDelete={() => deleteActivity(a.id)} className="text-gray-600 text-xs" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── PDM 편집기 ───────────────────────────────── */
function PDMRowEditor({ row, onUpdate, onDelete, onAddChild, level = 0 }: {
  row: PDMRow; onUpdate: (updated: PDMRow) => void; onDelete?: () => void;
  onAddChild?: () => void; level?: number;
}) {
  const [expanded, setExpanded] = useState(level === 0);
  const bgColors: Record<string, string> = {
    impact: 'bg-purple-50 border-purple-200',
    purpose: 'bg-blue-50 border-blue-200',
    outcome: 'bg-green-50 border-green-200',
    output: 'bg-yellow-50 border-yellow-200',
  };
  const levelLabels: Record<string, string> = {
    impact: '영향', purpose: '사업목적', outcome: '성과', output: '산출물',
  };
  const indentClass = level > 0 ? `ml-${level * 4}` : '';

  function updateField(field: keyof PDMRow, value: string) {
    onUpdate({ ...row, [field]: value });
  }

  return (
    <div className={indentClass}>
      <div className={clsx('border rounded-lg mb-2 overflow-hidden', bgColors[row.level] || 'bg-gray-50 border-gray-200')}>
        <div className="flex items-center gap-2 p-3">
          <Badge variant={row.level === 'impact' ? 'blue' : row.level === 'purpose' ? 'olive' : 'gray'}>
            {levelLabels[row.level] || row.level}
          </Badge>
          <span className="text-xs text-gray-400 flex-shrink-0">{row.code}</span>
          <div className="flex-1 min-w-0">
            <InlineEdit value={row.narrative} onSave={(v) => updateField('narrative', v)} className="font-medium text-gray-700" />
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {onDelete && (
              <button onClick={onDelete} className="text-gray-300 hover:text-red-400 p-1"><X size={12} /></button>
            )}
            <button onClick={() => setExpanded(!expanded)} className="text-gray-400 p-1">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="px-4 pb-3 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
            {([
              { key: 'indicators', label: '지표 (OVI)' },
              { key: 'verificationMeans', label: '검증수단 (MOV)' },
              { key: 'assumptions', label: '가정', full: true },
            ] as { key: keyof PDMRow; label: string; full?: boolean }[]).map((f) => (
              <div key={f.key} className={f.full ? 'col-span-2' : ''}>
                <div className="text-xs font-medium text-gray-500 mb-1">{f.label}</div>
                <div className="bg-white rounded border border-gray-200 px-2 py-1.5">
                  <InlineEdit value={(row[f.key] as string) || ''} onSave={(v) => updateField(f.key, v)} multiline className="text-gray-700 text-xs" placeholder={f.label + ' 입력...'} />
                </div>
              </div>
            ))}
            {onAddChild && (
              <div className="col-span-2">
                <button onClick={onAddChild} className="flex items-center gap-1 text-xs text-[#8AA81E] hover:text-[#799516]">
                  <Plus size={11} /> 산출물 추가
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {row.children?.map((child) => (
        <PDMRowEditor
          key={child.id}
          row={child}
          level={level + 1}
          onUpdate={(updated) => onUpdate({ ...row, children: row.children?.map((c) => c.id === child.id ? updated : c) || [] })}
          onDelete={() => onUpdate({ ...row, children: row.children?.filter((c) => c.id !== child.id) || [] })}
        />
      ))}
    </div>
  );
}

function PDMEditor({ structure, setStructure }: { structure: any; setStructure: (s: any) => void }) {
  function updateRow(id: string, updated: PDMRow) {
    setStructure({ ...structure, pdm: structure.pdm.map((r: PDMRow) => r.id === id ? updated : r) });
  }
  function deleteRow(id: string) {
    setStructure({ ...structure, pdm: structure.pdm.filter((r: PDMRow) => r.id !== id) });
  }
  function addChild(parentId: string) {
    const id = 'pdm-' + Date.now();
    setStructure({
      ...structure,
      pdm: structure.pdm.map((r: PDMRow) => r.id === parentId
        ? { ...r, children: [...(r.children || []), { id, level: 'output', code: 'Output', narrative: '새 산출물', indicators: '', verificationMeans: '', assumptions: '', children: [] }] }
        : r
      ),
    });
  }
  function addOutcome() {
    const id = 'pdm-' + Date.now();
    const newRow: PDMRow = { id, level: 'outcome', code: 'IM ' + (structure.pdm.filter((r: PDMRow) => r.level === 'outcome').length + 1), narrative: '새 성과', indicators: '', verificationMeans: '', assumptions: '', children: [] };
    setStructure({ ...structure, pdm: [...structure.pdm, newRow] });
  }

  return (
    <div>
      {structure.pdm.map((row: PDMRow) => (
        <PDMRowEditor
          key={row.id}
          row={row}
          onUpdate={(updated) => updateRow(row.id, updated)}
          onDelete={row.level !== 'impact' && row.level !== 'purpose' ? () => deleteRow(row.id) : undefined}
          onAddChild={row.level === 'outcome' ? () => addChild(row.id) : undefined}
        />
      ))}
      <button onClick={addOutcome} className="flex items-center gap-1.5 text-sm text-[#8AA81E] hover:text-[#799516] mt-2">
        <Plus size={14} /> 성과(Outcome) 추가
      </button>
    </div>
  );
}

/* ── 메인 페이지 ──────────────────────────────── */
export default function StructurePage() {
  const router = useRouter();
  const { ideation, ideationAnalysis, expertSessions, setStructure, setInsights, insights, structure } = useProjectStore();

  const [loading, setLoading] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('problem');
  const [showInsights, setShowInsights] = useState(false);
  const [error, setError] = useState('');

  const generated = !!structure;

  useEffect(() => {
    if (insights.length === 0 && expertSessions.length > 0) {
      setInsightsLoading(true);
      fetch('/api/gni-an/insights/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideation, analysis: ideationAnalysis, expertSessions: expertSessions.map((s) => ({ expertId: s.expertId, messages: s.messages })) }),
      })
        .then((r) => r.json())
        .then((data) => { if (data.success) setInsights(data.data); })
        .catch(() => {})
        .finally(() => setInsightsLoading(false));
    }
  }, []);

  async function handleGenerate() {
    setLoading(true);
    setError('');
    try {
      const sessions = expertSessions.map((s) => ({ expertId: s.expertId, summary: s.messages.slice(-2).map((m) => m.content).join('\n') }));
      const res = await fetch('/api/gni-an/structure/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideation, analysis: ideationAnalysis, expertSessions: sessions }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setStructure({ problemTree: data.data.problemTree, objectiveTree: data.data.objectiveTree, pdm: data.data.pdm });
      if (data.data.insights?.length) setInsights(data.data.insights);
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#111827] mb-1">사업 구조화</h1>
            <p className="text-gray-500 text-sm">전문가 상담 결과를 바탕으로 문제분석, 목표체계, PDM을 설계합니다.</p>
          </div>
          <button
            onClick={() => setShowInsights(true)}
            disabled={insightsLoading}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors border ${
              insights.length > 0 ? 'bg-[#EEF5D6] border-[#D9E6B7] text-[#5a7012] hover:bg-[#D9E6B7]'
              : insightsLoading ? 'bg-white border-[#D9E6B7] text-[#8AA81E] animate-pulse'
              : 'bg-white border-gray-200 text-gray-400'
            }`}
          >
            <Lightbulb size={14} className={insightsLoading ? 'animate-pulse' : ''} />
            {insightsLoading ? '인사이트 추출 중...' : insights.length > 0 ? `인사이트 ${insights.length}개` : '인사이트'}
          </button>
        </div>

        {!generated ? (
          <div className="bg-white rounded-2xl border border-[#D9E6B7] p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#EEF5D6] flex items-center justify-center mx-auto mb-5">
              <Lightbulb size={28} className="text-[#8AA81E]" />
            </div>
            <h2 className="text-lg font-semibold text-[#111827] mb-2">AI로 사업 구조 생성하기</h2>
            <p className="text-gray-400 text-sm mb-4">전문가 상담 결과와 아이디어 분석을 바탕으로<br />문제분석, 목표체계, PDM 초안을 자동 생성합니다.</p>
            {loading && <div className="flex items-center justify-center gap-2 text-sm text-orange-500 mb-3"><AlertTriangle size={14} />생성 중 다른 화면으로 이동하면 작업이 중단됩니다.</div>}
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <Button onClick={handleGenerate} loading={loading} size="lg">
              {loading ? '구조 생성 중...' : 'AI로 사업 구조 생성하기'}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex gap-1 bg-white border border-[#D9E6B7] rounded-xl p-1 mb-4">
              {([{ id: 'problem', label: '문제분석' }, { id: 'objective', label: '목표체계' }, { id: 'pdm', label: 'PDM 초안' }] as const).map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={clsx('flex-1 py-2 text-sm font-medium rounded-lg transition-colors', activeTab === tab.id ? 'bg-[#8AA81E] text-white' : 'text-gray-500 hover:text-[#8AA81E]')}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex justify-end mb-3">
              <button onClick={handleGenerate} disabled={loading} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#8AA81E] transition-colors">
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                재생성
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-[#D9E6B7] p-6">
              {activeTab === 'problem' && structure?.problemTree && (
                <ProblemEditor structure={structure} setStructure={setStructure} />
              )}
              {activeTab === 'objective' && structure?.objectiveTree && (
                <ObjectiveEditor structure={structure} setStructure={setStructure} />
              )}
              {activeTab === 'pdm' && structure?.pdm && (
                <PDMEditor structure={structure} setStructure={setStructure} />
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
