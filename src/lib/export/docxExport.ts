import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, VerticalMergeType, VerticalAlign } from 'docx';
import { htmlToDocxElements } from './htmlToDocx';
import { PROPOSAL_SECTIONS, SECTOR_OPTIONS } from '@/types';
import type { Project, IdeationData, ProjectSummary, StructureData, ProposalSection, ScheduleActivity, ProjectDetails, PDMRow } from '@/types';

interface ExportData {
  project: Project | null;
  ideation: IdeationData | null;
  summary: ProjectSummary | null;
  structure: StructureData | null;
  sections: Record<string, ProposalSection>;
  scheduleActivities: ScheduleActivity[];
  projectDetails: ProjectDetails;
}

const LABEL_FILL = 'EEF5D6';

function labelCell(text: string, rowSpan?: number): TableCell {
  return new TableCell({
    rowSpan,
    shading: { fill: LABEL_FILL },
    width: { size: 18, type: WidthType.PERCENTAGE },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true })] })],
  });
}

function valueCell(children: Paragraph[]): TableCell {
  return new TableCell({
    width: { size: 82, type: WidthType.PERCENTAGE },
    children,
  });
}

function textRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [labelCell(label), valueCell([new Paragraph(value || '-')])],
  });
}

function buildSummaryTable({ project, ideation, details }: { project: Project | null; ideation: IdeationData | null; details: ProjectDetails }): Table {
  const yearLabels = ['1차', '2차', '3차', '4차', '5차', '6차', '7차', '8차'];
  const totalKoica = details.yearlyBudgets.reduce((s, y) => s + (y.koica || 0), 0);
  const totalPartner = details.yearlyBudgets.reduce((s, y) => s + (y.partner || 0), 0);
  const programTypes: ('HDP-N' | '긴급재난대응')[] = ['HDP-N', '긴급재난대응'];

  const budgetParagraphs: Paragraph[] = details.yearlyBudgets.map((y, idx) =>
    new Paragraph(
      `${yearLabels[idx] || `${y.year}차`} 연도: 총 ${(y.koica + y.partner).toLocaleString()}원 ` +
      `(KOICA분담금 ${y.koica.toLocaleString()}원, 파트너분담금 ${y.partner.toLocaleString()}원)`
    )
  );
  budgetParagraphs.push(
    new Paragraph({
      children: [new TextRun({
        text: `총 사업비: 총 ${(totalKoica + totalPartner).toLocaleString()}원 ` +
          `(KOICA분담금 ${totalKoica.toLocaleString()}원, 파트너분담금 ${totalPartner.toLocaleString()}원)`,
        bold: true,
      })],
    })
  );
  if (budgetParagraphs.length === 1) budgetParagraphs.unshift(new Paragraph('-'));

  const periodText = `${project?.startDate || '-'} ~ ${project?.endDate || '-'}` +
    (details.yearlyBudgets.length > 0 ? ` (${details.yearlyBudgets.length}개년)` : '');

  const programTypeLine = programTypes.map((t) => `${details.programType === t ? '☑' : '☐'} ${t}`).join('   ');
  const sectorLines: string[] = [];
  for (let i = 0; i < SECTOR_OPTIONS.length; i += 4) {
    sectorLines.push(SECTOR_OPTIONS.slice(i, i + 4).map((s) => `${details.sectors.includes(s) ? '☑' : '☐'} ${s}`).join('   '));
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      textRow('단체명', project?.organization || '-'),
      textRow('사업명', project?.title || '-'),
      textRow('사업지역', [project?.country, project?.region || ideation?.subRegion].filter(Boolean).join(' ') || '-'),
      textRow('사업기간', periodText),
      new TableRow({ children: [labelCell('사업비'), valueCell(budgetParagraphs)] }),
      new TableRow({ children: [labelCell('신청자금 및 사업유형'), valueCell([new Paragraph(programTypeLine)])] }),
      new TableRow({ children: [labelCell('사업분야'), valueCell(sectorLines.map((l) => new Paragraph(l)))] }),
      textRow('사업대상', `직접 수혜자: ${details.directBeneficiaries || '-'} / 간접 수혜자: ${details.indirectBeneficiaries || '-'}`),
    ],
  });
}

function buildTeamPartnerTable({ project, details }: { project: Project | null; details: ProjectDetails }): Table {
  const domesticParas = details.domesticManagers.length > 0
    ? details.domesticManagers.map((m) => new Paragraph(`${m.role}${m.name ? ` (${m.name})` : ''}`))
    : [new Paragraph('-')];

  const fieldParas: Paragraph[] = [];
  details.fieldManagers.forEach((m) => fieldParas.push(new Paragraph(`${m.role}${m.name ? ` ${m.name}` : ''}`)));
  if (details.fieldRepresentative) fieldParas.push(new Paragraph(details.fieldRepresentative));
  if (fieldParas.length === 0) fieldParas.push(new Paragraph('-'));

  const partnerRows: TableRow[] = [
    new TableRow({
      children: ['파트너기관명', '한국 수행기관-현지 파트너 관계', '현지 정부 등록 여부'].map((h) =>
        new TableCell({ shading: { fill: LABEL_FILL }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true })] })] })
      ),
    }),
  ];
  if (details.partners.length > 0) {
    details.partners.forEach((p) => {
      partnerRows.push(new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, text: p.name || '-' })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, text: p.relationship || '-' })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, text: p.govRegistered ? '등록' : '미등록' })] }),
        ],
      }));
    });
  } else {
    partnerRows.push(new TableRow({
      children: [new TableCell({ columnSpan: 3, children: [new Paragraph({ alignment: AlignmentType.CENTER, text: '입력된 파트너기관이 없습니다.' })] })],
    }));
  }

  const operationRows: TableRow[] = [
    new TableRow({ children: [new TableCell({ columnSpan: 2, shading: { fill: LABEL_FILL }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '운영 역할', bold: true })] })] })] }),
    new TableRow({
      children: [
        new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '한국 수행기관', bold: true })] }), new Paragraph({ alignment: AlignmentType.CENTER, text: project?.organization || '-' })] }),
        new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '현지 파트너', bold: true })] }), new Paragraph({ alignment: AlignmentType.CENTER, text: details.partners[0]?.name || '-' })] }),
      ],
    }),
  ];

  const coordRows: TableRow[] = details.coordinates ? [
    new TableRow({ children: [new TableCell({ columnSpan: 2, shading: { fill: LABEL_FILL }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '사업 시행지 좌표', bold: true })] })] })] }),
    new TableRow({ children: [new TableCell({ columnSpan: 2, children: [new Paragraph(`링크(Google Maps): ${details.coordinates}`)] })] }),
  ] : [];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [new TableCell({ columnSpan: 2, shading: { fill: LABEL_FILL }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '사업담당자 구성', bold: true })] })] })] }),
      new TableRow({
        children: [
          new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: '국내', bold: true })] }), ...domesticParas] }),
          new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: '현지', bold: true })] }), ...fieldParas] }),
        ],
      }),
      new TableRow({ children: [new TableCell({ columnSpan: 2, shading: { fill: LABEL_FILL }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '파트너기관 정보', bold: true })] })] })] }),
      ...partnerRows,
      ...operationRows,
      ...coordRows,
    ],
  });
}

function buildScheduleTable(activities: ScheduleActivity[], startDate: string, endDate: string): Table {
  const months = generateMonths(startDate, endDate);
  const yearGroups = groupMonthsByYear(months);

  const codeWidth = 6;
  const nameWidth = 16;
  const monthWidth = months.length > 0 ? (100 - codeWidth - nameWidth) / months.length : 0;

  const headerRow1 = new TableRow({
    children: [
      new TableCell({
        verticalMerge: VerticalMergeType.RESTART,
        verticalAlign: VerticalAlign.CENTER,
        shading: { fill: LABEL_FILL },
        width: { size: codeWidth, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '코드', bold: true })] })],
      }),
      new TableCell({
        verticalMerge: VerticalMergeType.RESTART,
        verticalAlign: VerticalAlign.CENTER,
        shading: { fill: LABEL_FILL },
        width: { size: nameWidth, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: '활동명', bold: true })] })],
      }),
      ...yearGroups.map((g) =>
        new TableCell({
          columnSpan: g.months.length,
          shading: { fill: LABEL_FILL },
          width: { size: monthWidth * g.months.length, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${g.year}차년도`, bold: true })] })],
        })
      ),
    ],
  });

  const headerRow2 = new TableRow({
    children: [
      new TableCell({ verticalMerge: VerticalMergeType.CONTINUE, children: [new Paragraph('')] }),
      new TableCell({ verticalMerge: VerticalMergeType.CONTINUE, children: [new Paragraph('')] }),
      ...months.map((_, idx) =>
        new TableCell({
          shading: { fill: 'F5F5F5' },
          width: { size: monthWidth, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, text: String((idx % 12) + 1) })],
        })
      ),
    ],
  });

  const rows: TableRow[] = [headerRow1, headerRow2];

  activities.forEach((act) => {
    rows.push(new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, text: act.code })] }),
        new TableCell({ children: [new Paragraph(act.name)] }),
        ...months.map((_, idx) =>
          new TableCell({
            shading: act.periods?.[idx] ? { fill: '8AA81E' } : undefined,
            children: [new Paragraph('')],
          })
        ),
      ],
    }));
  });

  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
}

function generateMonths(startDate: string, endDate: string): string[] {
  if (!startDate || !endDate) return [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const months: string[] = [];
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

function summaryBlock(label: string, value?: string): Paragraph[] {
  if (!value) return [];
  return [
    new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: label, bold: true })] }),
    new Paragraph({ spacing: { after: 80 }, text: value }),
  ];
}

function buildPdmTable(pdm: PDMRow[]): Table {
  const levelLabels: Record<string, string> = { impact: '영향(Impact)', purpose: '사업목적(Purpose)', outcome: '산출물(Outputs)', output: '개발활동(Activities)' };
  const flatRows: (PDMRow & { indent: number })[] = [];
  function flatten(row: PDMRow, indent = 0) {
    flatRows.push({ ...row, indent });
    if (row.children?.length) row.children.forEach((c) => flatten(c, indent + 1));
  }
  pdm.forEach((r) => flatten(r));

  const rows: TableRow[] = [
    new TableRow({
      children: ['프로젝트 요약', '내용', '지표', '지표 증명 수단', '가정'].map((h) =>
        new TableCell({ shading: { fill: 'F0F0F0' }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true })] })] })
      ),
    }),
  ];

  flatRows.forEach((row) => {
    rows.push(new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: levelLabels[row.level] || row.level, bold: true })] })] }),
        new TableCell({ children: [new Paragraph(row.narrative || '')] }),
        new TableCell({ children: [new Paragraph(row.indicators || '')] }),
        new TableCell({ children: [new Paragraph(row.verificationMeans || '')] }),
        new TableCell({ children: [new Paragraph(row.assumptions || '')] }),
      ],
    }));
  });

  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
}

export async function exportToDocx(data: ExportData, filename: string) {
  const { project, ideation, summary, structure, sections, scheduleActivities, projectDetails } = data;

  const today = new Date();
  const coverYear = project?.startDate ? new Date(project.startDate).getFullYear() : today.getFullYear();
  const dateStr = `${today.getFullYear()}. ${String(today.getMonth() + 1).padStart(2, '0')}`;

  const children: (Paragraph | Table)[] = [];

  // 표지
  children.push(
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1600, after: 100 }, children: [new TextRun({ text: `${coverYear}년`, size: 28 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: projectDetails.programName || project?.title || '사업명 미입력', bold: true, size: 36 })] }),
  );
  if (projectDetails.programType) {
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: `${projectDetails.programType}사업`, size: 28 })] }));
  }
  children.push(
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 1600 }, children: [new TextRun({ text: '사업실행계획서', bold: true, size: 32 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: `- ${project?.organization || '굿네이버스'} -`, bold: true, size: 26 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${dateStr}${projectDetails.documentNote ? ` (${projectDetails.documentNote})` : ''}`, size: 22 })] }),
  );

  // 목차
  children.push(new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, text: '목 차' }));
  PROPOSAL_SECTIONS.forEach((section) => {
    const filled = section.id === 'monitoring-schedule' ? scheduleActivities.length > 0 : !!sections[section.id]?.content;
    children.push(new Paragraph({
      children: [
        new TextRun({ text: `${section.code}  `, bold: true }),
        new TextRun({ text: section.title }),
        new TextRun({ text: filled ? '   (작성완료)' : '   (미작성)', color: filled ? '8AA81E' : 'AAAAAA' }),
      ],
    }));
  });

  // 1. 제안사업 요약서
  children.push(new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, text: '1. 제안사업 요약서' }));
  children.push(buildSummaryTable({ project, ideation, details: projectDetails }));

  children.push(new Paragraph({ spacing: { before: 200 }, heading: HeadingLevel.HEADING_1, text: '2. 사업담당자 및 파트너기관 정보' }));
  children.push(buildTeamPartnerTable({ project, details: projectDetails }));

  // 사업개요서
  if (summary) {
    children.push(new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, text: '사업 개요' }));
    children.push(...summaryBlock('사업명', summary.basicInfo?.title));
    children.push(...summaryBlock('사업 요약', summary.basicInfo?.summary));
    children.push(...summaryBlock('사업 배경', summary.background?.background));
    children.push(...summaryBlock('수요 분석', summary.background?.demandAnalysis));
    children.push(...summaryBlock('Impact', summary.objectives?.impact));
    children.push(...summaryBlock('사업목적', summary.objectives?.purpose));
    children.push(...summaryBlock('주요 성과', summary.objectives?.outcomes));
    children.push(...summaryBlock('직접 수혜자', summary.beneficiaries?.direct));
    children.push(...summaryBlock('간접 수혜자', summary.beneficiaries?.indirect));
    children.push(...summaryBlock('수행 방법', summary.implementation?.approach));
    children.push(...summaryBlock('파트너십 전략', summary.implementation?.partnershipStrategy));
    children.push(...summaryBlock('리스크 관리', summary.risks?.mainRisks));
    children.push(...summaryBlock('지속가능성', summary.risks?.sustainabilityPlan));
  }

  // PDM
  if (structure?.pdm && structure.pdm.length > 0) {
    children.push(new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, text: '사업 논리 모형 (Project Design Matrix)' }));
    children.push(buildPdmTable(structure.pdm));
  }

  // 17개 섹션
  PROPOSAL_SECTIONS.forEach((section) => {
    const isSchedule = section.id === 'monitoring-schedule';
    const content = sections[section.id]?.content;
    if (isSchedule ? scheduleActivities.length === 0 : !content) return;

    children.push(new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, text: `${section.code}. ${section.title}` }));
    if (isSchedule) {
      children.push(buildScheduleTable(scheduleActivities, project?.startDate || '', project?.endDate || ''));
    } else {
      children.push(...htmlToDocxElements(content));
    }
  });

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
