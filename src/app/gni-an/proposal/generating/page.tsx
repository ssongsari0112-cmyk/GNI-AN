'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Check, Sparkles } from 'lucide-react';
import { useProjectStore } from '@/lib/store/projectStore';
import { AUTO_DRAFT_SECTIONS } from '@/components/proposal/SectionPage';
import { PROPOSAL_SECTIONS } from '@/types';

type StepStatus = 'pending' | 'running' | 'done' | 'skipped' | 'error';
type Step = { key: string; label: string; status: StepStatus };

const TREE_STEPS = [
  { key: 'problemTree', label: '문제분석 (문제나무) 생성' },
  { key: 'objectiveTree', label: '목표분석 (목표나무) 생성' },
  { key: 'pdm', label: '사업 논리 모형 (PDM) 생성' },
];

// PROPOSAL_SECTIONS 순서를 따르되, plan-pdm/operation-budget/monitoring-schedule은
// 별도 생성 방식(트리·표·간트차트)이라 제외
const TEXT_SECTION_IDS = PROPOSAL_SECTIONS
  .map((s) => s.id)
  .filter((id) => AUTO_DRAFT_SECTIONS.has(id));

export default function ProposalGeneratingPage() {
  const router = useRouter();
  const started = useRef(false);
  const [steps, setSteps] = useState<Step[]>([
    ...TREE_STEPS.map((s) => ({ ...s, status: 'pending' as StepStatus })),
    ...TEXT_SECTION_IDS.map((id) => {
      const section = PROPOSAL_SECTIONS.find((s) => s.id === id)!;
      return { key: id, label: `${section.code}. ${section.title} 초안 작성`, status: 'pending' as StepStatus };
    }),
  ]);
  const [done, setDone] = useState(false);

  function setStatus(key: string, status: StepStatus) {
    setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, status } : s)));
  }

  async function runAll() {
    const { project, ideation, ideationAnalysis, expertSessions, experts, projectType, pmcSourceDocs } = useProjectStore.getState();

    const expertInsights = expertSessions
      .filter((s) => s.messages.length > 0)
      .flatMap((s) => {
        const expert = experts.find((e) => e.id === s.expertId);
        return s.messages
          .filter((m) => m.role === 'assistant')
          .slice(-3)
          .map((m) => `[${expert?.name || s.expertId}] ${m.content.slice(0, 300)}`);
      })
      .join('\n');

    const base = {
      title: project?.title || '',
      country: project?.country || ideation?.country || '',
      region: project?.region || ideation?.subRegion || '',
      field: project?.field || ideation?.field || '',
      organization: '굿네이버스',
      duration: project?.expectedDuration
        || (project?.startDate && project?.endDate ? `${project.startDate} ~ ${project.endDate}` : '3년'),
      budget: project?.budget != null ? String(project.budget) : '',
      idea: ideation?.idea || '',
      coreProblem: ideationAnalysis?.coreProblem || '',
      targetBeneficiaries: ideationAnalysis?.targetBeneficiaries || ideation?.beneficiaries || '',
      interventionApproach: ideationAnalysis?.interventionApproach || '',
      expectedOutcomes: ideationAnalysis?.expectedOutcomes || '',
      expertInsights,
      projectSummary: (ideationAnalysis as unknown as Record<string, string> | null)?.summary || ideation?.idea?.slice(0, 500) || '',
    };

    // ── 1. 문제나무 ──────────────────────────────────────────
    setStatus('problemTree', 'running');
    let structureNow = useProjectStore.getState().structure;
    if (structureNow?.problemTree?.coreProblem) {
      setStatus('problemTree', 'skipped');
    } else {
      try {
        const res = await fetch('/api/gni-an/proposal/problem-tree', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(base),
        });
        const data = await res.json();
        if (data.success && data.tree) {
          const baseStructure = structureNow ?? {
            problemTree: { effects: [], coreProblem: '', causes: [] },
            objectiveTree: { impact: '', purpose: '', outcomes: [], outputs: [], activities: [] },
            pdm: [],
          };
          structureNow = { ...baseStructure, problemTree: data.tree };
          useProjectStore.getState().setStructure(structureNow);
          setStatus('problemTree', 'done');
        } else {
          setStatus('problemTree', 'error');
        }
      } catch { setStatus('problemTree', 'error'); }
    }

    // ── 2. 목표나무 ──────────────────────────────────────────
    setStatus('objectiveTree', 'running');
    if (structureNow?.objectiveTree?.impact || structureNow?.objectiveTree?.purpose) {
      setStatus('objectiveTree', 'skipped');
    } else {
      try {
        const ctx = {
          ...base,
          coreProblem: base.coreProblem || structureNow?.problemTree?.coreProblem || '',
          problemTree: structureNow?.problemTree ? JSON.stringify(structureNow.problemTree) : '',
        };
        const res = await fetch('/api/gni-an/proposal/objective-tree', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ctx),
        });
        const data = await res.json();
        if (data.success && data.tree) {
          const baseStructure = structureNow ?? {
            problemTree: { effects: [], coreProblem: '', causes: [] },
            objectiveTree: { impact: '', purpose: '', outcomes: [], outputs: [], activities: [] },
            pdm: [],
          };
          structureNow = { ...baseStructure, objectiveTree: { ...baseStructure.objectiveTree, ...data.tree } };
          useProjectStore.getState().setStructure(structureNow);
          setStatus('objectiveTree', 'done');
        } else {
          setStatus('objectiveTree', 'error');
        }
      } catch { setStatus('objectiveTree', 'error'); }
    }

    // ── 3. PDM ───────────────────────────────────────────────
    setStatus('pdm', 'running');
    if (structureNow?.pdm && structureNow.pdm.length > 0) {
      setStatus('pdm', 'skipped');
    } else {
      try {
        const pdmCtx = {
          title: base.title,
          country: base.country,
          region: base.region,
          field: base.field,
          coreProblem: base.coreProblem || structureNow?.problemTree?.coreProblem || '',
          targetBeneficiaries: base.targetBeneficiaries,
          interventionApproach: base.interventionApproach,
          expectedOutcomes: base.expectedOutcomes,
          problemTree: structureNow?.problemTree ? JSON.stringify(structureNow.problemTree).slice(0, 800) : '',
          objectiveTree: structureNow?.objectiveTree
            ? JSON.stringify({ impact: structureNow.objectiveTree.impact, purpose: structureNow.objectiveTree.purpose, outcomes: structureNow.objectiveTree.outcomes }).slice(0, 800)
            : '',
        };
        const res = await fetch('/api/gni-an/proposal/pdm-draft', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectContext: pdmCtx, projectType, pmcSourceDocs }),
        });
        const data = await res.json();
        if (data.success && data.pdm?.length > 0) {
          structureNow = { ...structureNow!, pdm: data.pdm };
          useProjectStore.getState().setStructure(structureNow);
          useProjectStore.getState().updateSection('plan-pdm', JSON.stringify(data.pdm), 'in-progress');
          setStatus('pdm', 'done');
        } else {
          setStatus('pdm', 'error');
        }
      } catch { setStatus('pdm', 'error'); }
    }

    // ── 4. 14개 텍스트 섹션 ──────────────────────────────────
    for (const id of TEXT_SECTION_IDS) {
      setStatus(id, 'running');
      const existing = useProjectStore.getState().sections[id]?.content || '';
      if (existing !== '') {
        setStatus(id, 'skipped');
        continue;
      }
      try {
        const ctx = {
          ...base,
          coreProblem: base.coreProblem || structureNow?.problemTree?.coreProblem || '',
          problemTree: structureNow?.problemTree
            ? JSON.stringify({ coreProblem: structureNow.problemTree.coreProblem, causes: structureNow.problemTree.causes, effects: structureNow.problemTree.effects })
            : '',
          objectiveTree: structureNow?.objectiveTree
            ? JSON.stringify({ impact: structureNow.objectiveTree.impact, purpose: structureNow.objectiveTree.purpose, outcomes: structureNow.objectiveTree.outcomes })
            : '',
          pdm: structureNow?.pdm && structureNow.pdm.length > 0 ? JSON.stringify(structureNow.pdm) : '',
        };
        const res = await fetch('/api/gni-an/proposal/section/draft', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sectionId: id, projectContext: ctx, projectType, pmcSourceDocs }),
        });
        const data = await res.json();
        if (data.success && data.html) {
          useProjectStore.getState().updateSection(id, data.html, 'in-progress');
          useProjectStore.getState().updateSectionAiDraft(id, data.html);
          setStatus(id, 'done');
        } else {
          setStatus(id, 'error');
        }
      } catch { setStatus(id, 'error'); }
    }

    setDone(true);
    setTimeout(() => router.push('/gni-an/proposal/basis-background'), 1200);
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    runAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const completedCount = steps.filter((s) => s.status === 'done' || s.status === 'skipped' || s.status === 'error').length;
  const progress = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="min-h-screen bg-[#F7F8F2] flex items-center justify-center px-6 py-10">
      <div className="max-w-lg w-full bg-white border border-[#D9E6B7] rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#8AA81E] flex items-center justify-center flex-shrink-0">
            <Sparkles size={16} className="text-white" />
          </div>
          <h1 className="text-lg font-bold text-[#111827]">AI가 제안서 1차 가안을 작성하고 있습니다</h1>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          {done ? '작성이 완료되었습니다. 잠시 후 제안서 작성 페이지로 이동합니다.' : '문제·목표 분석부터 PDM, 17개 섹션까지 한 번에 초안을 준비합니다. 시간이 걸려도 잠시만 기다려주세요.'}
        </p>

        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
          <div className="h-full bg-[#8AA81E] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
          {steps.map((step) => (
            <div key={step.key} className="flex items-center gap-2.5 text-sm py-1">
              {step.status === 'running' && <Loader2 size={14} className="text-[#8AA81E] animate-spin flex-shrink-0" />}
              {(step.status === 'done' || step.status === 'skipped') && <Check size={14} className="text-[#8AA81E] flex-shrink-0" />}
              {step.status === 'error' && <span className="text-red-400 flex-shrink-0 text-xs">⚠</span>}
              {step.status === 'pending' && <span className="w-3.5 h-3.5 rounded-full border border-gray-200 flex-shrink-0" />}
              <span className={
                step.status === 'pending' ? 'text-gray-400'
                  : step.status === 'error' ? 'text-red-400'
                  : step.status === 'running' ? 'text-[#111827] font-medium'
                  : 'text-gray-500'
              }>
                {step.label}
                {step.status === 'skipped' && <span className="text-gray-300 ml-1">(이미 작성됨)</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
