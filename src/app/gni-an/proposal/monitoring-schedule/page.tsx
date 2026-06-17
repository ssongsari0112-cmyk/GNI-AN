'use client';
import { useState, useRef, useEffect } from 'react';
import { ProposalLayout } from '@/components/layout/ProposalLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useProjectStore } from '@/lib/store/projectStore';
import type { ScheduleActivity, PDMRow } from '@/types';
import { Plus, RefreshCw, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

function generateMonths(startDate: string, endDate: string): string[] {
  if (!startDate || !endDate) {
    const now = new Date();
    const months = [];
    for (let i = 0; i < 36; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      months.push(`${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return months;
  }
  const start = new Date(startDate);
  const end = new Date(endDate);
  const months = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cur <= end) {
    months.push(`${cur.getFullYear()}.${String(cur.getMonth() + 1).padStart(2, '0')}`);
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}

function groupMonthsByYear(months: string[]): { year: number; months: string[] }[] {
  const groups: { year: number; months: string[] }[] = [];
  for (let i = 0; i < months.length; i += 12) {
    groups.push({ year: Math.floor(i / 12) + 1, months: months.slice(i, i + 12) });
  }
  return groups;
}

function initActivities(structure: ReturnType<typeof useProjectStore.getState>['structure']): ScheduleActivity[] {
  if (!structure?.pdm) return [];
  const activities: ScheduleActivity[] = [];
  function walk(rows: PDMRow[]) {
    rows.forEach((row) => {
      if (row.level === 'activity') {
        activities.push({
          id: row.id,
          code: row.code || `A${activities.length + 1}`,
          name: row.narrative,
          periods: [],
        });
      }
      if (row.children?.length) walk(row.children);
    });
  }
  walk(structure.pdm);
  return activities;
}

export default function MonitoringSchedulePage() {
  const { project, ideation, structure, scheduleActivities, setScheduleActivities, updateSection, projectType, pmcSourceDocs } = useProjectStore();
  const months = generateMonths(project?.startDate || '', project?.endDate || '');
  const yearGroups = groupMonthsByYear(months);

  const [activities, setActivities] = useState<ScheduleActivity[]>(
    scheduleActivities.length > 0 ? scheduleActivities : initActivities(structure)
  );
  const [dragging, setDragging] = useState<{ actId: string; startIdx: number } | null>(null);
  const [newRowName, setNewRowName] = useState('');
  const [autocompleting, setAutocompleting] = useState(false);
  const [autocompleteError, setAutocompleteError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activities !== scheduleActivities) {
      setScheduleActivities(activities);
    }
  }, [activities]);

  function syncFromPDM() {
    const newActs = initActivities(structure);
    setActivities(newActs);
  }

  async function handleAiAutocomplete() {
    setAutocompleting(true);
    setAutocompleteError('');
    try {
      const base = activities.length > 0 ? activities : initActivities(structure);
      if (base.length === 0) {
        setAutocompleteError('자동완성할 활동이 없습니다. 먼저 PDM에서 활동을 가져오거나 활동을 추가해주세요.');
        return;
      }
      const res = await fetch('/api/gni-an/proposal/schedule-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activities: base.map((a) => ({ id: a.id, code: a.code, name: a.name })),
          monthsCount: months.length,
          projectType,
          pmcSourceDocs,
          projectContext: {
            title: project?.title || '',
            country: project?.country || ideation?.country || '',
            field: project?.field || ideation?.field || '',
          },
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.schedule)) {
        const byId = new Map(data.schedule.map((s: { id: string; startMonth: number; endMonth: number }) => [s.id, s]));
        const filled = base.map((a) => {
          const range = byId.get(a.id) as { startMonth: number; endMonth: number } | undefined;
          if (!range) return a;
          const periods = new Array(months.length).fill(false);
          for (let i = range.startMonth; i <= range.endMonth; i++) periods[i] = true;
          return { ...a, periods };
        });
        setActivities(filled);
      } else {
        setAutocompleteError(data.error || '자동완성에 실패했습니다.');
      }
    } catch {
      setAutocompleteError('자동완성 중 오류가 발생했습니다.');
    } finally {
      setAutocompleting(false);
    }
  }

  function toggleCell(actId: string, monthIdx: number) {
    setActivities((prev) =>
      prev.map((a) => {
        if (a.id !== actId) return a;
        const periods = [...(a.periods || [])];
        periods[monthIdx] = !periods[monthIdx];
        return { ...a, periods };
      })
    );
  }

  function handleMouseDown(actId: string, monthIdx: number) {
    setDragging({ actId, startIdx: monthIdx });
    toggleCell(actId, monthIdx);
  }

  function handleMouseEnter(actId: string, monthIdx: number) {
    if (!dragging || dragging.actId !== actId) return;
    setActivities((prev) =>
      prev.map((a) => {
        if (a.id !== actId) return a;
        const periods = [...(a.periods || [])];
        const [from, to] = [Math.min(dragging.startIdx, monthIdx), Math.max(dragging.startIdx, monthIdx)];
        const value = periods[dragging.startIdx];
        for (let i = from; i <= to; i++) periods[i] = value;
        return { ...a, periods };
      })
    );
  }

  function addRow() {
    const name = newRowName.trim() || '새 활동';
    setActivities((prev) => [
      ...prev,
      { id: crypto.randomUUID(), code: `A${prev.length + 1}`, name, periods: [] },
    ]);
    setNewRowName('');
  }

  function renameActivity(actId: string, name: string) {
    setActivities((prev) => prev.map((a) => (a.id === actId ? { ...a, name } : a)));
  }

  function removeActivity(actId: string) {
    setActivities((prev) => prev.filter((a) => a.id !== actId));
  }

  function handleSave() {
    setScheduleActivities(activities);
    updateSection('monitoring-schedule', JSON.stringify(activities), activities.length > 0 ? 'completed' : 'empty');
  }

  return (
    <ProposalLayout sectionId="monitoring-schedule" sectionTitle="부문별 상세 사업 추진 일정">
      <div className="px-6 py-6">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {['일정 현실성', '마일스톤', '평가 일정'].map((tag) => (
            <Badge key={tag} variant="olive">{tag}</Badge>
          ))}
        </div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-[#111827]">III-4 부문별 상세 사업 추진 일정</h1>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={syncFromPDM}>
              <RefreshCw size={13} />
              PDM에서 활동 가져오기
            </Button>
            <button
              onClick={handleAiAutocomplete}
              disabled={autocompleting}
              className="flex items-center gap-1.5 text-xs font-medium text-white bg-[#8AA81E] hover:bg-[#799516] rounded-lg px-3 py-2 transition-colors disabled:opacity-50"
            >
              {autocompleting ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {autocompleting ? 'AI 일정 배정 중...' : 'AI 자동완성'}
            </button>
            <Button size="sm" onClick={handleSave}>저장</Button>
          </div>
        </div>
        {autocompleteError && (
          <p className="text-xs text-red-400 mb-2">{autocompleteError}</p>
        )}
        {projectType === 'pmc' && (
          <p className="text-xs text-blue-500 mb-2">🏛 PMC 모드 — AI 자동완성 시 업로드한 집행계획(안) 원문의 일정을 우선 반영합니다.</p>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
          <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-[#8AA81E]" />활동 수행 기간</div>
          <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-gray-100 border border-gray-200" />비활동 기간</div>
          <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-[#b5d147]" />드래그 선택 중</div>
          <span className="text-gray-400">Tip: 드래그하여 여러 월을 한 번에 선택할 수 있습니다.</span>
        </div>

        {/* Table */}
        <div
          className="overflow-x-auto bg-white border border-[#D9E6B7] rounded-xl"
          onMouseUp={() => setDragging(null)}
          onMouseLeave={() => setDragging(null)}
        >
          <table className="w-max border-collapse text-xs select-none table-fixed">
            <thead>
              <tr className="bg-[#F7F8F2]">
                <th rowSpan={2} className="w-6 border-b border-r border-gray-100 px-1 py-2 text-gray-400 font-normal align-middle">선택</th>
                <th rowSpan={2} className="w-10 border-b border-r border-gray-100 px-1 py-2 text-gray-500 font-medium align-middle">코드</th>
                <th rowSpan={2} className="w-40 border-b border-r border-gray-100 px-2 py-2 text-gray-500 font-medium text-left align-middle">활동명</th>
                {yearGroups.map((g) => (
                  <th key={g.year} colSpan={g.months.length} className="border-b border-r border-gray-200 px-1 py-1.5 text-center text-[#5a7012] font-semibold bg-[#EEF5D6]">
                    {g.year}차년도
                  </th>
                ))}
              </tr>
              <tr className="bg-[#F7F8F2]">
                {months.map((m, idx) => (
                  <th key={m} className="w-5 border-b border-r border-gray-100 px-0 py-1 text-center text-gray-400 font-normal" style={{ minWidth: 18 }} title={m}>
                    {(idx % 12) + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activities.map((act) => (
                <tr key={act.id} className="hover:bg-[#F7F8F2]">
                  <td className="border-b border-r border-gray-100 px-1 py-1 text-center">
                    <input type="checkbox" className="accent-[#8AA81E]" />
                  </td>
                  <td className="border-b border-r border-gray-100 px-1 py-1 text-gray-400 text-center">{act.code}</td>
                  <td className="border-b border-r border-gray-100 px-1 py-1 text-gray-700">
                    <div className="flex items-center gap-1">
                      <input
                        value={act.name}
                        onChange={(e) => renameActivity(act.id, e.target.value)}
                        className="flex-1 min-w-0 bg-transparent border border-transparent hover:border-gray-200 focus:border-[#8AA81E] focus:bg-white rounded px-1 py-0.5 text-xs focus:outline-none"
                      />
                      <button
                        onClick={() => removeActivity(act.id)}
                        title="활동 삭제"
                        className="text-gray-300 hover:text-red-400 flex-shrink-0"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </td>
                  {months.map((_, idx) => (
                    <td
                      key={idx}
                      className={clsx(
                        'schedule-cell border-b border-r border-gray-100',
                        act.periods?.[idx] ? 'bg-[#8AA81E]' : 'bg-white hover:bg-[#EEF5D6]'
                      )}
                      onMouseDown={() => handleMouseDown(act.id, idx)}
                      onMouseEnter={() => handleMouseEnter(act.id, idx)}
                    />
                  ))}
                </tr>
              ))}
              {/* Add row */}
              <tr>
                <td colSpan={3 + months.length} className="px-3 py-2 border-t border-dashed border-gray-100">
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      value={newRowName}
                      onChange={(e) => setNewRowName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addRow()}
                      placeholder="활동명 입력 후 Enter"
                      className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#8AA81E]"
                    />
                    <Button size="sm" variant="ghost" onClick={addRow}>
                      <Plus size={12} /> 활동 추가
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </ProposalLayout>
  );
}
