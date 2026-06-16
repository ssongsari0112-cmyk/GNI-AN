'use client';
import React, { useState, useCallback } from 'react';
import { useProjectStore } from '@/lib/store/projectStore';
import type { ObjectiveTreeNode } from '@/types';
import { Loader2, Sparkles, RefreshCw, Check } from 'lucide-react';
import { clsx } from 'clsx';

function uid() {
  return `o${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

// ── Tree helper functions ───────────────────────────────────────────────

function updateNodeText(nodes: ObjectiveTreeNode[], id: string, text: string): ObjectiveTreeNode[] {
  return nodes.map(n => {
    if (n.id === id) return { ...n, text };
    if (n.children?.length) return { ...n, children: updateNodeText(n.children, id, text) };
    return n;
  });
}

function deleteNode(nodes: ObjectiveTreeNode[], id: string): ObjectiveTreeNode[] {
  return nodes
    .filter(n => n.id !== id)
    .map(n => n.children?.length ? { ...n, children: deleteNode(n.children, id) } : n);
}

function addSibling(nodes: ObjectiveTreeNode[], afterId: string, newNode: ObjectiveTreeNode): ObjectiveTreeNode[] {
  const idx = nodes.findIndex(n => n.id === afterId);
  if (idx !== -1) {
    const next = [...nodes];
    next.splice(idx + 1, 0, newNode);
    return next;
  }
  return nodes.map(n =>
    n.children?.length ? { ...n, children: addSibling(n.children, afterId, newNode) } : n
  );
}

function addChild(nodes: ObjectiveTreeNode[], parentId: string, newChild: ObjectiveTreeNode): ObjectiveTreeNode[] {
  return nodes.map(n => {
    if (n.id === parentId) return { ...n, children: [...(n.children || []), newChild] };
    if (n.children?.length) return { ...n, children: addChild(n.children, parentId, newChild) };
    return n;
  });
}

// ── Node Box ────────────────────────────────────────────────────────────

function NodeBox({
  text,
  variant,
  onUpdate,
  onDelete,
  onAddSibling,
  onAddChild,
  childLabel = '하위',
}: {
  text: string;
  variant: 'impact' | 'purpose' | 'outcome' | 'output';
  onUpdate: (t: string) => void;
  onDelete?: () => void;
  onAddSibling?: () => void;
  onAddChild?: () => void;
  childLabel?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(text);

  React.useEffect(() => { setVal(text); }, [text]);

  const save = () => {
    const t = val.trim();
    if (t) onUpdate(t);
    setEditing(false);
  };

  const variantCls = {
    impact: 'bg-purple-50 border-purple-300 text-purple-800 min-w-[240px] py-4 font-semibold text-sm',
    purpose: 'bg-blue-50 border-blue-300 text-blue-800 min-w-[220px] py-3 font-medium',
    outcome: 'bg-[#EEF5D6] border-[#8AA81E] text-[#3b5c0a] min-w-[130px] max-w-[190px]',
    output: 'bg-emerald-50 border-emerald-200 text-emerald-700 min-w-[110px] max-w-[170px] text-[10px]',
  }[variant];

  return (
    <div className="group relative">
      <div className={clsx(
        'border-2 rounded-xl px-3 py-2.5 text-center text-xs leading-snug shadow-sm transition-all hover:shadow-md',
        variantCls,
      )}>
        {editing ? (
          <>
            <textarea
              autoFocus
              rows={2}
              value={val}
              onChange={e => setVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); } }}
              className="w-full text-xs text-gray-700 border border-gray-200 rounded p-1 resize-none"
            />
            <div className="flex justify-center gap-1 mt-1">
              <button onClick={save} className="px-2 py-0.5 text-[10px] bg-[#8AA81E] text-white rounded">저장</button>
              <button onClick={() => { setVal(text); setEditing(false); }} className="px-2 py-0.5 text-[10px] bg-gray-200 rounded">취소</button>
            </div>
          </>
        ) : (
          <span onClick={() => setEditing(true)} className="cursor-pointer">{text}</span>
        )}
      </div>
      {!editing && (
        <>
          <div className="absolute -top-3 -right-2 hidden group-hover:flex gap-0.5 z-20">
            <button onClick={() => setEditing(true)} className="w-5 h-5 rounded-full bg-blue-500 text-white text-[9px] shadow flex items-center justify-center">✎</button>
            {onDelete && (
              <button onClick={onDelete} className="w-5 h-5 rounded-full bg-red-400 text-white text-[9px] shadow flex items-center justify-center">✕</button>
            )}
          </div>
          {(onAddSibling || onAddChild) && (
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 hidden group-hover:flex gap-1 z-20 whitespace-nowrap">
              {onAddSibling && (
                <button onClick={onAddSibling} className="text-[9px] bg-white border rounded px-1.5 py-0.5 text-gray-400 hover:text-[#5a7012] hover:border-[#8AA81E] shadow-sm">+형제</button>
              )}
              {onAddChild && (
                <button onClick={onAddChild} className="text-[9px] bg-white border rounded px-1.5 py-0.5 text-gray-400 hover:text-[#5a7012] hover:border-[#8AA81E] shadow-sm">+{childLabel}</button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Vertical connector ──────────────────────────────────────────────────
const VLine = ({ h = 40 }: { h?: number }) => (
  <div className="mx-auto w-0.5 bg-gray-300 flex-shrink-0" style={{ height: h }} />
);

// ── Level label ─────────────────────────────────────────────────────────
function LevelLabel({ text, color }: { text: string; color: string }) {
  return (
    <div className="flex justify-center mb-2">
      <span className={clsx('inline-flex items-center text-[10px] font-semibold rounded-full px-3 py-0.5 border', color)}>
        {text}
      </span>
    </div>
  );
}

// ── Outcome column with outputs ─────────────────────────────────────────
function OutcomeColumn({
  node,
  onUpdateNode,
  onDeleteNode,
  onAddSibling,
  onAddChild,
  canDelete,
}: {
  node: ObjectiveTreeNode;
  onUpdateNode: (id: string, text: string) => void;
  onDeleteNode: (id: string) => void;
  onAddSibling: (afterId: string) => void;
  onAddChild: (parentId: string) => void;
  canDelete: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <NodeBox
        text={node.text}
        variant="outcome"
        onUpdate={t => onUpdateNode(node.id, t)}
        onDelete={canDelete ? () => onDeleteNode(node.id) : undefined}
        onAddSibling={() => onAddSibling(node.id)}
        onAddChild={() => onAddChild(node.id)}
        childLabel="산출물"
      />
      {node.children && node.children.length > 0 && (
        <>
          <VLine h={24} />
          <div className="flex gap-2 flex-wrap justify-center" style={{ marginTop: 16 }}>
            {node.children.map(output => (
              <NodeBox
                key={output.id}
                text={output.text}
                variant="output"
                onUpdate={t => onUpdateNode(output.id, t)}
                onDelete={node.children!.length > 1 ? () => onDeleteNode(output.id) : undefined}
                onAddSibling={() => onAddSibling(output.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────

export function ObjectiveTreeVisual() {
  const { structure, setStructure, updateSection, ideation, project, ideationAnalysis, expertSessions, experts } = useProjectStore();
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);

  const tree = structure?.objectiveTree;
  const hasTree = !!(tree?.impact || tree?.purpose || (tree?.outcomes && tree.outcomes.length > 0));

  const updateTree = useCallback((patch: Partial<typeof tree>) => {
    if (!structure) return;
    setStructure({ ...structure, objectiveTree: { ...structure.objectiveTree!, ...patch } });
  }, [structure, setStructure]);

  // ── Outcome operations (deep) ──
  const updateOutcomeNode = (id: string, t: string) => updateTree({ outcomes: updateNodeText(tree!.outcomes, id, t) });
  const deleteOutcomeNode = (id: string) => updateTree({ outcomes: deleteNode(tree!.outcomes, id) });
  const addOutcomeSibling = (afterId: string) => {
    const idx = (tree?.outcomes || []).findIndex(n => n.id === afterId);
    if (idx !== -1) {
      const next = [...(tree?.outcomes || [])];
      next.splice(idx + 1, 0, { id: uid(), text: '(새 사업목적)', level: 'outcome', children: [] });
      updateTree({ outcomes: next });
    } else {
      updateTree({ outcomes: addSibling(tree!.outcomes, afterId, { id: uid(), text: '(새 사업목적)', level: 'outcome', children: [] }) });
    }
  };
  const addOutcomeChild = (parentId: string) => updateTree({ outcomes: addChild(tree!.outcomes, parentId, { id: uid(), text: '(새 산출물)', level: 'output' }) });
  const addOutcome = () => updateTree({ outcomes: [...(tree?.outcomes || []), { id: uid(), text: '(새 사업목적)', level: 'outcome' as const, children: [] }] });

  // ── AI generate ──
  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      const expertInsights = expertSessions
        .filter(s => s.messages.length > 0)
        .flatMap(s => {
          const expert = experts.find(e => e.id === s.expertId);
          return s.messages.filter(m => m.role === 'assistant').slice(-2)
            .map(m => `[${expert?.name || s.expertId}] ${m.content.slice(0, 200)}`);
        }).join('\n');

      const res = await fetch('/api/gni-an/proposal/objective-tree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: project?.title || '',
          country: project?.country || ideation?.country || '',
          field: project?.field || ideation?.field || '',
          idea: ideation?.idea || '',
          coreProblem: ideationAnalysis?.coreProblem || structure?.problemTree?.coreProblem || '',
          problemTree: structure?.problemTree ? JSON.stringify(structure.problemTree) : '',
          expertInsights,
        }),
      });
      const data = await res.json();
      if (data.success && data.tree) {
        const newStructure = structure
          ? { ...structure, objectiveTree: { ...structure.objectiveTree!, ...data.tree } }
          : { problemTree: { effects: [], coreProblem: '', causes: [] }, objectiveTree: { impact: '', purpose: '', outcomes: [], outputs: [], activities: [], ...data.tree }, pdm: [] };
        setStructure(newStructure);
        updateSection('basis-objective', JSON.stringify(data.tree), 'in-progress');
      }
    } catch { /* silent */ } finally {
      setGenerating(false);
    }
  }, [structure, setStructure, updateSection, ideation, project, ideationAnalysis, expertSessions, experts]);

  const handleComplete = () => {
    if (hasTree) {
      updateSection('basis-objective', JSON.stringify(tree), 'completed');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  // ── Generating state ──────────────────────────────────────────────────
  if (generating) {
    return (
      <div className="border border-[#D9E6B7] rounded-xl bg-[#F7F8F2] flex flex-col items-center justify-center gap-3 text-[#5a7012]" style={{ minHeight: 400 }}>
        <Loader2 size={28} className="animate-spin" />
        <p className="text-sm font-medium">AI가 목표나무를 생성하고 있습니다…</p>
        <p className="text-xs text-gray-400">잠시만 기다려 주세요 (10~20초)</p>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────
  if (!hasTree) {
    return (
      <div className="border-2 border-dashed border-[#D9E6B7] rounded-xl bg-[#F7F8F2] flex flex-col items-center justify-center gap-4 py-16">
        <div className="w-12 h-12 rounded-full bg-[#EEF5D6] flex items-center justify-center">
          <Sparkles size={22} className="text-[#8AA81E]" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-[#3b5c0a] mb-1">목표나무를 생성해주세요</p>
          <p className="text-xs text-gray-400">AI가 문제나무를 기반으로 목표나무 초안을 작성합니다</p>
        </div>
        <button
          onClick={handleGenerate}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#8AA81E] text-white text-sm font-medium rounded-xl shadow-sm hover:bg-[#7a9419] transition-colors"
        >
          <Sparkles size={14} /> AI로 목표나무 생성
        </button>
        <p className="text-[10px] text-gray-300">문제나무(문제분석)를 먼저 작성하면 더 정확한 목표나무가 생성됩니다</p>
      </div>
    );
  }

  const outcomes = tree?.outcomes || [];

  // ── Tree view ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-1">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400">노드를 클릭하면 편집, 호버하면 추가/삭제 버튼이 나타납니다</p>
        <button
          onClick={handleGenerate}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#5a7012] border border-gray-200 hover:border-[#8AA81E] rounded-lg px-2.5 py-1.5 transition-colors"
        >
          <RefreshCw size={11} /> AI 재생성
        </button>
      </div>

      {/* Tree container */}
      <div className="border border-[#D9E6B7] rounded-xl bg-white px-4 py-8 overflow-x-auto">
        <div className="min-w-[580px] flex flex-col items-center select-none">

          {/* ── Impact ── */}
          <LevelLabel text="영향 (Impact / Goal)" color="text-purple-700 bg-purple-50 border-purple-200" />
          <NodeBox
            text={tree?.impact || '(영향 목표 없음)'}
            variant="impact"
            onUpdate={t => updateTree({ impact: t })}
          />

          <VLine h={36} />

          {/* ── Purpose ── */}
          <LevelLabel text="사업목적 (Purpose / Outcome)" color="text-blue-700 bg-blue-50 border-blue-200" />
          <NodeBox
            text={tree?.purpose || '(사업목적 없음)'}
            variant="purpose"
            onUpdate={t => updateTree({ purpose: t })}
          />

          <VLine h={36} />

          {/* ── Outcomes (성과/산출목적) ── */}
          <LevelLabel text="성과 (Outcomes)" color="text-[#5a7012] bg-[#EEF5D6] border-[#8AA81E]" />
          <div className="flex gap-8 flex-wrap justify-center pt-6">
            {outcomes.map(oc => (
              <OutcomeColumn
                key={oc.id}
                node={oc}
                onUpdateNode={updateOutcomeNode}
                onDeleteNode={deleteOutcomeNode}
                onAddSibling={addOutcomeSibling}
                onAddChild={addOutcomeChild}
                canDelete={outcomes.length > 1}
              />
            ))}
            {outcomes.length === 0 && (
              <button onClick={addOutcome} className="text-xs text-[#5a7012] border border-dashed border-[#8AA81E] rounded-xl px-4 py-2 mt-6">+ 성과 추가</button>
            )}
          </div>

          {/* Add button */}
          <div className="flex gap-3 mt-10 pt-4 border-t border-gray-100 w-full justify-center">
            <button onClick={addOutcome} className="text-xs text-[#5a7012] border border-[#D9E6B7] rounded-lg px-3 py-1.5 hover:bg-[#EEF5D6]">+ 성과 추가</button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-400">목표나무는 사업 구조화 데이터와 연동됩니다</p>
        <button
          onClick={handleComplete}
          disabled={!hasTree}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-[#F7F8F2] hover:border-[#8AA81E] hover:text-[#5a7012] disabled:opacity-40 transition-colors"
        >
          {saved ? <><Check size={12} className="text-[#8AA81E]" /> 저장됨</> : '완료 표시'}
        </button>
      </div>
    </div>
  );
}
