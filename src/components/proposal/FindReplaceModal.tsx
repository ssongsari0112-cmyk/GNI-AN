'use client';
import { useState, useMemo } from 'react';
import { X, Search, Check } from 'lucide-react';
import { useProjectStore } from '@/lib/store/projectStore';
import { PROPOSAL_SECTIONS } from '@/types';

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countOccurrences(text: string, term: string): number {
  if (!term) return 0;
  const re = new RegExp(escapeRegExp(term), 'g');
  return (text.match(re) || []).length;
}

interface FindReplaceModalProps {
  onClose: () => void;
}

export function FindReplaceModal({ onClose }: FindReplaceModalProps) {
  const { sections, updateSection } = useProjectStore();
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');
  const [done, setDone] = useState<{ sectionCount: number; matchCount: number } | null>(null);

  const matches = useMemo(() => {
    if (!find.trim()) return [];
    return PROPOSAL_SECTIONS
      .map((s) => {
        const content = sections[s.id]?.content || '';
        const count = countOccurrences(content, find);
        return { id: s.id, title: s.title, code: s.code, count };
      })
      .filter((m) => m.count > 0);
  }, [find, sections]);

  const totalMatches = matches.reduce((sum, m) => sum + m.count, 0);

  function handleReplaceAll() {
    if (!find.trim() || matches.length === 0) return;
    const re = new RegExp(escapeRegExp(find), 'g');
    matches.forEach((m) => {
      const section = sections[m.id];
      if (!section) return;
      const newContent = section.content.replace(re, replace);
      updateSection(m.id, newContent, section.status);
    });
    setDone({ sectionCount: matches.length, matchCount: totalMatches });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
            <Search size={16} className="text-[#8AA81E]" /> 전체 단어 찾아바꾸기
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-gray-400 mb-4">제안서 17개 섹션 본문 전체에서 단어를 한 번에 바꿉니다.</p>

        <div className="space-y-2.5 mb-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">찾을 단어</label>
            <input
              value={find}
              onChange={(e) => { setFind(e.target.value); setDone(null); }}
              placeholder="예: 굿네이버스 인터내셔날"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#8AA81E]"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">바꿀 단어</label>
            <input
              value={replace}
              onChange={(e) => { setReplace(e.target.value); setDone(null); }}
              placeholder="예: OO기관"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#8AA81E]"
            />
          </div>
        </div>

        {find.trim() && (
          <div className="bg-[#F7F8F2] border border-[#D9E6B7] rounded-lg p-3 mb-4 max-h-40 overflow-y-auto">
            {matches.length === 0 ? (
              <p className="text-xs text-gray-400">일치하는 내용이 없습니다.</p>
            ) : (
              <>
                <p className="text-xs font-semibold text-[#5a7012] mb-1.5">
                  {matches.length}개 섹션에서 총 {totalMatches}건 발견
                </p>
                <ul className="space-y-0.5">
                  {matches.map((m) => (
                    <li key={m.id} className="text-xs text-gray-500 flex justify-between">
                      <span>{m.code}. {m.title}</span>
                      <span className="text-gray-400">{m.count}건</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {done && (
          <div className="flex items-center gap-1.5 text-xs text-[#5a7012] bg-[#EEF5D6] border border-[#D9E6B7] rounded-lg px-3 py-2 mb-3">
            <Check size={13} /> {done.sectionCount}개 섹션, {done.matchCount}건 교체 완료
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">
            닫기
          </button>
          <button
            onClick={handleReplaceAll}
            disabled={!find.trim() || matches.length === 0}
            className="text-sm text-white bg-[#8AA81E] rounded-lg px-3 py-1.5 hover:bg-[#799516] disabled:opacity-40"
          >
            전체 바꾸기
          </button>
        </div>
      </div>
    </div>
  );
}
