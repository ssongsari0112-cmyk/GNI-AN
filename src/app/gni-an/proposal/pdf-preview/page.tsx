'use client';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/lib/store/projectStore';
import { PROPOSAL_SECTIONS } from '@/types';
import { ArrowLeft, Printer } from 'lucide-react';

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

/* ── 메인 ─────────────────────────────────────── */
export default function PDFPreviewPage() {
  const router = useRouter();
  const { project, ideation, summary, structure, sections } = useProjectStore();

  const title = project?.title || summary?.basicInfo?.title || '사업명 미입력';
  const country = ideation?.country || project?.country || '';
  const subRegion = ideation?.subRegion || '';
  const field = ideation?.field || project?.field || '';
  const budget = ideation?.budget ? `${ideation.budget}백만원` : '';
  const duration = ideation?.duration ? `${ideation.duration}개월` : '';
  const today = new Date();
  const dateStr = `${today.getFullYear()}. ${String(today.getMonth() + 1).padStart(2, '0')}.`;

  const filledSections = PROPOSAL_SECTIONS.filter((s) => sections[s.id]?.content);

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
          <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#8AA81E', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
            <Printer size={14} /> 인쇄 / PDF 저장
          </button>
        </div>
      </div>

      {/* A4 페이지들 */}
      <div style={{ maxWidth: 794, margin: '24px auto', paddingBottom: 48 }}>

        {/* ── 표지 ── */}
        <div className="doc-page" style={{ background: 'white', minHeight: 1123, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '80px 60px', pageBreakAfter: 'always' }}>
          {/* 중앙 테두리 박스 */}
          <div style={{ border: '2px solid #111', padding: '48px 60px', textAlign: 'center', minWidth: 400, maxWidth: 500 }}>
            <p style={{ fontWeight: 700, fontSize: '18pt', marginBottom: 12 }}>
              {country} {subRegion && `${subRegion}`}
            </p>
            <p style={{ fontSize: '13pt', lineHeight: 1.6, marginBottom: 16 }}>{title}</p>
            {(budget || duration) && (
              <p style={{ fontSize: '10pt', color: '#444', marginBottom: 16 }}>
                {duration && `사업기간: ${duration}`}{duration && budget && ' / '}{budget && `총사업비: ${budget}`}
              </p>
            )}
            <p style={{ fontSize: '12pt', fontWeight: 600, marginTop: 8 }}>- 사업제안서 -</p>
          </div>

          {/* 하단 정보 */}
          <div style={{ marginTop: 72, textAlign: 'center', fontSize: '11pt', lineHeight: 2 }}>
            <p>{field && `${field} / `}굿네이버스</p>
            <p>{dateStr}</p>
          </div>
        </div>

        {/* ── 목차 ── */}
        <div className="doc-page" style={{ background: 'white', padding: '60px 60px', pageBreakAfter: 'always' }}>
          <h2 style={{ fontSize: '14pt', fontWeight: 700, borderBottom: '2px solid #111', paddingBottom: 8, marginBottom: 24 }}>목 차</h2>
          {PROPOSAL_SECTIONS.map((section) => {
            const filled = !!sections[section.id]?.content;
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
          const content = sections[section.id]?.content;
          if (!content) return null;

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
                <div
                  className="doc-content"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
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
