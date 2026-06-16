'use client';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useProjectStore } from '@/lib/store/projectStore';
import type { ObjectiveTreeNode } from '@/types';
import { Loader2, Sparkles, RefreshCw, Check, PenLine } from 'lucide-react';
import { clsx } from 'clsx';
import { RichTextEditor } from '@/components/editors/RichTextEditor';

function uid() {
  return `o${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

// ── Tree helpers ─────────────────────────────────────────────────────────

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
  return nodes.map(n => n.children?.length ? { ...n, children: addSibling(n.children, afterId, newNode) } : n);
}

function addChild(nodes: ObjectiveTreeNode[], parentId: string, newChild: ObjectiveTreeNode): ObjectiveTreeNode[] {
  return nodes.map(n => {
    if (n.id === parentId) return { ...n, children: [...(n.children || []), newChild] };
    if (n.children?.length) return { ...n, children: addChild(n.children, parentId, newChild) };
    return n;
  });
}

// ── SVG line calc ─────────────────────────────────────────────────────────

type Pt = { cx: number; top: number; bottom: number };

function calcObjLines(
  containerRect: DOMRect,
  impactEl: HTMLDivElement | null,
  purposeEl: HTMLDivElement | null,
  nodeEls: Map<string, HTMLDivElement>,
  outcomes: ObjectiveTreeNode[],
): string[] {
  const get = (id: string): Pt | null => {
    const el = id === 'impact' ? impactEl : id === 'purpose' ? purposeEl : nodeEls.get(id);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width === 0) return null;
    return { cx: r.left - containerRect.left + r.width / 2, top: r.top - containerRect.top, bottom: r.bottom - containerRect.top };
  };

  const paths: string[] = [];

  // Impact → Purpose
  const ip = get('impact'), pp = get('purpose');
  if (ip && pp) {
    const jY = ip.bottom + (pp.top - ip.bottom) * 0.5;
    paths.push(`M ${ip.cx} ${ip.bottom} L ${ip.cx} ${jY} L ${pp.cx} ${jY} L ${pp.cx} ${pp.top}`);
  }

  // Purpose → Outcomes (diverge)
  if (pp && outcomes.length > 0) {
    const cs = outcomes.map(oc => get(oc.id)).filter(Boolean) as Pt[];
    if (cs.length) {
      const maxTop = Math.min(...cs.map(c => c.top));
      const jY = pp.bottom + (maxTop - pp.bottom) * 0.42;
      paths.push(`M ${pp.cx} ${pp.bottom} L ${pp.cx} ${jY}`);
      if (cs.length === 1) {
        paths.push(`M ${pp.cx} ${jY} L ${cs[0].cx} ${jY} L ${cs[0].cx} ${cs[0].top}`);
      } else {
        const lx = Math.min(...cs.map(c => c.cx)), rx = Math.max(...cs.map(c => c.cx));
        paths.push(`M ${lx} ${jY} L ${rx} ${jY}`);
        cs.forEach(c => paths.push(`M ${c.cx} ${jY} L ${c.cx} ${c.top}`));
      }
    }
  }

  // Each Outcome → its outputs (diverge)
  outcomes.forEach(oc => {
    if (!oc.children?.length) return;
    const op = get(oc.id); if (!op) return;
    const cs = oc.children.map(out => get(out.id)).filter(Boolean) as Pt[];
    if (!cs.length) return;
    const maxTop = Math.min(...cs.map(c => c.top));
    const jY = op.bottom + (maxTop - op.bottom) * 0.42;
    paths.push(`M ${op.cx} ${op.bottom} L ${op.cx} ${jY}`);
    if (cs.length === 1) {
      paths.push(`M ${op.cx} ${jY} L ${cs[0].cx} ${jY} L ${cs[0].cx} ${cs[0].top}`);
    } else {
      const lx = Math.min(...cs.map(c => c.cx)), rx = Math.max(...cs.map(c => c.cx));
      paths.push(`M ${lx} ${jY} L ${rx} ${jY}`);
      cs.forEach(c => paths.push(`M ${c.cx} ${jY} L ${c.cx} ${c.top}`));
    }
  });

  return paths;
}

// ── Node Box ─────────────────────────────────────────────────────────────

function NodeBox({
  boxRef, text, variant, onUpdate, onDelete, onAddSibling, onAddChild, childLabel = '하위',
}: {
  boxRef?: (el: HTMLDivElement | null) => void;
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
  const save = () => { const t = val.trim(); if (t) onUpdate(t); setEditing(false); };

  const variantCls = {
    impact: 'bg-purple-50 border-purple-300 text-purple-800 min-w-[240px] py-4 font-semibold text-sm',
    purpose: 'bg-blue-50 border-blue-300 text-blue-800 min-w-[220px] py-3 font-medium',
    outcome: 'bg-[#EEF5D6] border-[#8AA81E] text-[#3b5c0a] min-w-[130px] max-w-[190px]',
    output: 'bg-emerald-50 border-emerald-200 text-emerald-700 min-w-[110px] max-w-[170px] text-[10px]',
  }[variant];

  return (
    <div ref={boxRef} className="group relative" style={{ zIndex: 5 }}>
      <div className={clsx('border-2 rounded-xl px-3 py-2.5 text-center text-xs leading-snug shadow-sm transition-all hover:shadow-md', variantCls)}>
        {editing ? (
          <>
            <textarea autoFocus rows={2} value={val} onChange={e => setVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); } }}
              className="w-full text-xs text-gray-700 border border-gray-200 rounded p-1 resize-none" />
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
            {onDelete && <button onClick={onDelete} className="w-5 h-5 rounded-full bg-red-400 text-white text-[9px] shadow flex items-center justify-center">✕</button>}
          </div>
          {(onAddSibling || onAddChild) && (
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 hidden group-hover:flex gap-1 z-20 whitespace-nowrap">
              {onAddSibling && <button onClick={onAddSibling} className="text-[9px] bg-white border rounded px-1.5 py-0.5 text-gray-400 hover:text-[#5a7012] hover:border-[#8AA81E] shadow-sm">+형제</button>}
              {onAddChild && <button onClick={onAddChild} className="text-[9px] bg-white border rounded px-1.5 py-0.5 text-gray-400 hover:text-[#5a7012] hover:border-[#8AA81E] shadow-sm">+{childLabel}</button>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LevelLabel({ text, color }: { text: string; color: string }) {
  return (
    <div className="flex justify-center mb-2">
      <span className={clsx('inline-flex items-center text-[10px] font-semibold rounded-full px-3 py-0.5 border', color)}>{text}</span>
    </div>
  );
}

// ── Outcome column with outputs ──────────────────────────────────────────
function OutcomeColumn({
  node, nodeEls, onUpdateNode, onDeleteNode, onAddSibling, onAddChild, canDelete,
}: {
  node: ObjectiveTreeNode;
  nodeEls: React.MutableRefObject<Map<string, HTMLDivElement>>;
  onUpdateNode: (id: string, text: string) => void;
  onDeleteNode: (id: string) => void;
  onAddSibling: (afterId: string) => void;
  onAddChild: (parentId: string) => void;
  canDelete: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <NodeBox
        boxRef={el => { if (el) nodeEls.current.set(node.id, el); else nodeEls.current.delete(node.id); }}
        text={node.text} variant="outcome"
        onUpdate={t => onUpdateNode(node.id, t)}
        onDelete={canDelete ? () => onDeleteNode(node.id) : undefined}
        onAddSibling={() => onAddSibling(node.id)}
        onAddChild={() => onAddChild(node.id)}
        childLabel="산출물"
      />
      {node.children && node.children.length > 0 && (
        <div className="flex gap-2 flex-wrap justify-center" style={{ marginTop: 44 }}>
          {node.children.map(output => (
            <NodeBox
              key={output.id}
              boxRef={el => { if (el) nodeEls.current.set(output.id, el); else nodeEls.current.delete(output.id); }}
              text={output.text} variant="output"
              onUpdate={t => onUpdateNode(output.id, t)}
              onDelete={node.children!.length > 1 ? () => onDeleteNode(output.id) : undefined}
              onAddSibling={() => onAddSibling(output.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────

export function ObjectiveTreeVisual() {
  const { structure, setStructure, updateSection, updateSectionAiDraft, sections,
    ideation, project, ideationAnalysis, expertSessions, experts } = useProjectStore();

  const [generating, setGenerating] = useState(false);
  const [generatingText, setGeneratingText] = useState(false);
  const [saved, setSaved] = useState(false);
  const [viewMode, setViewMode] = useState<'ai' | 'user'>('user');

  const treeContainerRef = useRef<HTMLDivElement>(null);
  const impactRef = useRef<HTMLDivElement>(null);
  const purposeRef = useRef<HTMLDivElement>(null);
  const nodeEls = useRef<Map<string, HTMLDivElement>>(new Map());
  const [svgPaths, setSvgPaths] = useState<string[]>([]);
  const [svgH, setSvgH] = useState(600);

  const tree = structure?.objectiveTree;
  const hasTree = !!(tree?.impact || tree?.purpose || (tree?.outcomes && tree.outcomes.length > 0));
  const textContent = sections['basis-objective']?.content || '';
  const aiDraft = sections['basis-objective']?.aiDraft || '';

  // ── Recalculate SVG lines ─────────────────────────────────────────────
  const recalc = useCallback(() => {
    const container = treeContainerRef.current;
    if (!container) return;
    const cr = container.getBoundingClientRect();
    if (cr.width === 0) return;
    const paths = calcObjLines(cr, impactRef.current, purposeRef.current, nodeEls.current, tree?.outcomes || []);
    setSvgPaths(paths);
    setSvgH(container.scrollHeight + 10);
  }, [tree]);

  useEffect(() => {
    const t1 = setTimeout(recalc, 80);
    const t2 = setTimeout(recalc, 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [tree, recalc]);

  // ── Update tree ───────────────────────────────────────────────────────
  const updateTree = useCallback((patch: Partial<typeof tree>) => {
    if (!structure) return;
    setStructure({ ...structure, objectiveTree: { ...structure.objectiveTree!, ...patch } });
  }, [structure, setStructure]);

  const updateOutcomeNode = (id: string, t: string) => updateTree({ outcomes: updateNodeText(tree!.outcomes, id, t) });
  const deleteOutcomeNode = (id: string) => updateTree({ outcomes: deleteNode(tree!.outcomes, id) });
  const addOutcomeSibling = (afterId: string) => {
    const idx = (tree?.outcomes || []).findIndex(n => n.id === afterId);
    if (idx !== -1) {
      const next = [...(tree?.outcomes || [])];
      next.splice(idx + 1, 0, { id: uid(), text: '(새 성과)', level: 'outcome', children: [] });
      updateTree({ outcomes: next });
    } else {
      updateTree({ outcomes: addSibling(tree!.outcomes, afterId, { id: uid(), text: '(새 성과)', level: 'outcome', children: [] }) });
    }
  };
  const addOutcomeChild = (parentId: string) => updateTree({ outcomes: addChild(tree!.outcomes, parentId, { id: uid(), text: '(새 산출물)', level: 'output' }) });
  const addOutcome = () => updateTree({ outcomes: [...(tree?.outcomes || []), { id: uid(), text: '(새 성과)', level: 'outcome' as const, children: [] }] });

  // ── Build context ─────────────────────────────────────────────────────
  const buildCtx = useCallback(() => {
    const expertInsights = expertSessions
      .filter(s => s.messages.length > 0)
      .flatMap(s => {
        const ex = experts.find(e => e.id === s.expertId);
        return s.messages.filter(m => m.role === 'assistant').slice(-2)
          .map(m => `[${ex?.name || s.expertId}] ${m.content.slice(0, 200)}`);
      }).join('\n');
    return {
      title: project?.title || '',
      country: project?.country || ideation?.country || '',
      region: (project as any)?.region || ideation?.subRegion || '',
      field: project?.field || ideation?.field || '',
      idea: ideation?.idea || '',
      coreProblem: ideationAnalysis?.coreProblem || structure?.problemTree?.coreProblem || '',
      targetBeneficiaries: ideationAnalysis?.targetBeneficiaries || '',
      interventionApproach: ideationAnalysis?.interventionApproach || '',
      expectedOutcomes: ideationAnalysis?.expectedOutcomes || '',
      problemTree: structure?.problemTree ? JSON.stringify(structure.problemTree) : '',
      objectiveTree: structure?.objectiveTree ? JSON.stringify({ impact: structure.objectiveTree.impact, purpose: structure.objectiveTree.purpose, outcomes: structure.objectiveTree.outcomes }) : '',
      expertInsights,
      projectSummary: (ideationAnalysis as any)?.summary || ideation?.idea?.slice(0, 500) || '',
    };
  }, [project, ideation, ideationAnalysis, structure, expertSessions, experts]);

  // ── AI generate tree ──────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      const ctx = buildCtx();
      const res = await fetch('/api/gni-an/proposal/objective-tree', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ctx),
      });
      const data = await res.json();
      if (data.success && data.tree) {
        const newStructure = structure
          ? { ...structure, objectiveTree: { ...structure.objectiveTree!, ...data.tree } }
          : { problemTree: { effects: [], coreProblem: '', causes: [] }, objectiveTree: { impact: '', purpose: '', outcomes: [], outputs: [], activities: [], ...data.tree }, pdm: [] };
        setStructure(newStructure);
      }
    } catch { /* silent */ } finally { setGenerating(false); }
  }, [structure, setStructure, buildCtx]);

  // ── AI generate text ──────────────────────────────────────────────────
  const handleGenerateText = useCallback(async () => {
    setGeneratingText(true);
    try {
      const ctx = buildCtx();
      const res = await fetch('/api/gni-an/proposal/section/draft', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId: 'basis-objective', projectContext: ctx }),
      });
      const data = await res.json();
      if (data.success && data.html) {
        updateSectionAiDraft('basis-objective', data.html);
        setViewMode('ai');
      }
    } catch { /* silent */ } finally { setGeneratingText(false); }
  }, [buildCtx, updateSectionAiDraft]);

  const handleUseAiDraft = () => {
    if (aiDraft) { updateSection('basis-objective', aiDraft, 'in-progress'); setViewMode('user'); }
  };

  const handleTextChange = useCallback((html: string) => {
    const n = html.replace(/<[^>]*>/g, '').length;
    updateSection('basis-objective', html, n > 0 ? 'in-progress' : 'empty');
  }, [updateSection]);

  const handleComplete = () => {
    if (hasTree) {
      const content = textContent || JSON.stringify(tree);
      updateSection('basis-objective', content, 'completed');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────
  if (generating) return (
    <div className="border border-[#D9E6B7] rounded-xl bg-[#F7F8F2] flex flex-col items-center justify-center gap-3 text-[#5a7012]" style={{ minHeight: 400 }}>
      <Loader2 size={28} className="animate-spin" />
      <p className="text-sm font-medium">AI가 목표나무를 생성하고 있습니다…</p>
      <p className="text-xs text-gray-400">잠시만 기다려 주세요 (10~20초)</p>
    </div>
  );

  // ── Empty ─────────────────────────────────────────────────────────────
  if (!hasTree) return (
    <div className="border-2 border-dashed border-[#D9E6B7] rounded-xl bg-[#F7F8F2] flex flex-col items-center justify-center gap-4 py-16">
      <div className="w-12 h-12 rounded-full bg-[#EEF5D6] flex items-center justify-center">
        <Sparkles size={22} className="text-[#8AA81E]" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-[#3b5c0a] mb-1">목표나무를 생성해주세요</p>
        <p className="text-xs text-gray-400">AI가 문제나무를 기반으로 목표나무 초안을 작성합니다</p>
      </div>
      <button onClick={handleGenerate} className="flex items-center gap-2 px-5 py-2.5 bg-[#8AA81E] text-white text-sm font-medium rounded-xl shadow-sm hover:bg-[#7a9419] transition-colors">
        <Sparkles size={14} /> AI로 목표나무 생성
      </button>
      <p className="text-[10px] text-gray-300">문제나무(문제분석)를 먼저 작성하면 더 정확한 목표나무가 생성됩니다</p>
    </div>
  );

  const outcomes = tree?.outcomes || [];

  // ── Tree view ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">노드 클릭 편집 · 호버 시 추가/삭제</p>
        <button onClick={handleGenerate} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#5a7012] border border-gray-200 hover:border-[#8AA81E] rounded-lg px-2.5 py-1.5 transition-colors">
          <RefreshCw size={11} /> AI 재생성
        </button>
      </div>

      {/* ── Visual tree ── */}
      <div className="border border-[#D9E6B7] rounded-xl bg-white px-6 py-8 overflow-x-auto">
        <div ref={treeContainerRef} className="relative select-none" style={{ minWidth: 580, minHeight: 460 }}>

          {/* SVG overlay */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: svgH, pointerEvents: 'none', overflow: 'visible', zIndex: 1 }}>
            {svgPaths.map((d, i) => (
              <path key={i} d={d} stroke="#CBD5E1" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ))}
          </svg>

          <div className="flex flex-col items-center" style={{ position: 'relative', zIndex: 2 }}>

            {/* Impact */}
            <LevelLabel text="영향 (Impact / Goal)" color="text-purple-700 bg-purple-50 border-purple-200" />
            <div ref={impactRef}>
              <NodeBox text={tree?.impact || '(영향 목표)'} variant="impact" onUpdate={t => updateTree({ impact: t })} />
            </div>

            {/* Purpose */}
            <div style={{ marginTop: 48 }}>
              <LevelLabel text="사업목적 (Purpose / Outcome)" color="text-blue-700 bg-blue-50 border-blue-200" />
              <div ref={purposeRef}>
                <NodeBox text={tree?.purpose || '(사업목적)'} variant="purpose" onUpdate={t => updateTree({ purpose: t })} />
              </div>
            </div>

            {/* Outcomes */}
            <div style={{ marginTop: 52 }}>
              <LevelLabel text="성과 (Outcomes) → 산출물 (Outputs)" color="text-[#5a7012] bg-[#EEF5D6] border-[#8AA81E]" />
              <div className="flex gap-8 flex-wrap justify-center pt-2">
                {outcomes.map(oc => (
                  <OutcomeColumn
                    key={oc.id}
                    node={oc}
                    nodeEls={nodeEls}
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
            </div>

            {/* Add button */}
            <div className="flex gap-3 mt-12 pt-4 border-t border-gray-100 w-full justify-center">
              <button onClick={addOutcome} className="text-xs text-[#5a7012] border border-[#D9E6B7] rounded-lg px-3 py-1.5 hover:bg-[#EEF5D6]">+ 성과 추가</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Text description ── */}
      <div className="border border-[#D9E6B7] rounded-xl bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-[#3b5c0a]">목표분석 서술</h4>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-[#D9E6B7] bg-[#F7F8F2] p-0.5 gap-0.5">
              <button onClick={() => setViewMode('ai')} className={clsx('flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded-md transition-all', viewMode === 'ai' ? 'bg-white text-[#5a7012] shadow-sm' : 'text-gray-400 hover:text-[#5a7012]')}>
                <Sparkles size={9} />AI 초안
              </button>
              <button onClick={() => setViewMode('user')} className={clsx('flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded-md transition-all', viewMode === 'user' ? 'bg-white text-[#5a7012] shadow-sm' : 'text-gray-400 hover:text-[#5a7012]')}>
                <PenLine size={9} />내 작성
              </button>
            </div>
            <button onClick={handleGenerateText} disabled={generatingText}
              className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-[#5a7012] border border-gray-200 hover:border-[#8AA81E] rounded-lg px-2 py-1 transition-colors disabled:opacity-50">
              {generatingText ? <Loader2 size={9} className="animate-spin" /> : <RefreshCw size={9} />}
              {generatingText ? '생성 중…' : 'AI 텍스트 생성'}
            </button>
          </div>
        </div>

        {generatingText ? (
          <div className="flex items-center justify-center gap-2 py-12 text-[#5a7012]">
            <Loader2 size={18} className="animate-spin" /><span className="text-sm">목표분석 텍스트 작성 중…</span>
          </div>
        ) : viewMode === 'ai' && aiDraft ? (
          <>
            <div className="border border-[#D9E6B7] rounded-lg bg-[#F7F8F2] px-5 py-4 text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: aiDraft }} />
            <div className="flex justify-end mt-2">
              <button onClick={handleUseAiDraft} className="text-xs text-[#5a7012] border border-[#D9E6B7] bg-white rounded-lg px-3 py-1.5 hover:bg-[#EEF5D6] transition-colors">이 초안으로 편집 시작 →</button>
            </div>
          </>
        ) : viewMode === 'ai' ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-400">
            <Sparkles size={20} />
            <p className="text-xs">목표나무 생성 후 'AI 텍스트 생성' 버튼을 눌러주세요</p>
          </div>
        ) : (
          <RichTextEditor content={textContent} onChange={handleTextChange} minHeight={280} />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-1">
        <p className="text-xs text-gray-400">목표나무 + 텍스트 서술이 PDF에 포함됩니다</p>
        <button onClick={handleComplete} disabled={!hasTree}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-[#F7F8F2] hover:border-[#8AA81E] hover:text-[#5a7012] disabled:opacity-40 transition-colors">
          {saved ? <><Check size={12} className="text-[#8AA81E]" /> 저장됨</> : '완료 표시'}
        </button>
      </div>
    </div>
  );
}
