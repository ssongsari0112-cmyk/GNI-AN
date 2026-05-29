'use client';
import { useState, useCallback } from 'react';
import { ProposalLayout } from '@/components/layout/ProposalLayout';
import { RichTextEditor } from '@/components/editors/RichTextEditor';
import { Collapsible } from '@/components/ui/Collapsible';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useProjectStore } from '@/lib/store/projectStore';
import type { SectionId } from '@/types';
import { Check } from 'lucide-react';
import { clsx } from 'clsx';

interface SectionPageProps {
  sectionId: SectionId;
  sectionTitle: string;
  fullTitle: string;
  tags?: string[];
  guide?: string;
  exampleContent?: string;
  planningDataHints?: string[];
  minWords?: number;
  maxWords?: number;
  children?: React.ReactNode;
  customContent?: boolean;
}

export function SectionPage({
  sectionId,
  sectionTitle,
  fullTitle,
  tags = [],
  guide = '',
  exampleContent = '',
  planningDataHints = [],
  minWords = 0,
  maxWords = 0,
  children,
  customContent = false,
}: SectionPageProps) {
  const { sections, updateSection, ideation, structure, expertSessions } = useProjectStore();
  const sectionData = sections[sectionId];
  const content = sectionData?.content || '';
  const wordCount = content.replace(/<[^>]*>/g, '').length;

  const [saved, setSaved] = useState(false);

  const handleChange = useCallback((html: string) => {
    const charCount = html.replace(/<[^>]*>/g, '').length;
    const newStatus = charCount >= (minWords || 1) ? 'in-progress' : 'empty';
    updateSection(sectionId, html, newStatus as 'empty' | 'in-progress' | 'completed');
  }, [sectionId, minWords, updateSection]);

  const handleComplete = () => {
    updateSection(sectionId, content, 'completed');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const planningData = [
    { label: 'AI 초기 분석', content: `핵심 문제: ${ideation?.idea?.slice(0, 100) || ''}...` },
    { label: '목표 체계', content: structure?.objectiveTree?.purpose || '구조화 단계에서 생성됩니다.' },
    { label: '문제 분석', content: structure?.problemTree?.coreProblem || '구조화 단계에서 생성됩니다.' },
    { label: '전문가 인사이트', content: expertSessions.filter((s) => s.completed).map((s) => s.expertId).join(', ') + ' 전문가 상담 완료' },
  ];

  const relevantData = planningDataHints.length > 0
    ? planningData.filter((d) => planningDataHints.some((h) => d.label.includes(h)))
    : planningData;

  return (
    <ProposalLayout sectionId={sectionId} sectionTitle={sectionTitle}>
      <div className="max-w-3xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.map((tag) => (
              <Badge key={tag} variant="olive">{tag}</Badge>
            ))}
          </div>
          <h1 className="text-xl font-bold text-[#111827]">{fullTitle}</h1>
        </div>

        {/* Collapsibles */}
        <div className="space-y-1 mb-4 bg-white border border-[#D9E6B7] rounded-xl px-4 py-2">
          {guide && (
            <Collapsible trigger="▶ 작성 가이드">
              <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-line pl-4 pb-2">
                {guide}
              </div>
            </Collapsible>
          )}
          {exampleContent && (
            <Collapsible trigger="▶ 작성 예시 보기">
              <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 mb-2 leading-relaxed whitespace-pre-line">
                {exampleContent}
              </div>
            </Collapsible>
          )}
          {relevantData.length > 0 && (
            <Collapsible trigger={`▶ 기획 단계 분석 자료 (${relevantData.length}개 항목)`}>
              <div className="space-y-2 pb-2">
                {relevantData.map((item) => (
                  <div key={item.label} className="bg-[#F7F8F2] rounded-lg p-2.5">
                    <div className="text-xs font-semibold text-[#5a7012] mb-1">{item.label}</div>
                    <div className="text-xs text-gray-600">{item.content}</div>
                  </div>
                ))}
              </div>
            </Collapsible>
          )}
        </div>

        {/* Editor or custom content */}
        {customContent ? (
          children
        ) : (
          <>
            <RichTextEditor
              content={content}
              onChange={handleChange}
              minHeight={350}
            />

            {/* Word count & status */}
            <div className="flex items-center justify-between mt-2">
              <div className={clsx(
                'text-xs',
                minWords > 0 && wordCount < minWords ? 'text-orange-400' : wordCount > 0 ? 'text-[#8AA81E]' : 'text-gray-400'
              )}>
                {wordCount.toLocaleString()}자
                {minWords > 0 && maxWords > 0 && ` / 권장 ${minWords.toLocaleString()}~${maxWords.toLocaleString()}자`}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleComplete}
                  disabled={wordCount === 0}
                >
                  {saved ? (
                    <><Check size={12} className="text-[#8AA81E]" /> 저장됨</>
                  ) : (
                    '완료 표시'
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </ProposalLayout>
  );
}
