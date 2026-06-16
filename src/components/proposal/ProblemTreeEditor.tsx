'use client';
import React, { useState, useCallback } from 'react';
import { useProjectStore } from '@/lib/store/projectStore';
import type { ProblemTreeNode } from '@/types';
import { Loader2, Sparkles, RefreshCw, Check } from 'lucide-react';
import { clsx } from 'clsx';

function uid() {
  return `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

// ── Tree helper functions ───────────────────────────────────────────────

function updateNodeText(nodes: ProblemTreeNode[], id: string, text: string): ProblemTreeNode[] {
  return nodes.map(n => {
    if (n.id === id) return { ...n, text };
    if (n.children?.length) return { ...n, children: updateNodeText(n.children, id, text) };
    return n;
  });
}

function deleteNode(nodes: ProblemTreeNode[], id: string): ProblemTreeNode[] {
  return nodes
    .filter(n => n.id !== id)
    .map(n => n.children?.length ? { ...n, children: deleteNode(n.children, id) } : n);
}

function addSibling(nodes: ProblemTreeNode[], afterId: string, newNode: ProblemTreeNode): ProblemTreeNode[] {
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

function addChild(nodes: ProblemTreeNode[], parentId: string, newChild: ProblemTreeNode): ProblemTreeNode[] {
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
  variant: 'effect' | 'core' | 'cause' | 'sub' | 'root';
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
    effect: 'bg-red-50 border-red-300 text-red-800 min-w-[100px] max-w-[160px]',
    core: 'bg-[#EEF5D6] border-[#8AA81E] text-[#3b5c0a] min-w-[240px] py-4 font-semibold text-sm',
    cause: 'bg-amber-50 border-amber-300 text-amber-800 min-w-[110px] max-w-[170px]',
    sub: 'bg-yellow-50 border-yellow-200 text-yellow-700 min-w-[90px] max-w-[150px] text-[10px]',
    root: 'bg-orange-50 border-orange-200 text-orange-700 min-w-[80px] max-w-[140px] text-[10px]',
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

// ── Recursive sub-cause renderer ────────────────────────────────────────
function CauseColumn({
  node,
  depth,
  onUpdateNode,
  onDeleteNode,
  onAddSibling,
  onAddChild,
  canDelete,
}: {
  node: ProblemTreeNode;
  depth: number;
  onUpdateNode: (id: string, text: string) => void;
  onDeleteNode: (id: string) => void;
  onAddSibling: (afterId: string) => void;
  onAddChild: (parentId: string) => void;
  canDelete: boolean;
}) {
  const variant = depth === 0 ? 'cause' : depth === 1 ? 'sub' : 'root';
  const childLabel = depth === 0 ? '세부원인' : '근본원인';
  const showAddChild = depth < 2;

  return (
    <div className="flex flex-col items-center" style={{ marginTop: depth > 0 ? 16 : 0 }}>
      <NodeBox
        text={node.text}
        variant={variant}
        onUpdate={t => onUpdateNode(node.id, t)}
        onDelete={canDelete ? () => onDeleteNode(node.id) : undefined}
        onAddSibling={() => onAddSibling(node.id)}
        onAddChild={showAddChild ? () => onAddChild(node.id) : undefined}
        childLabel={childLabel}
      />
      {node.children && node.children.length > 0 && (
        <>
          <VLine h={24} />
          <div className="flex gap-2 flex-wrap justify-center">
            {node.children.map(child => (
              <CauseColumn
                key={child.id}
                node={child}
                depth={depth + 1}
                onUpdateNode={onUpdateNode}
                onDeleteNode={onDeleteNode}
                onAddSibling={onAddSibling}
                onAddChild={onAddChild}
                canDelete={node.children!.length > 1}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────

export function ProblemTreeEditor() {
  const { structure, setStructure, updateSection, ideation, project, ideationAnalysis, expertSessions, experts } = useProjectStore();
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);

  const tree = structure?.problemTree;
  const hasTree = !!tree?.coreProblem;

  const updateTree = useCallback((patch: Partial<typeof tree>) => {
    if (!structure) return;
    setStructure({ ...structure, problemTree: { ...structure.problemTree!, ...patch } });
  }, [structure, setStructure]);

  // ── Effect operations ──
  const updateEffect = (id: string, t: string) => updateTree({ effects: updateNodeText(tree!.effects, id, t) });
  const deleteEffect = (id: string) => updateTree({ effects: deleteNode(tree!.effects, id) });
  const addEffectSibling = (afterId: string) => updateTree({ effects: addSibling(tree!.effects, afterId, { id: uid(), text: '(새 결과/영향)' }) });
  const addEffect = () => updateTree({ effects: [...(tree?.effects || []), { id: uid(), text: '(새 결과/영향)' }] });

  // ── Cause operations (deep) ──
  const updateCauseNode = (id: string, t: string) => updateTree({ causes: updateNodeText(tree!.causes, id, t) });
  const deleteCauseNode = (id: string) => updateTree({ causes: deleteNode(tree!.causes, id) });
  const addCauseSibling = (afterId: string) => updateTree({ causes: addSibling(tree!.causes, afterId, { id: uid(), text: '(새 원인)', children: [] }) });
  const addCauseChild = (parentId: string) => updateTree({ causes: addChild(tree!.causes, parentId, { id: uid(), text: '(새 세부 원인)', children: [] }) });
  const addCause = () => updateTree({ causes: [...(tree?.causes || []), { id: uid(), text: '(새 직접 원인)', children: [] }] });

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

      const res = await fetch('/api/gni-an/proposal/problem-tree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: project?.title || '',
          country: project?.country || ideation?.country || '',
          region: project?.region || ideation?.subRegion || '',
          field: project?.field || ideation?.field || '',
          idea: ideation?.idea || '',
          coreProblem: ideationAnalysis?.coreProblem || '',
          targetBeneficiaries: ideationAnalysis?.targetBeneficiaries || '',
          expertInsights,
        }),
      });
      const data = await res.json();
      if (data.success && data.tree) {
        const newStructure = structure
          ? { ...structure, problemTree: data.tree }
          : { problemTree: data.tree, objectiveTree: { impact: '', purpose: '', outcomes: [], outputs: [], activities: [] }, pdm: [] };
        setStructure(newStructure);
        updateSection('basis-problem', JSON.stringify(data.tree), 'in-progress');
      }
    } catch { /* silent */ } finally {
      setGenerating(false);
    }
  }, [structure, setStructure, updateSection, ideation, project, ideationAnalysis, expertSessions, experts]);

  const handleComplete = () => {
    if (tree?.coreProblem) {
      updateSection('basis-problem', JSON.stringify(tree), 'completed');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  // ── Generating state ──────────────────────────────────────────────────
  if (generating) {
    return (
      <div className="border border-[#D9E6B7] rounded-xl bg-[#F7F8F2] flex flex-col items-center justify-center gap-3 text-[#5a7012]" style={{ minHeight: 400 }}>
        <Loader2 size={28} className="animate-spin" />
        <p className="text-sm font-medium">AI가 문제나무를 생성하고 있습니다…</p>
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
          <p className="text-sm font-semibold text-[#3b5c0a] mb-1">문제나무를 생성해주세요</p>
          <p className="text-xs text-gray-400">AI가 사업 컨텍스트를 분석하여 문제나무 초안을 작성합니다</p>
        </div>
        <button
          onClick={handleGenerate}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#8AA81E] text-white text-sm font-medium rounded-xl shadow-sm hover:bg-[#7a9419] transition-colors"
        >
          <Sparkles size={14} /> AI로 문제나무 생성
        </button>
        <p className="text-[10px] text-gray-300">또는 사업 구조화 단계에서 문제나무를 작성하면 자동으로 반영됩니다</p>
      </div>
    );
  }

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
        <div className="min-w-[600px] flex flex-col items-center select-none">

          {/* ── Effects (결과/영향) ── */}
          <LevelLabel text="↑ 결과 / 영향 (Effects)" color="text-red-600 bg-red-50 border-red-200" />
          <div className="flex gap-3 flex-wrap justify-center pb-10">
            {tree.effects.map(e => (
              <NodeBox
                key={e.id}
                text={e.text}
                variant="effect"
                onUpdate={t => updateEffect(e.id, t)}
                onDelete={tree.effects.length > 1 ? () => deleteEffect(e.id) : undefined}
                onAddSibling={() => addEffectSibling(e.id)}
              />
            ))}
            {tree.effects.length === 0 && (
              <button onClick={addEffect} className="text-xs text-red-400 border border-dashed border-red-200 rounded-xl px-4 py-2">+ 결과 추가</button>
            )}
          </div>

          {/* Connector */}
          <VLine h={36} />

          {/* ── Core Problem ── */}
          <LevelLabel text="핵심 문제 (Core Problem)" color="text-[#5a7012] bg-[#EEF5D6] border-[#8AA81E]" />
          <NodeBox
            text={tree.coreProblem}
            variant="core"
            onUpdate={t => updateTree({ coreProblem: t })}
          />

          {/* Connector */}
          <VLine h={36} />

          {/* ── Causes (원인) ── */}
          <LevelLabel text="↓ 직접 원인 (Immediate Causes)" color="text-amber-700 bg-amber-50 border-amber-200" />
          <div className="flex gap-6 flex-wrap justify-center pt-6">
            {tree.causes.map(c => (
              <CauseColumn
                key={c.id}
                node={c}
                depth={0}
                onUpdateNode={updateCauseNode}
                onDeleteNode={deleteCauseNode}
                onAddSibling={addCauseSibling}
                onAddChild={addCauseChild}
                canDelete={tree.causes.length > 1}
              />
            ))}
            {tree.causes.length === 0 && (
              <button onClick={addCause} className="text-xs text-amber-600 border border-dashed border-amber-200 rounded-xl px-4 py-2 mt-6">+ 원인 추가</button>
            )}
          </div>

          {/* Add buttons */}
          <div className="flex gap-3 mt-10 pt-4 border-t border-gray-100 w-full justify-center">
            <button onClick={addEffect} className="text-xs text-red-500 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50">+ 결과 추가</button>
            <button onClick={addCause} className="text-xs text-amber-600 border border-amber-200 rounded-lg px-3 py-1.5 hover:bg-amber-50">+ 직접 원인 추가</button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-400">문제나무는 사업 구조화 데이터와 연동됩니다</p>
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
