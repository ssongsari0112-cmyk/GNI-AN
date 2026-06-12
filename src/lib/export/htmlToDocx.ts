import { Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from 'docx';

function parseInlineNodes(node: ParentNode, bold = false, italic = false): TextRun[] {
  const runs: TextRun[] = [];
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent || '';
      if (text) runs.push(new TextRun({ text, bold, italics: italic }));
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement;
      const tag = el.tagName.toLowerCase();
      if (tag === 'br') {
        runs.push(new TextRun({ text: '', break: 1 }));
      } else if (tag === 'strong' || tag === 'b') {
        runs.push(...parseInlineNodes(el, true, italic));
      } else if (tag === 'em' || tag === 'i') {
        runs.push(...parseInlineNodes(el, bold, true));
      } else {
        runs.push(...parseInlineNodes(el, bold, italic));
      }
    }
  });
  return runs;
}

function buildTable(el: HTMLElement): Table {
  const rows: TableRow[] = [];
  el.querySelectorAll(':scope > thead > tr, :scope > tbody > tr, :scope > tr').forEach((tr) => {
    const cells: TableCell[] = [];
    const cellEls = tr.querySelectorAll(':scope > th, :scope > td');
    cellEls.forEach((cell) => {
      cells.push(
        new TableCell({
          children: [new Paragraph({ children: parseInlineNodes(cell as HTMLElement, cell.tagName.toLowerCase() === 'th') })],
          width: { size: Math.floor(100 / Math.max(cellEls.length, 1)), type: WidthType.PERCENTAGE },
        })
      );
    });
    if (cells.length > 0) rows.push(new TableRow({ children: cells }));
  });
  return new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } });
}

/**
 * Converts the rich-text HTML produced by the proposal editor into docx
 * Paragraph/Table elements. Only a subset of tags is handled (the ones the
 * editor can actually produce): h1-h3, p, ul/ol/li, table, strong/b, em/i, br.
 */
export function htmlToDocxElements(html: string): (Paragraph | Table)[] {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const elements: (Paragraph | Table)[] = [];

  function processNode(node: ChildNode) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) elements.push(new Paragraph({ children: [new TextRun(text)] }));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    switch (tag) {
      case 'h1':
        elements.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 }, children: parseInlineNodes(el) }));
        break;
      case 'h2':
        elements.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 }, children: parseInlineNodes(el) }));
        break;
      case 'h3':
        elements.push(new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 150, after: 80 }, children: parseInlineNodes(el) }));
        break;
      case 'p':
        elements.push(new Paragraph({ spacing: { after: 100 }, children: parseInlineNodes(el) }));
        break;
      case 'ul':
      case 'ol':
        Array.from(el.children).forEach((li) => {
          if (li.tagName.toLowerCase() !== 'li') return;
          elements.push(
            new Paragraph({
              bullet: { level: 0 },
              children: parseInlineNodes(li as HTMLElement),
            })
          );
        });
        break;
      case 'table':
        elements.push(buildTable(el));
        break;
      default:
        Array.from(el.childNodes).forEach(processNode);
    }
  }

  Array.from(parsed.body.childNodes).forEach(processNode);
  return elements;
}
