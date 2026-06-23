'use client';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useProjectStore } from '@/lib/store/projectStore';
import type { ProblemTreeNode } from '@/types';
import { Loader2, Sparkles, RefreshCw, Check, PenLine } from 'lucide-react';
import { clsx } from 'clsx';
import { RichTextEditor } from '@/components/editors/RichTextEditor';
import { CitationHtml } from '@/components/proposal/CitationHtml';

function uid() {
  return `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

// ── Tree helpers ─────────────────────────────────────────────────────────

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
    const next = [...nodes]; next.splice(idx + 1, 0, newNode); return next;
  }
  return nodes.map(n => n.children?.length ? { ...n, children: addSibling(n.children, afterId, newNode) } : n);
}

function addChild(nodes: ProblemTreeNode[], parentId: string, child: ProblemTreeNode): ProblemTreeNode[] {
  return nodes.map(n => {
    if (n.id === parentId) return { ...n, children: [...(n.children || []), child] };
    if (n.children?.length) return { ...n, children: addChild(n.children, parentId, child) };
    return n;
  });
}

// ── Node Box ─────────────────────────────────────────────────────────────

function NodeBox({
  boxRef, text, variant, onUpdate, onDelete, onAddSibling, onAddChild, childLabel = '하위',
}: {
  boxRef?: (el: HTMLDivElement | null) => void;
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
  const save = () => { const t = val.trim(); if (t) onUpdate(t); setEditing(false); };

  const cls = {
    effect: 'bg-red-50 border-red-300 text-red-800 min-w-[96px] max-w-[150px]',
    core: 'bg-[#EEF5D6] border-[#8AA81E] text-[#3b5c0a] min-w-[240px] py-4 font-semibold text-sm',
    cause: 'bg-amber-50 border-amber-300 text-amber-800 min-w-[100px] max-w-[160px]',
    sub: 'bg-yellow-50 border-yellow-200 text-yellow-700 min-w-[80px] max-w-[140px] text-[10px]',
    root: 'bg-orange-50 border-orange-200 text-orange-700 min-w-[72px] max-w-[130px] text-[10px]',
  }[variant];

  return (
    <div ref={boxRef} className="group relative" style={{ zIndex: 5 }}>
      <div className={clsx('border-2 rounded-xl px-3 py-2.5 text-center text-xs leading-snug shadow-sm transition-all hover:shadow-md', cls)}>
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
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-1.5 hidden group-hover:flex flex-col gap-1 z-20 whitespace-nowrap">
              {onAddSibling && <button onClick={onAddSibling} className="text-[10px] bg-white border rounded px-2.5 py-1 text-gray-400 hover:text-[#5a7012] hover:border-[#8AA81E] shadow-sm">+추가</button>}
              {onAddChild && <button onClick={onAddChild} className="text-[10px] bg-white border rounded px-2.5 py-1 text-gray-400 hover:text-[#5a7012] hover:border-[#8AA81E] shadow-sm">+{childLabel}</button>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Level label ──────────────────────────────────────────────────────────
function LevelLabel({ text, color }: { text: string; color: string }) {
  return (
    <div className="flex justify-center mb-2">
      <span className={clsx('inline-flex items-center text-[10px] font-semibold rounded-full px-3 py-0.5 border', color)}>{text}</span>
    </div>
  );
}

// ── Cause Column (recursive) ─────────────────────────────────────────────
function CauseColumn({ node, depth, nodeEls, onUpdateNode, onDeleteNode, onAddSibling, onAddChild, canDelete }: {
  node: ProblemTreeNode;
  depth: number;
  nodeEls: React.MutableRefObject<Map<string, HTMLDivElement>>;
  onUpdateNode: (id: string, t: string) => void;
  onDeleteNode: (id: string) => void;
  onAddSibling: (afterId: string) => void;
  onAddChild: (parentId: string) => void;
  canDelete: boolean;
}) {
  const variant = depth === 0 ? 'cause' : depth === 1 ? 'sub' : 'root';
  return (
    <div className="flex flex-col items-center">
      <NodeBox
        boxRef={el => { if (el) nodeEls.current.set(node.id, el); else nodeEls.current.delete(node.id); }}
        text={node.text}
        variant={variant}
        onUpdate={t => onUpdateNode(node.id, t)}
        onDelete={canDelete ? () => onDeleteNode(node.id) : undefined}
        onAddSibling={() => onAddSibling(node.id)}
        onAddChild={depth < 2 ? () => onAddChild(node.id) : undefined}
        childLabel={depth === 0 ? '세부원인' : '근본원인'}
      />
      {node.children && node.children.length > 0 && (
        <div className="flex gap-3 flex-wrap justify-center" style={{ marginTop: 56 }}>
          {node.children.map(child => (
            <CauseColumn key={child.id} node={child} depth={depth + 1} nodeEls={nodeEls}
              onUpdateNode={onUpdateNode} onDeleteNode={onDeleteNode}
              onAddSibling={onAddSibling} onAddChild={onAddChild}
              canDelete={node.children!.length > 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── SVG line calculator ───────────────────────────────────────────────────

type Pt = { cx: number; top: number; bottom: number };

function calcLines(
  tree: { effects: ProblemTreeNode[]; coreProblem: string; causes: ProblemTreeNode[] } | null | undefined,
  containerRect: DOMRect,
  coreEl: HTMLDivElement | null,
  nodeEls: Map<string, HTMLDivElement>,
): string[] {
  if (!tree) return [];

  const getRect = (id: string): Pt | null => {
    const el = id === 'core' ? coreEl : nodeEls.get(id);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width === 0) return null;
    return {
      cx: r.left - containerRect.left + r.width / 2,
      top: r.top - containerRect.top,
      bottom: r.bottom - containerRect.top,
    };
  };

  const paths: string[] = [];

  // Diverge: one parent → multiple children (draws T-bar below parent)
  const diverge = (parentId: string, childIds: string[]) => {
    if (!childIds.length) return;
    const p = getRect(parentId); if (!p) return;
    const cs = childIds.map(getRect).filter(Boolean) as Pt[];
    if (!cs.length) return;

    const minTop = Math.min(...cs.map(c => c.top));
    const jY = p.bottom + (minTop - p.bottom) * 0.42;

    paths.push(`M ${p.cx} ${p.bottom} L ${p.cx} ${jY}`);
    if (cs.length === 1) {
      const c = cs[0];
      if (Math.abs(p.cx - c.cx) < 3) paths.push(`M ${p.cx} ${jY} L ${c.cx} ${c.top}`);
      else paths.push(`M ${p.cx} ${jY} L ${c.cx} ${jY} L ${c.cx} ${c.top}`);
    } else {
      const lx = Math.min(...cs.map(c => c.cx)), rx = Math.max(...cs.map(c => c.cx));
      paths.push(`M ${lx} ${jY} L ${rx} ${jY}`);
      cs.forEach(c => paths.push(`M ${c.cx} ${jY} L ${c.cx} ${c.top}`));
    }
  };

  // Converge: multiple children → one parent (draws T-bar above parent)
  const converge = (childIds: string[], parentId: string) => {
    if (!childIds.length) return;
    const p = getRect(parentId); if (!p) return;
    const cs = childIds.map(getRect).filter(Boolean) as Pt[];
    if (!cs.length) return;

    const maxBot = Math.max(...cs.map(c => c.bottom));
    const jY = maxBot + (p.top - maxBot) * 0.42;

    cs.forEach(c => paths.push(`M ${c.cx} ${c.bottom} L ${c.cx} ${jY}`));
    if (cs.length === 1) {
      const c = cs[0];
      if (Math.abs(c.cx - p.cx) < 3) paths.push(`M ${c.cx} ${jY} L ${p.cx} ${p.top}`);
      else paths.push(`M ${c.cx} ${jY} L ${p.cx} ${jY} L ${p.cx} ${p.top}`);
    } else {
      const lx = Math.min(...cs.map(c => c.cx)), rx = Math.max(...cs.map(c => c.cx));
      const bx = (lx + rx) / 2;
      paths.push(`M ${lx} ${jY} L ${rx} ${jY}`);
      if (Math.abs(bx - p.cx) < 3) paths.push(`M ${bx} ${jY} L ${p.cx} ${p.top}`);
      else paths.push(`M ${bx} ${jY} L ${p.cx} ${jY} L ${p.cx} ${p.top}`);
    }
  };

  // Effects → Core
  if (tree.effects.length) converge(tree.effects.map(e => e.id), 'core');
  // Core → Causes
  if (tree.causes.length) diverge('core', tree.causes.map(c => c.id));
  // Recursive children
  const walk = (node: ProblemTreeNode) => {
    if (!node.children?.length) return;
    diverge(node.id, node.children.map(c => c.id));
    node.children.forEach(walk);
  };
  tree.causes.forEach(walk);

  return paths;
}

// ── Main Component ───────────────────────────────────────────────────────

export function ProblemTreeEditor() {
  const { structure, setStructure, updateSection, updateSectionAiDraft, sections,
    ideation, project, ideationAnalysis, expertSessions, experts, projectType, pmcSourceDocs } = useProjectStore();

  const [generating, setGenerating] = useState(false);
  const [generatingText, setGeneratingText] = useState(false);
  const [saved, setSaved] = useState(false);
  const [viewMode, setViewMode] = useState<'ai' | 'user'>('user');

  const treeContainerRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const nodeEls = useRef<Map<string, HTMLDivElement>>(new Map());
  const [svgPaths, setSvgPaths] = useState<string[]>([]);
  const [svgH, setSvgH] = useState(600);

  const tree = structure?.problemTree;
  const hasTree = !!tree?.coreProblem;
  const textContent = sections['basis-problem']?.content || '';
  const aiDraft = sections['basis-problem']?.aiDraft || '';

  // ── Recalculate SVG lines ─────────────────────────────────────────────
  const recalc = useCallback(() => {
    const container = treeContainerRef.current;
    if (!container) return;
    const cr = container.getBoundingClientRect();
    if (cr.width === 0) return;
    const paths = calcLines(tree, cr, coreRef.current, nodeEls.current);
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
    setStructure({ ...structure, problemTree: { ...structure.problemTree!, ...patch } });
  }, [structure, setStructure]);

  const updateEffect = (id: string, t: string) => updateTree({ effects: updateNodeText(tree!.effects, id, t) });
  const deleteEffect = (id: string) => updateTree({ effects: deleteNode(tree!.effects, id) });
  const addEffectSibling = (afterId: string) => updateTree({ effects: addSibling(tree!.effects, afterId, { id: uid(), text: '(새 결과/영향)' }) });
  const addEffect = () => updateTree({ effects: [...(tree?.effects || []), { id: uid(), text: '(새 결과/영향)' }] });

  const updateCauseNode = (id: string, t: string) => updateTree({ causes: updateNodeText(tree!.causes, id, t) });
  const deleteCauseNode = (id: string) => updateTree({ causes: deleteNode(tree!.causes, id) });
  const addCauseSibling = (afterId: string) => updateTree({ causes: addSibling(tree!.causes, afterId, { id: uid(), text: '(새 원인)', children: [] }) });
  const addCauseChild = (parentId: string) => updateTree({ causes: addChild(tree!.causes, parentId, { id: uid(), text: '(새 세부 원인)', children: [] }) });
  const addCause = () => updateTree({ causes: [...(tree?.causes || []), { id: uid(), text: '(새 직접 원인)', children: [] }] });

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
      coreProblem: ideationAnalysis?.coreProblem || '',
      targetBeneficiaries: ideationAnalysis?.targetBeneficiaries || '',
      interventionApproach: ideationAnalysis?.interventionApproach || '',
      expectedOutcomes: ideationAnalysis?.expectedOutcomes || '',
      problemTree: structure?.problemTree ? JSON.stringify(structure.problemTree) : '',
      objectiveTree: structure?.objectiveTree ? JSON.stringify({ impact: structure.objectiveTree.impact, purpose: structure.objectiveTree.purpose }) : '',
      expertInsights,
      projectSummary: (ideationAnalysis as any)?.summary || ideation?.idea?.slice(0, 500) || '',
    };
  }, [project, ideation, ideationAnalysis, structure, expertSessions, experts]);

  // ── AI generate tree ──────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/gni-an/proposal/problem-tree', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...buildCtx(), projectType, pmcSourceDocs }),
      });
      const data = await res.json();
      if (data.success && data.tree) {
        const s = structure
          ? { ...structure, problemTree: data.tree }
          : { problemTree: data.tree, objectiveTree: { impact: '', purpose: '', outcomes: [], outputs: [], activities: [] }, pdm: [] };
        setStructure(s);
        updateSection('basis-problem', '', 'in-progress');
      }
    } catch { /* silent */ } finally { setGenerating(false); }
  }, [structure, setStructure, updateSection, buildCtx, projectType, pmcSourceDocs]);

  // ── AI generate text ──────────────────────────────────────────────────
  const handleGenerateText = useCallback(async () => {
    setGeneratingText(true);
    try {
      const ctx = { ...buildCtx() };
      if (tree) ctx.problemTree = JSON.stringify(tree);
      const res = await fetch('/api/gni-an/proposal/section/draft', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId: 'basis-problem', projectContext: ctx }),
      });
      const data = await res.json();
      if (data.success && data.html) {
        updateSectionAiDraft('basis-problem', data.html);
        setViewMode('ai');
      }
    } catch { /* silent */ } finally { setGeneratingText(false); }
  }, [tree, buildCtx, updateSectionAiDraft]);

  const handleUseAiDraft = () => {
    if (aiDraft) { updateSection('basis-problem', aiDraft, 'in-progress'); setViewMode('user'); }
  };

  const handleTextChange = useCallback((html: string) => {
    const n = html.replace(/<[^>]*>/g, '').length;
    updateSection('basis-problem', html, n > 0 ? 'in-progress' : 'empty');
  }, [updateSection]);

  const handleComplete = () => {
    const content = textContent || (tree ? JSON.stringify(tree) : '');
    if (hasTree) {
      updateSection('basis-problem', content, 'completed');
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    }
  };

  // ── Loading / empty states ────────────────────────────────────────────
  if (generating) return (
    <div className="border border-[#D9E6B7] rounded-xl bg-[#F7F8F2] flex flex-col items-center justify-center gap-3 text-[#5a7012]" style={{ minHeight: 400 }}>
      <Loader2 size={28} className="animate-spin" />
      <p className="text-sm font-medium">AI가 문제나무를 생성하고 있습니다…</p>
      <p className="text-xs text-gray-400">잠시만 기다려 주세요 (10~20초)</p>
    </div>
  );

  if (!hasTree) return (
    <div className="border-2 border-dashed border-[#D9E6B7] rounded-xl bg-[#F7F8F2] flex flex-col items-center justify-center gap-4 py-16">
      <div className="w-12 h-12 rounded-full bg-[#EEF5D6] flex items-center justify-center">
        <Sparkles size={22} className="text-[#8AA81E]" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-[#3b5c0a] mb-1">문제나무를 생성해주세요</p>
        <p className="text-xs text-gray-400">AI가 사업 컨텍스트를 분석하여 문제나무 초안을 작성합니다</p>
      </div>
      <button onClick={handleGenerate} className="flex items-center gap-2 px-5 py-2.5 bg-[#8AA81E] text-white text-sm font-medium rounded-xl shadow-sm hover:bg-[#7a9419] transition-colors">
        <Sparkles size={14} /> AI로 문제나무 생성
      </button>
    </div>
  );

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
        <div ref={treeContainerRef} className="relative select-none" style={{ minWidth: 640, minHeight: 440 }}>

          {/* SVG overlay */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: svgH, pointerEvents: 'none', overflow: 'visible', zIndex: 1 }}>
            {svgPaths.map((d, i) => (
              <path key={i} d={d} stroke="#CBD5E1" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ))}
          </svg>

          {/* Tree content */}
          <div className="flex flex-col items-center" style={{ position: 'relative', zIndex: 2 }}>

            {/* Effects */}
            <LevelLabel text="↑ 결과 / 영향 (Effects)" color="text-red-600 bg-red-50 border-red-200" />
            <div className="flex gap-4 flex-wrap justify-center" style={{ paddingBottom: 52 }}>
              {tree.effects.map(e => (
                <NodeBox key={e.id}
                  boxRef={el => { if (el) nodeEls.current.set(e.id, el); else nodeEls.current.delete(e.id); }}
                  text={e.text} variant="effect"
                  onUpdate={t => updateEffect(e.id, t)}
                  onDelete={tree.effects.length > 1 ? () => deleteEffect(e.id) : undefined}
                  onAddSibling={() => addEffectSibling(e.id)} />
              ))}
              {tree.effects.length === 0 && (
                <button onClick={addEffect} className="text-xs text-red-400 border border-dashed border-red-200 rounded-xl px-4 py-2">+ 결과 추가</button>
              )}
            </div>

            {/* Core Problem */}
            <LevelLabel text="핵심 문제 (Core Problem)" color="text-[#5a7012] bg-[#EEF5D6] border-[#8AA81E]" />
            <div ref={coreRef}>
              <NodeBox text={tree.coreProblem} variant="core" onUpdate={t => updateTree({ coreProblem: t })} />
            </div>

            {/* Causes */}
            <div style={{ marginTop: 52 }}>
              <LevelLabel text="↓ 직접 원인 (Immediate Causes)" color="text-amber-700 bg-amber-50 border-amber-200" />
              <div className="flex gap-8 flex-wrap justify-center">
                {tree.causes.map(c => (
                  <CauseColumn key={c.id} node={c} depth={0} nodeEls={nodeEls}
                    onUpdateNode={updateCauseNode} onDeleteNode={deleteCauseNode}
                    onAddSibling={addCauseSibling} onAddChild={addCauseChild}
                    canDelete={tree.causes.length > 1} />
                ))}
                {tree.causes.length === 0 && (
                  <button onClick={addCause} className="text-xs text-amber-600 border border-dashed border-amber-200 rounded-xl px-4 py-2 mt-6">+ 원인 추가</button>
                )}
              </div>
            </div>

            {/* Add buttons */}
            <div className="flex gap-3 mt-12 pt-4 border-t border-gray-100 w-full justify-center">
              <button onClick={addEffect} className="text-xs text-red-500 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50">+ 결과 추가</button>
              <button onClick={addCause} className="text-xs text-amber-600 border border-amber-200 rounded-lg px-3 py-1.5 hover:bg-amber-50">+ 직접 원인 추가</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Text description ── */}
      <div className="border border-[#D9E6B7] rounded-xl bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-[#3b5c0a]">문제분석 서술</h4>
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
            <Loader2 size={18} className="animate-spin" /><span className="text-sm">문제분석 텍스트 작성 중…</span>
          </div>
        ) : viewMode === 'ai' && aiDraft ? (
          <>
            <CitationHtml
              html={aiDraft}
              className="border border-[#D9E6B7] rounded-lg bg-[#F7F8F2] px-5 py-4 text-xs leading-relaxed"
              onSaveLink={(citationText, url) => {
                const updated = aiDraft.replace(
                  `(${citationText})`,
                  `(<a href="${url}" target="_blank" rel="noopener noreferrer">${citationText}</a>)`
                );
                updateSectionAiDraft('basis-problem', updated);
              }}
            />
            <div className="flex justify-end mt-2">
              <button onClick={handleUseAiDraft} className="text-xs text-[#5a7012] border border-[#D9E6B7] bg-white rounded-lg px-3 py-1.5 hover:bg-[#EEF5D6] transition-colors">이 초안으로 편집 시작 →</button>
            </div>
          </>
        ) : viewMode === 'ai' ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-400">
            <Sparkles size={20} />
            <p className="text-xs">문제나무 생성 후 'AI 텍스트 생성' 버튼을 눌러주세요</p>
          </div>
        ) : (
          <RichTextEditor content={textContent} onChange={handleTextChange} minHeight={280} />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-1">
        <p className="text-xs text-gray-400">문제나무 + 텍스트 서술이 PDF에 포함됩니다</p>
        <button onClick={handleComplete} disabled={!hasTree}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-[#F7F8F2] hover:border-[#8AA81E] hover:text-[#5a7012] disabled:opacity-40 transition-colors">
          {saved ? <><Check size={12} className="text-[#8AA81E]" /> 저장됨</> : '완료 표시'}
        </button>
      </div>
    </div>
  );
}
