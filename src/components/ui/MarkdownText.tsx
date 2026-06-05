'use client';

interface Props {
  content: string;
  className?: string;
}

/**
 * AI 응답의 마크다운을 HTML로 렌더링합니다.
 * ** bold **, * italic *, ## 제목, - 목록, 줄바꿈 지원
 */
export function MarkdownText({ content, className = '' }: Props) {
  const html = parseMarkdown(content);
  return (
    <div
      className={`markdown-body ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function parseMarkdown(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let inList = false;
  let inOrderedList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // 제목
    if (line.startsWith('### ')) {
      if (inList) { result.push('</ul>'); inList = false; }
      if (inOrderedList) { result.push('</ol>'); inOrderedList = false; }
      result.push(`<h3>${inlineFormat(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith('## ')) {
      if (inList) { result.push('</ul>'); inList = false; }
      if (inOrderedList) { result.push('</ol>'); inOrderedList = false; }
      result.push(`<h2>${inlineFormat(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith('# ')) {
      if (inList) { result.push('</ul>'); inList = false; }
      if (inOrderedList) { result.push('</ol>'); inOrderedList = false; }
      result.push(`<h1>${inlineFormat(line.slice(2))}</h1>`);
      continue;
    }

    // 순서 없는 목록
    if (/^[-*•] /.test(line)) {
      if (inOrderedList) { result.push('</ol>'); inOrderedList = false; }
      if (!inList) { result.push('<ul>'); inList = true; }
      result.push(`<li>${inlineFormat(line.slice(2).trim())}</li>`);
      continue;
    }

    // 순서 있는 목록
    if (/^\d+\. /.test(line)) {
      if (inList) { result.push('</ul>'); inList = false; }
      if (!inOrderedList) { result.push('<ol>'); inOrderedList = true; }
      result.push(`<li>${inlineFormat(line.replace(/^\d+\.\s/, '').trim())}</li>`);
      continue;
    }

    // 빈 줄
    if (line.trim() === '') {
      if (inList) { result.push('</ul>'); inList = false; }
      if (inOrderedList) { result.push('</ol>'); inOrderedList = false; }
      result.push('<br>');
      continue;
    }

    // 일반 텍스트
    if (inList) { result.push('</ul>'); inList = false; }
    if (inOrderedList) { result.push('</ol>'); inOrderedList = false; }
    result.push(`<p>${inlineFormat(line)}</p>`);
  }

  if (inList) result.push('</ul>');
  if (inOrderedList) result.push('</ol>');

  return result.join('');
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}
