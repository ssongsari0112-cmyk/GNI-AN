'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/lib/store/projectStore';
import { PROPOSAL_SECTIONS } from '@/types';
import type { ScheduleActivity, ProblemTreeNode } from '@/types';
import { ArrowLeft, Download, FileText, FileType } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { exportPagesToPdf } from '@/lib/export/pdfExport';
import { exportToDocx } from '@/lib/export/docxExport';
import { computePageBreaks, getPreviewPageHeightPx, PDF_ATOMIC_CLASS } from '@/lib/export/pdfPageBreaks';

/* ── PDF 페이지 구분선 오버레이 — 실제 내보내기와 동일한 기준으로 어디서 페이지가 나뉘는지 미리 표시 ── */
function PageBreakOverlay({ pageRef }: { pageRef: React.RefObject<HTMLDivElement | null> }) {
  const [breaks, setBreaks] = useState<number[]>([]);

  useEffect(() => {
    function recompute() {
      const el = pageRef.current;
      if (!el) return;
      const widthPx = el.offsetWidth || 794;
      const pageHeightPx = getPreviewPageHeightPx(widthPx);
      setBreaks(computePageBreaks(el, pageHeightPx));
    }
    const t1 = setTimeout(recompute, 80);
    const t2 = setTimeout(recompute, 500);
    window.addEventListener('resize', recompute);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', recompute);
    };
  }, [pageRef]);

  if (breaks.length === 0) return null;

  return (
    <>
      {breaks.map((y, i) => (
        <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: y, pointerEvents: 'none', zIndex: 5 }}>
          <div style={{ borderTop: '2px dashed #ef4444' }} />
          <span style={{ position: 'absolute', right: 6, top: 2, fontSize: 8, fontWeight: 700, color: '#ef4444', background: '#fff', padding: '1px 5px', borderRadius: 3, border: '1px solid #fecaca' }}>
            ✂ 페이지 구분
          </span>
        </div>
      ))}
    </>
  );
}

/** 모든 .doc-page 공통 래퍼 — 페이지 구분선 오버레이 + 화면상 페이지 카드 구분(여백/그림자) 포함 */
function DocPage({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className="doc-page"
      style={{ position: 'relative', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', marginBottom: 10, ...style }}
    >
      {children}
      <PageBreakOverlay pageRef={ref} />
    </div>
  );
}

/* ── 섹션 파트 구분 ───────────────────────────── */
const PARTS = [
  { key: 'I', title: 'I. 사업 기본 현황', codes: ['I-1 가','I-1 나','I-1 다','I-1 라','I-1 마','I-1 바','I-2 가','I-2 나','I-2 다','I-2 라'] },
  { key: 'II', title: 'II. 사업 운영 관리', codes: ['II-1','II-2','II-3'] },
  { key: 'III', title: 'III. 모니터링 및 평가', codes: ['III-1','III-2','III-3','III-4'] },
];

function getPart(code: string) {
  return PARTS.find((p) => p.codes.includes(code)) || PARTS[0];
}

/* ── PDM 테이블 (4열, 4계층: Impact→Outcome→Output→Activity) ── */
function PDMTable({ pdm }: { pdm: any[] }) {
  type FlatRow = { indent: number; level: string; code: string; narrative: string; indicators: string; verificationMeans: string; assumptions: string };
  const flatRows: FlatRow[] = [];

  function flatten(row: any, indent = 0) {
    flatRows.push({
      indent, level: row.level, code: row.code || '',
      narrative: row.narrative || '',
      indicators: row.indicators || '',
      verificationMeans: row.verificationMeans || '',
      assumptions: row.assumptions || '',
    });
    if (row.children?.length) row.children.forEach((c: any) => flatten(c, indent + 1));
  }
  pdm.forEach((r) => flatten(r));

  const levelMeta: Record<string, { label: string; bg: string; textColor: string; bold: boolean }> = {
    impact:   { label: '영향 (Impact)',        bg: '#d4d4d4', textColor: '#1a1a1a', bold: true },
    purpose:  { label: '사업목적 (Purpose)',   bg: '#e0e0e0', textColor: '#262626', bold: true },
    outcome:  { label: '성과 (Outcome)',        bg: '#ececec', textColor: '#2e2e2e', bold: true },
    output:   { label: '산출물 (Output)',       bg: '#f5f5f5', textColor: '#3a3a3a', bold: false },
    activity: { label: '활동 (Activity)',       bg: '#ffffff', textColor: '#444444', bold: false },
  };

  const th: CSSProperties = { border: '1px solid #888', padding: '6px 8px', textAlign: 'center', fontWeight: 700, fontSize: '8pt', background: '#d4d4d4', color: '#1a1a1a' };
  const td = (bg: string, color: string, pl = 8): CSSProperties => ({ border: '1px solid #ccc', padding: `5px ${pl}px`, background: bg, color, verticalAlign: 'top', lineHeight: 1.6, fontSize: '8pt' });

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt', marginTop: 4, tableLayout: 'fixed' }}>
      <colgroup>
        <col style={{ width: '32%' }} />
        <col style={{ width: '24%' }} />
        <col style={{ width: '22%' }} />
        <col style={{ width: '22%' }} />
      </colgroup>
      <thead>
        <tr>
          <th style={th}>프로젝트 요약</th>
          <th style={th}>지표 (OVI)</th>
          <th style={th}>지표 증명수단 (MoV)</th>
          <th style={th}>가정 (Assumptions)</th>
        </tr>
      </thead>
      <tbody>
        {flatRows.map((row, i) => {
          const m = levelMeta[row.level] || { label: row.level, bg: '#fff', textColor: '#222', bold: false };
          const pl = 8 + row.indent * 10;
          return (
            <tr key={i}>
              <td style={{ ...td(m.bg, m.textColor, pl), fontWeight: m.bold ? 700 : 400 }}>
                <div style={{ fontSize: '7pt', fontWeight: 700, color: m.textColor, marginBottom: 2, opacity: 0.75 }}>
                  {m.label}{row.code ? ` · ${row.code}` : ''}
                </div>
                <div>{row.narrative}</div>
              </td>
              <td style={td(m.bg, '#333')}>{row.indicators}</td>
              <td style={td(m.bg, '#444')}>{row.verificationMeans}</td>
              <td style={td(m.bg, '#444')}>{row.assumptions}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ── 사업 추진 일정(간트) 테이블 ───────────────────────────── */
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

function ScheduleGanttTable({ activities, startDate, endDate }: { activities: ScheduleActivity[]; startDate: string; endDate: string }) {
  const months = generateMonths(startDate, endDate);
  const yearGroups = groupMonthsByYear(months);
  const codeWidth = 6;
  const nameWidth = 16;
  const monthWidth = (100 - codeWidth - nameWidth) / months.length;

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '6.5pt', marginTop: '8px', tableLayout: 'fixed' }}>
      <colgroup>
        <col style={{ width: `${codeWidth}%` }} />
        <col style={{ width: `${nameWidth}%` }} />
        {months.map((_, idx) => (
          <col key={idx} style={{ width: `${monthWidth}%` }} />
        ))}
      </colgroup>
      <thead>
        <tr style={{ background: '#EEF5D6' }}>
          <th rowSpan={2} style={{ border: '1px solid #999', padding: '4px 2px', textAlign: 'center', fontWeight: 700, verticalAlign: 'middle' }}>코드</th>
          <th rowSpan={2} style={{ border: '1px solid #999', padding: '4px 4px', textAlign: 'left', fontWeight: 700, verticalAlign: 'middle' }}>활동명</th>
          {yearGroups.map((g) => (
            <th key={g.year} colSpan={g.months.length} style={{ border: '1px solid #999', padding: '4px 0', textAlign: 'center', fontWeight: 700, color: '#5a7012', overflow: 'hidden' }}>
              {g.year}차년도
            </th>
          ))}
        </tr>
        <tr style={{ background: '#f5f5f5' }}>
          {months.map((m, idx) => (
            <th key={m} style={{ border: '1px solid #ccc', padding: '2px 0', textAlign: 'center', fontWeight: 600, fontSize: '6pt', overflow: 'hidden' }}>
              {(idx % 12) + 1}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {activities.map((act) => (
          <tr key={act.id}>
            <td style={{ border: '1px solid #bbb', padding: '3px 2px', textAlign: 'center', color: '#888', wordBreak: 'break-all' }}>{act.code}</td>
            <td style={{ border: '1px solid #bbb', padding: '3px 4px', wordBreak: 'break-all', lineHeight: 1.4 }}>{act.name}</td>
            {months.map((_, idx) => (
              <td
                key={idx}
                style={{
                  border: '1px solid #ddd',
                  padding: 0,
                  background: act.periods?.[idx] ? '#8AA81E' : '#fff',
                }}
              />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}


/* ── 문제나무 PDF 렌더러 ─────────────────────── */
type ProblemTreeData = { effects: ProblemTreeNode[]; coreProblem: string; causes: ProblemTreeNode[] };

function ProblemTreePdfView({ tree }: { tree: ProblemTreeData }) {
  const TREE_FONT = "'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif";

  const nodeStyle = (bg: string, border: string, color: string, sz = 8.5): CSSProperties => ({
    background: bg, border: `1.5px solid ${border}`, borderRadius: 6,
    padding: '6px 9px', color, fontSize: sz, lineHeight: 1.5, fontWeight: 500,
    fontFamily: TREE_FONT, textAlign: 'center', wordBreak: 'keep-all', minWidth: 76, maxWidth: 140,
  });

  const vLine = (color: string, h = 14): CSSProperties => ({
    width: 2, height: h, background: color, margin: '0 auto', flexShrink: 0,
  });

  const hBar = (color: string, w: string | number): CSSProperties => ({
    height: 2, background: color, width: w, margin: '0 auto',
  });

  function CauseCol({ node, depth }: { node: ProblemTreeNode; depth: number }) {
    const colors = [
      { bg: '#fffbeb', bd: '#fcd34d', tx: '#92400e' },
      { bg: '#fff7ed', bd: '#fed7aa', tx: '#78350f' },
      { bg: '#fff7ed', bd: '#fdba74', tx: '#9a3412' },
    ];
    const c = colors[Math.min(depth, 2)];
    const hasChildren = node.children && node.children.length > 0;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={nodeStyle(c.bg, c.bd, c.tx, 8.5 - depth * 0.3)}>{node.text}</div>
        {hasChildren && (
          <>
            <div style={vLine('#d97706', 10)} />
            {node.children!.length > 1 && <div style={hBar('#d97706', `${(node.children!.length - 1) * 55}%`)} />}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
              {node.children!.map(child => (
                <div key={child.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {node.children!.length > 1 && <div style={vLine('#d97706', 10)} />}
                  <CauseCol node={child} depth={depth + 1} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  const labelStyle: CSSProperties = { fontSize: 7.5, fontFamily: TREE_FONT, fontWeight: 600, color: '#777', textAlign: 'center', marginBottom: 4, fontStyle: 'italic' };

  return (
    <div style={{ padding: '4px 0 8px', fontFamily: TREE_FONT }}>
      {/* Effects */}
      <div style={labelStyle}>↑ 결과 / 영향 (Effects)</div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
        {tree.effects.map(e => (
          <div key={e.id} style={nodeStyle('#fef2f2', '#fca5a5', '#991b1b')}>{e.text}</div>
        ))}
      </div>

      {/* Connector: effects → core */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0' }}>
        {tree.effects.length > 1 && <div style={hBar('#9ca3af', `${Math.min(tree.effects.length * 32, 70)}%`)} />}
        <div style={vLine('#9ca3af', 16)} />
      </div>

      {/* Core Problem */}
      <div style={labelStyle}>핵심 문제 (Core Problem)</div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ ...nodeStyle('#EEF5D6', '#8AA81E', '#3b5c0a', 10), maxWidth: 240, fontWeight: 700, padding: '9px 16px' }}>
          {tree.coreProblem}
        </div>
      </div>

      {/* Connector: core → causes */}
      {tree.causes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0' }}>
          <div style={vLine('#9ca3af', 16)} />
          {tree.causes.length > 1 && <div style={hBar('#9ca3af', `${Math.min(tree.causes.length * 28, 80)}%`)} />}
        </div>
      )}

      {/* Causes */}
      <div style={labelStyle}>↓ 직접 원인 (Immediate Causes)</div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {tree.causes.map(cause => (
          <div key={cause.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {tree.causes.length > 1 && <div style={vLine('#d97706', 10)} />}
            <CauseCol node={cause} depth={0} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 목표나무 PDF 렌더러 ─────────────────────── */
type ObjectiveTreeData = { impact: string; purpose: string; outcomes: { id: string; text: string; children?: { id: string; text: string }[] }[] };

function ObjectiveTreePdfView({ tree }: { tree: ObjectiveTreeData }) {
  const TREE_FONT = "'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif";
  const ns = (bg: string, bd: string, color: string, sz = 8.5, maxW = 140): CSSProperties => ({
    background: bg, border: `1.5px solid ${bd}`, borderRadius: 6,
    padding: '6px 9px', color, fontSize: sz, lineHeight: 1.5, fontWeight: 500,
    fontFamily: TREE_FONT, textAlign: 'center', wordBreak: 'keep-all', maxWidth: maxW, minWidth: 76,
  });
  const vl = (color: string, h = 12): CSSProperties => ({ width: 2, height: h, background: color, margin: '0 auto', flexShrink: 0 });
  const hb = (color: string, w: string | number): CSSProperties => ({ height: 2, background: color, width: w, margin: '0 auto' });
  const lbl: CSSProperties = { fontSize: 7.5, fontFamily: TREE_FONT, fontWeight: 600, color: '#777', textAlign: 'center', marginBottom: 4, fontStyle: 'italic' };

  return (
    <div style={{ fontFamily: TREE_FONT, padding: '4px 0 8px' }}>
      {/* Impact */}
      <div style={lbl}>영향 (Impact / Goal)</div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ ...ns('#f5f3ff', '#c4b5fd', '#4c1d95', 10, 240), fontWeight: 700, padding: '9px 16px' }}>{tree.impact}</div>
      </div>

      {/* Impact → Purpose */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={vl('#9ca3af', 16)} />
      </div>

      {/* Purpose */}
      <div style={lbl}>사업목적 (Purpose / Outcome)</div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ ...ns('#eff6ff', '#93c5fd', '#1e3a8a', 9.5, 220), fontWeight: 600, padding: '8px 13px' }}>{tree.purpose}</div>
      </div>

      {/* Purpose → Outcomes */}
      {tree.outcomes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={vl('#9ca3af', 16)} />
          {tree.outcomes.length > 1 && <div style={hb('#9ca3af', `${Math.min(tree.outcomes.length * 28, 80)}%`)} />}
        </div>
      )}

      {/* Outcomes + Outputs */}
      <div style={lbl}>성과 (Outcomes) → 산출물 (Outputs)</div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {tree.outcomes.map(oc => (
          <div key={oc.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {tree.outcomes.length > 1 && <div style={vl('#6b7280', 10)} />}
            <div style={ns('#EEF5D6', '#8AA81E', '#3b5c0a', 8.5)}>{oc.text}</div>
            {oc.children && oc.children.length > 0 && (
              <>
                <div style={vl('#10b981', 10)} />
                {oc.children.length > 1 && <div style={hb('#10b981', `${(oc.children.length - 1) * 50}%`)} />}
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                  {oc.children.map(out => (
                    <div key={out.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {oc.children!.length > 1 && <div style={vl('#10b981', 10)} />}
                      <div style={ns('#ecfdf5', '#6ee7b7', '#065f46', 7.5, 120)}>{out.text}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 메인 ─────────────────────────────────────── */
export default function PDFPreviewPage() {
  const router = useRouter();
  const { project, ideation, summary, structure, sections, scheduleActivities, projectDetails } = useProjectStore();
  const pagesRef = useRef<HTMLDivElement>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloading, setDownloading] = useState<'pdf' | 'docx' | null>(null);

  const title = project?.title || summary?.basicInfo?.title || '사업명 미입력';
  const today = new Date();
  const dateStr = `${today.getFullYear()}. ${String(today.getMonth() + 1).padStart(2, '0')}`;
  const coverYear = project?.startDate ? new Date(project.startDate).getFullYear() : today.getFullYear();

  function isSectionFilled(sectionId: string) {
    if (sectionId === 'monitoring-schedule') return scheduleActivities.length > 0;
    return !!sections[sectionId]?.content;
  }

  const filledSections = PROPOSAL_SECTIONS.filter((s) => isSectionFilled(s.id));
  const fileBaseName = (project?.title || title || 'proposal').replace(/[\\/:*?"<>|]/g, '_');

  async function handleDownloadPdf() {
    if (!pagesRef.current) return;
    setDownloading('pdf');
    setDownloadOpen(false);
    try {
      await exportPagesToPdf(pagesRef.current, `${fileBaseName}.pdf`);
    } finally {
      setDownloading(null);
    }
  }

  async function handleDownloadDocx() {
    setDownloading('docx');
    setDownloadOpen(false);
    try {
      await exportToDocx(
        { project, ideation, summary, structure, sections, scheduleActivities, projectDetails },
        `${fileBaseName}.docx`
      );
    } finally {
      setDownloading(null);
    }
  }

  let lastPartKey = '';

  return (
    <div style={{ background: '#e5e7eb', minHeight: '100vh' }}>
      {/* 컨트롤 바 */}
      <div className="no-print" style={{ position: 'sticky', top: 0, zIndex: 50, background: 'white', borderBottom: '1px solid #e5e7eb', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#374151', cursor: 'pointer', background: 'none', border: 'none' }}>
          <ArrowLeft size={16} /> 돌아가기
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#6b7280' }}>작성완료 {filledSections.length}/17 섹션</span>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setDownloadOpen((v) => !v)}
              disabled={downloading !== null}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#8AA81E', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: downloading ? 'default' : 'pointer', fontWeight: 600, opacity: downloading ? 0.7 : 1 }}
            >
              <Download size={14} /> {downloading === 'pdf' ? 'PDF 생성 중...' : downloading === 'docx' ? '워드 생성 중...' : '다운로드'}
            </button>
            {downloadOpen && (
              <div style={{ position: 'absolute', top: '110%', right: 0, background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', overflow: 'hidden', minWidth: 180, zIndex: 60 }}>
                <button
                  onClick={handleDownloadPdf}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', fontSize: 13, color: '#374151', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <FileText size={15} color="#dc2626" /> PDF로 다운로드
                </button>
                <button
                  onClick={handleDownloadDocx}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', fontSize: 13, color: '#374151', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderTop: '1px solid #f1f1f1' }}
                >
                  <FileType size={15} color="#2563eb" /> Word 문서로 다운로드
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* A4 페이지들 */}
      <div ref={pagesRef} style={{ maxWidth: 794, margin: '24px auto', paddingBottom: 48 }}>

        {/* ── 표지 ── */}
        {(() => {
          const location = [project?.country, project?.region || ideation?.subRegion].filter(Boolean).join(' ');
          const field = project?.field || ideation?.field || '';
          const org = project?.organization || '굿네이버스';
          const startY = project?.startDate ? String(new Date(project.startDate).getFullYear()).slice(2) : '';
          const endY   = project?.endDate   ? String(new Date(project.endDate).getFullYear()).slice(2)   : '';
          const budget = project?.budget ? `${Number(project.budget).toLocaleString()}백만원` : '';
          const phaseInfo = [startY && endY ? `${startY}-${endY}` : '', budget].filter(Boolean).join('/');
          const docLabel = projectDetails.programType
            ? `- ${projectDetails.programType}사업 사업실행계획서 -`
            : '- 사업제안서 -';
          return (
            <DocPage style={{ background: 'white', minHeight: 1123, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '80px 60px' }}>
              {/* 중앙 테두리 박스 */}
              <div style={{ border: '2px solid #111', padding: '52px 64px', textAlign: 'center', minWidth: 420, maxWidth: 520 }}>
                {location && (
                  <p style={{ fontWeight: 700, fontSize: '20pt', marginBottom: 20 }}>{location}</p>
                )}
                <p style={{ fontSize: '14pt', lineHeight: 1.8, marginBottom: 20, wordBreak: 'keep-all' }}>
                  {title}
                </p>
                {phaseInfo && (
                  <p style={{ fontSize: '11pt', color: '#444', marginBottom: 16 }}>({phaseInfo})</p>
                )}
                {projectDetails.documentNote && (
                  <p style={{ fontSize: '10pt', color: '#555', marginBottom: 12 }}>{projectDetails.documentNote}</p>
                )}
                <p style={{ fontSize: '13pt', fontWeight: 700, marginTop: 8 }}>{docLabel}</p>
              </div>

              {/* 하단 정보 */}
              <div style={{ marginTop: 80, textAlign: 'center', fontSize: '12pt', lineHeight: 2.2 }}>
                <p>{[field, org].filter(Boolean).join(' / ')}</p>
                <p>{dateStr}</p>
              </div>
            </DocPage>
          );
        })()}

        {/* ── 목차 ── */}
        <DocPage style={{ background: 'white', padding: '60px 60px' }}>
          <h2 style={{ fontSize: '14pt', fontWeight: 700, borderBottom: '2px solid #111', paddingBottom: 8, marginBottom: 24 }}>목 차</h2>
          {PROPOSAL_SECTIONS.map((section) => {
            const filled = isSectionFilled(section.id);
            return (
              <div key={section.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px dotted #ccc', fontSize: '10pt' }}>
                <span style={{ color: filled ? '#111' : '#aaa' }}>
                  <span style={{ fontWeight: 600, marginRight: 8 }}>{section.code}</span>{section.title}
                </span>
                <span style={{ color: filled ? '#8AA81E' : '#ccc', fontSize: '9pt' }}>{filled ? '●' : '○'}</span>
              </div>
            );
          })}
        </DocPage>

        {/* ── 사업개요서 ── */}
        {summary && (
          <DocPage style={{ background: 'white', padding: '60px 60px' }}>
            <h2 style={{ fontSize: '14pt', fontWeight: 700, borderBottom: '2px solid #111', paddingBottom: 6, marginBottom: 20 }}>사업 개요</h2>
            <SummaryBlock label="사업명" value={summary.basicInfo?.title} />
            <SummaryBlock label="사업 요약" value={summary.basicInfo?.summary} />
            <SummaryBlock label="사업 배경" value={summary.background?.background} />
            <SummaryBlock label="수요 분석" value={summary.background?.demandAnalysis} />
            <SummaryBlock label="Impact" value={summary.objectives?.impact} />
            <SummaryBlock label="사업목적" value={summary.objectives?.purpose} />
            <SummaryBlock label="주요 성과" value={summary.objectives?.outcomes} />
            <SummaryBlock label="직접 수혜자" value={summary.beneficiaries?.direct} />
            <SummaryBlock label="간접 수혜자" value={summary.beneficiaries?.indirect} />
            <SummaryBlock label="수행 방법" value={summary.implementation?.approach} />
            <SummaryBlock label="파트너십 전략" value={summary.implementation?.partnershipStrategy} />
            <SummaryBlock label="리스크 관리" value={summary.risks?.mainRisks} />
            <SummaryBlock label="지속가능성" value={summary.risks?.sustainabilityPlan} />
          </DocPage>
        )}

        {/* ── 17개 섹션 ── */}
        {PROPOSAL_SECTIONS.map((section) => {
          const isSchedule = section.id === 'monitoring-schedule';
          const isPdm = section.id === 'plan-pdm';
          const isProblemTree = section.id === 'basis-problem';
          const isObjTree = section.id === 'basis-objective';
          const content = sections[section.id]?.content;

          const hasPdm = isPdm && structure?.pdm && structure.pdm.length > 0;
          const hasProblemTree = isProblemTree && !!structure?.problemTree?.coreProblem;
          const hasObjTree = isObjTree && !!(structure?.objectiveTree?.impact || structure?.objectiveTree?.purpose);

          if (isSchedule) { if (scheduleActivities.length === 0) return null; }
          else if (isPdm) { if (!hasPdm) return null; }
          else if (isProblemTree) { if (!hasProblemTree && !content) return null; }
          else if (isObjTree) { if (!hasObjTree && !content) return null; }
          else { if (!content) return null; }

          const part = getPart(section.code);
          const showPartHeader = part.key !== lastPartKey;
          if (showPartHeader) lastPartKey = part.key;

          return (
            <div key={section.id}>
              {showPartHeader && (
                <div style={{ background: '#1a1a1a', color: 'white', padding: '10px 20px', marginBottom: 2 }}>
                  <p style={{ fontSize: '11pt', fontWeight: 700 }}>{part.title}</p>
                </div>
              )}
              <DocPage style={{ background: 'white', padding: '48px 60px' }}>
                <h3 style={{ fontSize: '13pt', fontWeight: 700, marginBottom: 16, paddingBottom: 6, borderBottom: '1px solid #ccc' }}>
                  {section.code}. {section.title}
                </h3>
                {isSchedule ? (
                  <ScheduleGanttTable
                    activities={scheduleActivities}
                    startDate={project?.startDate || ''}
                    endDate={project?.endDate || ''}
                  />
                ) : isPdm ? (
                  <PDMTable pdm={structure!.pdm} />
                ) : isProblemTree ? (
                  <>
                    {hasProblemTree && (
                      <div className={PDF_ATOMIC_CLASS}>
                        <p style={{ fontSize: '8pt', color: '#888', marginBottom: 6, fontStyle: 'italic' }}>문제나무 (Problem Tree)</p>
                        <div style={{ border: '1px solid #D9E6B7', borderRadius: 8, padding: '12px 8px', marginBottom: 16, background: '#fafbf6' }}>
                          <ProblemTreePdfView tree={structure!.problemTree!} />
                        </div>
                      </div>
                    )}
                    {content && (
                      <div className="doc-content" dangerouslySetInnerHTML={{ __html: content }} />
                    )}
                  </>
                ) : isObjTree ? (
                  <>
                    {hasObjTree && (
                      <div className={PDF_ATOMIC_CLASS}>
                        <p style={{ fontSize: '8pt', color: '#888', marginBottom: 6, fontStyle: 'italic' }}>목표나무 (Objective Tree)</p>
                        <div style={{ border: '1px solid #D9E6B7', borderRadius: 8, padding: '12px 8px', marginBottom: 16, background: '#fafbf6' }}>
                          <ObjectiveTreePdfView tree={structure!.objectiveTree!} />
                        </div>
                      </div>
                    )}
                    {content && (
                      <div className="doc-content" dangerouslySetInnerHTML={{ __html: content }} />
                    )}
                  </>
                ) : (
                  <div
                    className="doc-content"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                )}
              </DocPage>
            </div>
          );
        })}

        {filledSections.length === 0 && !summary && (
          <div style={{ background: 'white', padding: 80, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
            작성된 내용이 없습니다. 섹션을 작성하고 돌아오세요.
          </div>
        )}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; }
          .doc-page { box-shadow: none !important; margin: 0 !important; }
          @page { margin: 15mm; size: A4; }
        }
        .doc-content { font-size: 10pt; line-height: 1.9; color: #222; }
        .doc-content h1 { font-size: 12pt; font-weight: 700; margin: 12px 0 6px; }
        .doc-content h2 { font-size: 11pt; font-weight: 700; margin: 10px 0 5px; }
        .doc-content h3 { font-size: 10.5pt; font-weight: 600; margin: 8px 0 4px; }
        .doc-content p { margin: 4px 0; }
        .doc-content ul, .doc-content ol { padding-left: 20px; margin: 4px 0; }
        .doc-content li { margin: 2px 0; }
        .doc-content table { width: 100%; border-collapse: collapse; font-size: 9pt; margin: 8px 0; }
        .doc-content th, .doc-content td { border: 1px solid #aaa; padding: 5px 8px; }
        .doc-content th { background: #f5f5f5; font-weight: 600; }
        .doc-content strong, .doc-content b { font-weight: 700; }
      `}</style>
    </div>
  );
}

function SummaryBlock({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontSize: '9pt', fontWeight: 700, color: '#555', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ fontSize: '10pt', lineHeight: 1.8, color: '#222', whiteSpace: 'pre-line', paddingLeft: 8, borderLeft: '3px solid #8AA81E' }}>{value}</p>
    </div>
  );
}
