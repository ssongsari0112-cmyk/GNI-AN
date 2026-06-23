'use client';
import { useState, useRef, useCallback } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { clsx } from 'clsx';

/** "(지방농업청, 2023)", "(World Bank, 2022)", "(FAO 농업 인식 조사, 2022)", 쉼표·공백
 *  없이 붙어 쓴 "(UN2024)" 같은 변형 표기까지 폭넓게 찾아 클릭 가능한 칩으로 감싼다.
 *  기관명(글자로 시작)과 4자리 연도(19xx/20xx)가 함께 있으면 출처로 간주. */
const CITATION_REGEX = /\(([\p{L}][^()]{1,75}?(?:19|20)\d{2}[^()]{0,20})\)/gu;

function wrapCitations(html: string): string {
  return html.replace(CITATION_REGEX, (_match, inner: string) => {
    const escaped = inner.replace(/"/g, '&quot;');
    return `<button type="button" class="citation-chip" data-citation="${escaped}">(${inner})</button>`;
  });
}

interface CitationHtmlProps {
  html: string;
  className?: string;
  style?: React.CSSProperties;
  /** 제공하면 팝업에 URL 입력란이 나타나고, 저장 시 이 콜백으로 (원본 출처 텍스트, 입력한 URL)을 전달한다. */
  onSaveLink?: (citationText: string, url: string) => void;
}

export function CitationHtml({ html, className, style, onSaveLink }: CitationHtmlProps) {
  const [popup, setPopup] = useState<{ text: string; x: number; y: number } | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest('.citation-chip') as HTMLElement | null;
    if (!target) return;
    const containerRect = containerRef.current?.getBoundingClientRect();
    const rect = target.getBoundingClientRect();
    setUrlInput('');
    setPopup({
      text: target.dataset.citation || '',
      x: containerRect ? rect.left - containerRect.left : 0,
      y: containerRect ? rect.bottom - containerRect.top + 6 : 0,
    });
  }, []);

  return (
    <div ref={containerRef} className={clsx('relative', className)} style={style}>
      <div onClick={handleClick} dangerouslySetInnerHTML={{ __html: wrapCitations(html) }} />
      {popup && (
        <div
          className="absolute z-30 bg-white border border-[#D9E6B7] rounded-lg shadow-lg p-3 w-72 text-left"
          style={{ left: popup.x, top: popup.y }}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-xs font-semibold text-[#3b5c0a]">출처 정보</p>
            <button onClick={() => setPopup(null)} className="text-gray-300 hover:text-gray-500 flex-shrink-0">
              <X size={13} />
            </button>
          </div>
          <p className="text-xs text-gray-600 mb-2 leading-relaxed">{popup.text}</p>
          <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-1.5 mb-2 leading-relaxed">
            AI가 작성한 출처 표기입니다. 실제 문서·통계인지 직접 확인이 필요합니다.
          </p>
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(popup.text)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-xs text-[#5a7012] border border-[#D9E6B7] rounded-lg px-3 py-1.5 hover:bg-[#EEF5D6] transition-colors mb-2"
          >
            <ExternalLink size={12} /> 검색해서 원문 확인
          </a>
          {onSaveLink && (
            <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100">
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="실제 문서 URL 입력"
                className="flex-1 text-[11px] border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-[#8AA81E]"
              />
              <button
                onClick={() => {
                  if (!urlInput.trim()) return;
                  onSaveLink(popup.text, urlInput.trim());
                  setPopup(null);
                }}
                className="text-[11px] text-white bg-[#8AA81E] rounded px-2 py-1 hover:bg-[#7a9419] flex-shrink-0"
              >
                저장
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
