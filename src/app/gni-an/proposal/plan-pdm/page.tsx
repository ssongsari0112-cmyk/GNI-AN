'use client';
import { ProposalLayout } from '@/components/layout/ProposalLayout';
import { useProjectStore } from '@/lib/store/projectStore';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Collapsible } from '@/components/ui/Collapsible';
import type { PDMRow } from '@/types';
import { clsx } from 'clsx';
import { useState, useEffect, useRef } from 'react';
import { Plus, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';

function PDMRowCard({ row, depth = 0 }: { row: PDMRow; depth?: number }) {
  const [expanded, setExpanded] = useState(depth === 0);

  const levelConfig: Record<string, { label: string; bg: string; border: string; text: string }> = {
    impact:   { label: 'Impact (영향)',        bg: 'bg-purple-50',  border: 'border-purple-200', text: 'text-purple-800' },
    purpose:  { label: '사업목적 (Purpose)',   bg: 'bg-blue-50',    border: 'border-blue-200',   text: 'text-blue-700'   },
    outcome:  { label: 'Outcome (성과)',        bg: 'bg-green-50',   border: 'border-green-200',  text: 'text-green-700'  },
    output:   { label: 'Output (산출물)',       bg: 'bg-yellow-50',  border: 'border-yellow-200', text: 'text-yellow-700' },
    activity: { label: 'Activity (활동)',       bg: 'bg-gray-50',    border: 'border-gray-200',   text: 'text-gray-600'   },
  };
  const config = levelConfig[row.level];

  return (
    <div className={clsx('ml-' + depth * 4, 'mb-2')}>
      <div className={clsx('border rounded-xl overflow-hidden', config.bg, config.border)}>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-3 p-3 text-left"
        >
          {expanded ? <ChevronDown size={14} className="text-gray-400 flex-shrink-0" /> : <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />}
          <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0', config.bg, config.border, config.text)}>
            {config.label}
          </span>
          {row.code && <span className="text-xs text-gray-400 flex-shrink-0">{row.code}</span>}
          <span className="text-sm font-medium text-gray-800 flex-1 min-w-0 truncate">{row.narrative}</span>
        </button>

        {expanded && (
          <div className="border-t border-opacity-50 grid grid-cols-1 sm:grid-cols-3 gap-0">
            {[
              { label: '지표 (OVI)', value: row.indicators },
              { label: '검증수단 (MOV)', value: row.verificationMeans },
              { label: '가정 (Assumptions)', value: row.assumptions },
            ].map((field, i) => (
              <div key={field.label} className={clsx('p-3', i < 2 ? 'border-b sm:border-b-0 sm:border-r border-gray-200' : '')}>
                <div className="text-xs font-semibold text-gray-400 mb-1">{field.label}</div>
                <div className="text-xs text-gray-700 leading-relaxed">{field.value || '—'}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {row.children?.map((child) => (
        <PDMRowCard key={child.id} row={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function PlanPdmPage() {
  const { structure, sections, updateSection, setStructure, project, ideation, ideationAnalysis, ideationAnalysis: ia, projectType, pmcSourceDocs } = useProjectStore();
  const pdm = structure?.pdm || [];
  const [isGenerating, setIsGenerating] = useState(false);
  const attempted = useRef(false);

  const buildCtx = () => ({
    title: project?.title || '',
    country: project?.country || ideation?.country || '',
    region: (project as any)?.region || ideation?.subRegion || '',
    field: project?.field || ideation?.field || '',
    coreProblem: ia?.coreProblem || structure?.problemTree?.coreProblem || '',
    targetBeneficiaries: ia?.targetBeneficiaries || '',
    interventionApproach: ia?.interventionApproach || '',
    expectedOutcomes: ia?.expectedOutcomes || '',
    problemTree: structure?.problemTree ? JSON.stringify(structure.problemTree).slice(0, 800) : '',
    objectiveTree: structure?.objectiveTree
      ? JSON.stringify({ impact: structure.objectiveTree.impact, purpose: structure.objectiveTree.purpose, outcomes: structure.objectiveTree.outcomes }).slice(0, 800)
      : '',
  });

  const runGenerate = () => {
    setIsGenerating(true);
    fetch('/api/gni-an/proposal/pdm-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectContext: buildCtx(), projectType, pmcSourceDocs }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.pdm?.length > 0) {
          const base = structure ?? {
            problemTree: { effects: [], coreProblem: '', causes: [] },
            objectiveTree: { impact: '', purpose: '', outcomes: [], outputs: [], activities: [] },
            pdm: [],
          };
          setStructure({ ...base, pdm: data.pdm });
          updateSection('plan-pdm', JSON.stringify(data.pdm), 'in-progress');
        }
      })
      .catch(() => {})
      .finally(() => setIsGenerating(false));
  };

  useEffect(() => {
    if (pdm.length > 0 || attempted.current) return;
    attempted.current = true;
    runGenerate();
  }, []);

  return (
    <ProposalLayout sectionId="plan-pdm" sectionTitle="사업 논리 모형(PDM)">
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {['논리적 연계', 'SMART 지표', '기초선/목표', 'SMART', 'Baseline'].map((tag) => (
            <Badge key={tag} variant="olive">{tag}</Badge>
          ))}
        </div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-[#111827]">I-2 가. 사업 논리 모형(PDM)</h1>
          <button
            onClick={runGenerate}
            disabled={isGenerating}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#5a7012] border border-gray-200 hover:border-[#8AA81E] rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
          >
            {isGenerating ? <Loader2 size={11} className="animate-spin" /> : <ChevronDown size={11} />}
            AI 재생성
          </button>
        </div>

        <div className="bg-white border border-[#D9E6B7] rounded-xl px-4 py-2 mb-4">
          <Collapsible trigger="▶ 작성 가이드 (4계층 구조)">
            <div className="text-xs text-gray-600 leading-relaxed pl-4 pb-2">
              <strong>구조:</strong> Impact(1개) → Outcome(2~3개) → Output(각 1~3개) → Activity(각 1~4개)<br />
              <strong>번호:</strong> Outcome 1, 2, 3 / Output 1.1, 1.2 / Activity 1.1.1, 1.1.2<br />
              <strong>열:</strong> 프로젝트 요약 / 지표(OVI) / 지표 증명수단(MoV) / 가정(Assumptions)<br />
              ※ 각 항목 클릭 시 세부 내용 확인 가능
            </div>
          </Collapsible>
        </div>

        {isGenerating ? (
          <div className="bg-[#F7F8F2] border border-[#D9E6B7] rounded-2xl p-10 text-center flex flex-col items-center gap-3 text-[#5a7012]">
            <Loader2 size={28} className="animate-spin" />
            <p className="text-sm font-medium">AI가 PDM 초안을 생성하고 있습니다…</p>
            <p className="text-xs text-gray-400">문제나무·목표나무와 연동하여 4계층 구조로 생성 중 (20~30초)</p>
          </div>
        ) : pdm.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-10 text-center">
            <p className="text-gray-400 text-sm mb-3">PDM이 아직 생성되지 않았습니다.</p>
            <Button variant="secondary" size="sm" onClick={runGenerate}>AI로 PDM 생성</Button>
          </div>
        ) : (
          <div>
            {/* Level legend */}
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                { label: 'Impact (영향)', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
                { label: 'Outcome (성과)', cls: 'bg-green-50 text-green-700 border-green-200' },
                { label: 'Output (산출물)', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
                { label: 'Activity (활동)', cls: 'bg-gray-50 text-gray-500 border-gray-200' },
              ].map(l => (
                <span key={l.label} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${l.cls}`}>{l.label}</span>
              ))}
            </div>
            {pdm.map((row) => (
              <PDMRowCard key={row.id} row={row} />
            ))}
            <button className="flex items-center gap-1.5 text-sm text-[#8AA81E] border border-dashed border-[#D9E6B7] rounded-lg px-4 py-2 hover:bg-[#EEF5D6] transition-colors mt-3">
              <Plus size={14} /> 행 추가
            </button>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button onClick={() => updateSection('plan-pdm', JSON.stringify(pdm), pdm.length > 0 ? 'completed' : 'empty')}>
            완료 표시
          </Button>
        </div>
      </div>
    </ProposalLayout>
  );
}
