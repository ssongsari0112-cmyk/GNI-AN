'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/lib/store/projectStore';
import { PROPOSAL_SECTIONS, SECTOR_OPTIONS } from '@/types';
import type { ScheduleActivity, ProjectDetails } from '@/types';
import { ArrowLeft, Download, FileText, FileType } from 'lucide-react';
import type { CSSProperties } from 'react';
import { exportPagesToPdf } from '@/lib/export/pdfExport';
import { exportToDocx } from '@/lib/export/docxExport';

/* ── 섹션 파트 구분 ───────────────────────────── */
const PARTS = [
  { key: 'I', title: 'I. 사업 기본 현황', codes: ['I-1 가','I-1 나','I-1 다','I-1 라','I-1 마','I-1 바','I-2 가','I-2 나','I-2 다','I-2 라'] },
  { key: 'II', title: 'II. 사업 운영 관리', codes: ['II-1','II-2','II-3'] },
  { key: 'III', title: 'III. 모니터링 및 평가', codes: ['III-1','III-2','III-3','III-4'] },
];

function getPart(code: string) {
  return PARTS.find((p) => p.codes.includes(code)) || PARTS[0];
}

/* ── PDM 테이블 ───────────────────────────────── */
function PDMTable({ pdm }: { pdm: any[] }) {
  const flatRows: { indent: number; level: string; code: string; narrative: string; indicators: string; verificationMeans: string; assumptions: string }[] = [];

  function flatten(row: any, indent = 0) {
    flatRows.push({ indent, level: row.level, code: row.code, narrative: row.narrative, indicators: row.indicators || '', verificationMeans: row.verificationMeans || '', assumptions: row.assumptions || '' });
    if (row.children?.length) row.children.forEach((c: any) => flatten(c, indent + 1));
  }
  pdm.forEach((r) => flatten(r));

  const levelLabels: Record<string, string> = { impact: '영향(Impact)', purpose: '사업목적(Purpose)', outcome: '산출물(Outputs)', output: '개발활동(Activities)' };
  const levelBg: Record<string, string> = { impact: '#f3e8ff', purpose: '#dbeafe', outcome: '#dcfce7', output: '#fef9c3' };

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', marginTop: '8px' }}>
      <thead>
        <tr style={{ background: '#f0f0f0' }}>
          {['프로젝트 요약', '내용', '지표', '지표 증명 수단', '가정'].map((h) => (
            <th key={h} style={{ border: '1px solid #999', padding: '5px 7px', textAlign: 'center', fontWeight: 700, fontSize: '8pt' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {flatRows.map((row, i) => (
          <tr key={i} style={{ background: levelBg[row.level] || '#fff' }}>
            <td style={{ border: '1px solid #bbb', padding: '5px 7px', fontWeight: 600, whiteSpace: 'nowrap', paddingLeft: `${7 + row.indent * 12}px`, fontSize: '8pt' }}>
              {levelLabels[row.level] || row.level}
            </td>
            <td style={{ border: '1px solid #bbb', padding: '5px 7px' }}>{row.narrative}</td>
            <td style={{ border: '1px solid #bbb', padding: '5px 7px' }}>{row.indicators}</td>
            <td style={{ border: '1px solid #bbb', padding: '5px 7px' }}>{row.verificationMeans}</td>
            <td style={{ border: '1px solid #bbb', padding: '5px 7px' }}>{row.assumptions}</td>
          </tr>
        ))}
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

/* ── 제안사업 요약서 (사업개요 표) ───────────────────────────── */
function ProjectSummaryTable({ project, ideation, details }: { project: any; ideation: any; details: ProjectDetails }) {
  const cellStyle: CSSProperties = { border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' };
  const labelStyle: CSSProperties = { ...cellStyle, background: '#EEF5D6', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' };

  const totalKoica = details.yearlyBudgets.reduce((s, y) => s + (y.koica || 0), 0);
  const totalPartner = details.yearlyBudgets.reduce((s, y) => s + (y.partner || 0), 0);

  const programTypes: ('HDP-N' | '긴급재난대응')[] = ['HDP-N', '긴급재난대응'];

  const yearLabels = ['1차', '2차', '3차', '4차', '5차', '6차', '7차', '8차'];

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', tableLayout: 'fixed' }}>
      <colgroup>
        <col style={{ width: '15%' }} />
        <col style={{ width: '85%' }} />
      </colgroup>
      <tbody>
        <tr>
          <td style={labelStyle}>단체명</td>
          <td style={cellStyle}>{project?.organization || '-'}</td>
        </tr>
        <tr>
          <td style={labelStyle}>사업명</td>
          <td style={cellStyle}>{project?.title || '-'}</td>
        </tr>
        <tr>
          <td style={labelStyle}>사업지역</td>
          <td style={cellStyle}>{[project?.country, project?.region || ideation?.subRegion].filter(Boolean).join(' ') || '-'}</td>
        </tr>
        <tr>
          <td style={labelStyle}>사업기간</td>
          <td style={cellStyle}>
            {project?.startDate || '-'} ~ {project?.endDate || '-'}
            {details.yearlyBudgets.length > 0 && ` (${details.yearlyBudgets.length}개년)`}
          </td>
        </tr>
        <tr>
          <td style={labelStyle}>사업비</td>
          <td style={{ ...cellStyle, padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
              <tbody>
                {details.yearlyBudgets.map((y, idx) => (
                  <tr key={y.year}>
                    <td style={{ border: '1px solid #ccc', padding: '4px 8px', width: 60 }}>{yearLabels[idx] || `${y.year}차`} 연도</td>
                    <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>
                      총 {(y.koica + y.partner).toLocaleString()}원 / KOICA분담금 {y.koica.toLocaleString()}원, 파트너분담금 {y.partner.toLocaleString()}원
                    </td>
                  </tr>
                ))}
                <tr>
                  <td style={{ border: '1px solid #ccc', padding: '4px 8px', fontWeight: 700 }}>총 사업비</td>
                  <td style={{ border: '1px solid #ccc', padding: '4px 8px', fontWeight: 700 }}>
                    총 {(totalKoica + totalPartner).toLocaleString()}원 / KOICA분담금 {totalKoica.toLocaleString()}원, 파트너분담금 {totalPartner.toLocaleString()}원
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
        <tr>
          <td style={labelStyle}>신청자금 및 사업유형</td>
          <td style={cellStyle}>
            <div style={{ display: 'flex', gap: 32 }}>
              {programTypes.map((t) => (
                <span key={t}>{details.programType === t ? '☑' : '☐'} {t}</span>
              ))}
            </div>
          </td>
        </tr>
        <tr>
          <td style={labelStyle}>사업분야</td>
          <td style={cellStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px 8px' }}>
              {SECTOR_OPTIONS.map((s) => (
                <span key={s}>{details.sectors.includes(s) ? '☑' : '☐'} {s}</span>
              ))}
            </div>
          </td>
        </tr>
        <tr>
          <td style={labelStyle}>사업대상</td>
          <td style={cellStyle}>
            직접 수혜자: {details.directBeneficiaries || '-'} / 간접 수혜자: {details.indirectBeneficiaries || '-'}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/* ── 사업담당자 / 파트너기관 / 운영역할 / 좌표 테이블 ───────────────────────────── */
function TeamPartnerTable({ project, details }: { project: any; details: ProjectDetails }) {
  const cellStyle: CSSProperties = { border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' };
  const labelStyle: CSSProperties = { ...cellStyle, background: '#EEF5D6', fontWeight: 700, textAlign: 'center' };

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', marginTop: '8px' }}>
      <tbody>
        <tr>
          <td colSpan={2} style={labelStyle}>사업담당자 구성</td>
        </tr>
        <tr>
          <td style={{ ...cellStyle, width: '50%', verticalAlign: 'top' }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>국내</div>
            {details.domesticManagers.length > 0 ? details.domesticManagers.map((m) => (
              <div key={m.id}>{m.role}{m.name && ` (${m.name})`}</div>
            )) : <div style={{ color: '#999' }}>-</div>}
          </td>
          <td style={{ ...cellStyle, width: '50%', verticalAlign: 'top' }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>현지</div>
            {details.fieldManagers.map((m) => (
              <div key={m.id}>{m.role}{m.name && ` ${m.name}`}</div>
            ))}
            {details.fieldRepresentative && <div>{details.fieldRepresentative}</div>}
            {details.fieldManagers.length === 0 && !details.fieldRepresentative && <div style={{ color: '#999' }}>-</div>}
          </td>
        </tr>

        <tr>
          <td colSpan={2} style={{ ...labelStyle, padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #999', padding: '6px 8px' }}>파트너기관명</th>
                  <th style={{ border: '1px solid #999', padding: '6px 8px' }}>한국 수행기관-현지 파트너 관계</th>
                  <th style={{ border: '1px solid #999', padding: '6px 8px' }}>현지 정부 등록 여부</th>
                </tr>
              </thead>
              <tbody>
                {details.partners.length > 0 ? details.partners.map((p) => (
                  <tr key={p.id} style={{ fontWeight: 400, background: '#fff' }}>
                    <td style={{ border: '1px solid #ccc', padding: '4px 8px', textAlign: 'center' }}>{p.name || '-'}</td>
                    <td style={{ border: '1px solid #ccc', padding: '4px 8px', textAlign: 'center' }}>{p.relationship || '-'}</td>
                    <td style={{ border: '1px solid #ccc', padding: '4px 8px', textAlign: 'center' }}>{p.govRegistered ? '등록' : '미등록'}</td>
                  </tr>
                )) : (
                  <tr style={{ background: '#fff' }}>
                    <td style={{ border: '1px solid #ccc', padding: '4px 8px', textAlign: 'center', color: '#999' }} colSpan={3}>입력된 파트너기관이 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </td>
        </tr>

        <tr>
          <td colSpan={2} style={labelStyle}>운영 역할</td>
        </tr>
        <tr>
          <td style={{ ...cellStyle, width: '50%', textAlign: 'center' }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>한국 수행기관</div>
            {project?.organization || '-'}
          </td>
          <td style={{ ...cellStyle, width: '50%', textAlign: 'center' }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>현지 파트너</div>
            {details.partners[0]?.name || '-'}
          </td>
        </tr>

        {details.coordinates && (
          <>
            <tr>
              <td colSpan={2} style={labelStyle}>사업 시행지 좌표</td>
            </tr>
            <tr>
              <td colSpan={2} style={cellStyle}>
                링크(Google Maps): {details.coordinates}
              </td>
            </tr>
          </>
        )}
      </tbody>
    </table>
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
        <div className="doc-page" style={{ background: 'white', minHeight: 1123, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '80px 60px', pageBreakAfter: 'always' }}>
          {/* 중앙 테두리 박스 */}
          <div style={{ border: '2px solid #111', padding: '48px 60px', textAlign: 'center', minWidth: 400, maxWidth: 500 }}>
            <p style={{ fontSize: '13pt', marginBottom: 8 }}>{coverYear}년</p>
            <p style={{ fontWeight: 700, fontSize: '16pt', lineHeight: 1.6, marginBottom: 8 }}>
              {projectDetails.programName || title}
            </p>
            {projectDetails.programType && (
              <p style={{ fontSize: '13pt', marginBottom: 8 }}>{projectDetails.programType}사업</p>
            )}
            <p style={{ fontSize: '14pt', fontWeight: 700, marginTop: 16 }}>사업실행계획서</p>
          </div>

          {/* 하단 정보 */}
          <div style={{ marginTop: 72, textAlign: 'center', fontSize: '12pt', lineHeight: 2 }}>
            <p style={{ fontWeight: 700 }}>- {project?.organization || '굿네이버스'} -</p>
            <p>{dateStr}{projectDetails.documentNote && ` (${projectDetails.documentNote})`}</p>
          </div>
        </div>

        {/* ── 목차 ── */}
        <div className="doc-page" style={{ background: 'white', padding: '60px 60px', pageBreakAfter: 'always' }}>
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
        </div>

        {/* ── 1. 제안사업 요약서 ── */}
        <div className="doc-page" style={{ background: 'white', padding: '48px 60px', pageBreakAfter: 'always' }}>
          <h3 style={{ fontSize: '13pt', fontWeight: 700, marginBottom: 16, paddingBottom: 6, borderBottom: '1px solid #ccc' }}>
            1. 제안사업 요약서
          </h3>
          <ProjectSummaryTable project={project} ideation={ideation} details={projectDetails} />

          <h3 style={{ fontSize: '13pt', fontWeight: 700, margin: '28px 0 16px', paddingBottom: 6, borderBottom: '1px solid #ccc' }}>
            2. 사업담당자 및 파트너기관 정보
          </h3>
          <TeamPartnerTable project={project} details={projectDetails} />
        </div>

        {/* ── 사업개요서 ── */}
        {summary && (
          <div className="doc-page" style={{ background: 'white', padding: '60px 60px', pageBreakAfter: 'always' }}>
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
          </div>
        )}

        {/* ── PDM ── */}
        {structure?.pdm && structure.pdm.length > 0 && (
          <div className="doc-page" style={{ background: 'white', padding: '60px 60px', pageBreakAfter: 'always' }}>
            <h2 style={{ fontSize: '14pt', fontWeight: 700, borderBottom: '1px solid #111', paddingBottom: 6, marginBottom: 12 }}>
              사업 논리 모형 (Project Design Matrix)
            </h2>
            <PDMTable pdm={structure.pdm} />
          </div>
        )}

        {/* ── 17개 섹션 ── */}
        {PROPOSAL_SECTIONS.map((section) => {
          const isSchedule = section.id === 'monitoring-schedule';
          const isPdm = section.id === 'plan-pdm';
          const content = sections[section.id]?.content;

          // plan-pdm은 structure.pdm 데이터로 표 렌더링 (content는 JSON 원문이라 무시)
          const hasPdm = isPdm && structure?.pdm && structure.pdm.length > 0;
          if (isSchedule ? scheduleActivities.length === 0 : isPdm ? !hasPdm : !content) return null;

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
              <div className="doc-page" style={{ background: 'white', padding: '48px 60px', pageBreakAfter: 'always' }}>
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
                ) : (
                  <div
                    className="doc-content"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                )}
              </div>
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
