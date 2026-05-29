'use client';
import { ProposalLayout } from '@/components/layout/ProposalLayout';
import { useProjectStore } from '@/lib/store/projectStore';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Collapsible } from '@/components/ui/Collapsible';
import type { PDMRow } from '@/types';
import { clsx } from 'clsx';
import { useState } from 'react';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';

function PDMRowCard({ row, depth = 0 }: { row: PDMRow; depth?: number }) {
  const [expanded, setExpanded] = useState(depth === 0);

  const levelConfig: Record<string, { label: string; bg: string; border: string; text: string }> = {
    impact: { label: '영향', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
    purpose: { label: '사업목적', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    outcome: { label: '성과', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
    output: { label: '산출물', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
    activity: { label: '활동', bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600' },
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
  const { structure, sections, updateSection } = useProjectStore();
  const pdm = structure?.pdm || [];

  return (
    <ProposalLayout sectionId="plan-pdm" sectionTitle="사업 논리 모형(PDM)">
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {['논리적 연계', 'SMART 지표', '기초선/목표', 'SMART', 'Baseline'].map((tag) => (
            <Badge key={tag} variant="olive">{tag}</Badge>
          ))}
        </div>
        <h1 className="text-xl font-bold text-[#111827] mb-4">I-2 가. 사업 논리 모형(PDM)</h1>

        <div className="bg-white border border-[#D9E6B7] rounded-xl px-4 py-2 mb-4">
          <Collapsible trigger="▶ 작성 가이드">
            <div className="text-xs text-gray-600 leading-relaxed pl-4 pb-2">
              PDM(Project Design Matrix)을 작성합니다.<br />
              ■ 각 행: 영향(Impact) → 사업목적 → 성과(Output) → 활동(Activity)<br />
              ■ 각 열: 서술적 요약 / 지표(OVI, 기초선·목표치 포함) / 검증수단(MOV) / 가정<br />
              ※ 지표는 SMART 원칙을 충족해야 합니다.
            </div>
          </Collapsible>
        </div>

        {pdm.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-10 text-center">
            <p className="text-gray-400 text-sm">구조화 단계에서 PDM을 생성하면 여기에 자동으로 불러옵니다.</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => window.location.href = '/gni-an/ideation/structure'}>
              구조화 단계로 이동
            </Button>
          </div>
        ) : (
          <div>
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
