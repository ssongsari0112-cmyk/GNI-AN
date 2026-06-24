'use client';
import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ChevronRight, Upload, FileText, CheckCircle2,
  Loader2, X, ChevronDown, ChevronUp, Sparkles, AlertCircle, ArrowRight,
} from 'lucide-react';
import { useProjectStore } from '@/lib/store/projectStore';
import type { PmcSourceDoc } from '@/lib/store/projectStore';

type DocState = {
  file: File;
  status: 'extracting' | 'analyzing' | 'done' | 'error';
  doc?: PmcSourceDoc;
  error?: string;
  previewOpen: boolean;
};

export default function PmcUploadPage() {
  const router = useRouter();
  const { setProjectType, setPmcSourceDocs, reset } = useProjectStore();
  const [docs, setDocs] = useState<DocState[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILES = 3;
  const allDone = docs.length > 0 && docs.every(d => d.status === 'done');
  const anyProcessing = docs.some(d => d.status === 'extracting' || d.status === 'analyzing');

  // ── Process a single PDF file ────────────────────────────────
  const processFile = useCallback(async (file: File, idx: number) => {
    // Step 1: Extract text
    setDocs(prev => prev.map((d, i) => i === idx ? { ...d, status: 'extracting' } : d));

    let extractedText = '';
    let numPages = 0;

    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/gni-an/pmc/extract-pdf', { method: 'POST', body: fd });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || '추출 실패');
      extractedText = json.text;
      numPages = json.numPages;
    } catch (e) {
      const msg = e instanceof Error ? e.message : '추출 오류';
      setDocs(prev => prev.map((d, i) => i === idx ? { ...d, status: 'error', error: msg } : d));
      return;
    }

    // Step 2: AI analyze
    setDocs(prev => prev.map((d, i) => i === idx ? { ...d, status: 'analyzing' } : d));

    let analyzed: PmcSourceDoc['analyzed'] = {};
    try {
      const res = await fetch('/api/gni-an/pmc/analyze-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extractedText, fileName: file.name }),
      });
      const json = await res.json();
      if (json.success) analyzed = json.analyzed;
    } catch { /* use empty analyzed */ }

    const pmcDoc: PmcSourceDoc = {
      fileName: file.name,
      extractedText,
      numPages,
      uploadedAt: new Date().toISOString(),
      analyzed,
    };

    setDocs(prev => prev.map((d, i) => i === idx
      ? { ...d, status: 'done', doc: pmcDoc }
      : d
    ));
  }, []);

  // ── Add files ────────────────────────────────────────────────
  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.name.toLowerCase().endsWith('.pdf'));
    const newSlots = arr.slice(0, MAX_FILES - docs.length);
    if (!newSlots.length) return;

    const startIdx = docs.length;
    const newDocStates: DocState[] = newSlots.map(f => ({
      file: f, status: 'extracting', previewOpen: false,
    }));
    setDocs(prev => [...prev, ...newDocStates]);
    newSlots.forEach((f, i) => processFile(f, startIdx + i));
  }, [docs.length, processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const removeDoc = (idx: number) => {
    setDocs(prev => prev.filter((_, i) => i !== idx));
  };

  // ── Proceed to ideation ──────────────────────────────────────
  const handleProceed = () => {
    reset();
    setProjectType('pmc');
    const doneDocs = docs.filter(d => d.status === 'done' && d.doc).map(d => d.doc!);
    setPmcSourceDocs(doneDocs);

    // Pre-fill ideation from first analyzed doc
    const first = doneDocs[0]?.analyzed;
    if (first && (first.coreProblem || first.objectives || first.country)) {
      const { setIdeation } = useProjectStore.getState();
      setIdeation({
        country: first.country || '',
        subRegion: first.region || '',
        field: first.field || '',
        idea: [
          first.objectives && `[사업 목표] ${first.objectives}`,
          first.coreProblem && `[핵심 문제] ${first.coreProblem}`,
          first.keyTasks?.length ? `[주요 과업] ${first.keyTasks.join(' / ')}` : null,
        ].filter(Boolean).join('\n\n'),
      });
    }

    router.push('/gni-an/ideation');
  };

  return (
    <div className="min-h-screen bg-[#F7F8F2]">
      {/* Header */}
      <header className="border-b border-[#D9E6B7] bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-3">
          <Link href="/gni-an/project/new" className="flex items-center gap-1.5 text-gray-500 hover:text-[#8AA81E] transition-colors">
            <ArrowLeft size={18} />
            사업유형 선택
          </Link>
          <ChevronRight size={16} className="text-gray-300" />
          <span className="font-medium text-[#111827]">PMC 과업지시서 업로드</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Title */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 bg-[#EEF5D6] border border-[#D9E6B7] rounded-full px-3 py-1 text-xs font-medium text-[#5a7012] mb-4">
            🏛 국별협력사업 (PMC)
          </div>
          <h1 className="text-3xl font-bold text-[#111827] mb-2">KOICA 집행계획(안) 업로드</h1>
          <p className="text-gray-500 leading-relaxed">
            KOICA가 제공한 집행계획(안) PDF를 업로드하면, AI가 내용을 분석하여
            제안서 작성을 위한 맞춤 구조를 자동으로 구성합니다.
          </p>
        </div>

        {/* PMC 방식 안내 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
          <p className="font-semibold mb-1">📋 PMC 사업 제안서 작성 방식</p>
          <p className="leading-relaxed text-blue-700">
            KOICA가 이미 정해둔 과업 구조와 PDM을 기반으로,
            <strong> 내용을 심화·변형하거나 필요한 내용을 추가/삭제</strong>하여 제안서를 완성합니다.
            업로드한 문서의 원문이 모든 AI 초안 생성의 기반이 됩니다.
          </p>
        </div>

        {/* Upload area */}
        {docs.length < MAX_FILES && (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all mb-4 ${
              dragging
                ? 'border-[#8AA81E] bg-[#EEF5D6]'
                : 'border-[#D9E6B7] bg-white hover:border-[#8AA81E] hover:bg-[#F7F8F2]'
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-[#EEF5D6] flex items-center justify-center">
                <Upload size={24} className="text-[#8AA81E]" />
              </div>
              <div>
                <p className="font-semibold text-[#111827] mb-1">PDF 파일을 드래그하거나 클릭하여 업로드</p>
                <p className="text-sm text-gray-400">집행계획(안), 과업지시서 등 KOICA 제공 문서 · 최대 {MAX_FILES}개</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              multiple
              className="hidden"
              onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
            />
          </div>
        )}

        {/* File list */}
        {docs.length > 0 && (
          <div className="space-y-3 mb-8">
            {docs.map((d, idx) => (
              <div key={idx} className="bg-white border border-[#D9E6B7] rounded-xl overflow-hidden">
                {/* File header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <FileText size={18} className="text-[#8AA81E] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#111827] truncate">{d.file.name}</p>
                    <p className="text-xs text-gray-400">
                      {(d.file.size / 1024).toFixed(0)} KB
                      {d.doc?.numPages ? ` · ${d.doc.numPages}페이지` : ''}
                    </p>
                  </div>

                  {/* Status */}
                  {d.status === 'extracting' && (
                    <div className="flex items-center gap-1.5 text-xs text-blue-600">
                      <Loader2 size={13} className="animate-spin" />텍스트 추출 중
                    </div>
                  )}
                  {d.status === 'analyzing' && (
                    <div className="flex items-center gap-1.5 text-xs text-purple-600">
                      <Loader2 size={13} className="animate-spin" />AI 분석 중
                    </div>
                  )}
                  {d.status === 'done' && (
                    <div className="flex items-center gap-1.5 text-xs text-[#5a7012]">
                      <CheckCircle2 size={13} />분석 완료
                    </div>
                  )}
                  {d.status === 'error' && (
                    <div className="flex items-center gap-1.5 text-xs text-red-500">
                      <AlertCircle size={13} />{d.error}
                    </div>
                  )}

                  {/* Actions */}
                  {d.status === 'done' && (
                    <button
                      onClick={() => setDocs(prev => prev.map((x, i) => i === idx ? { ...x, previewOpen: !x.previewOpen } : x))}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#5a7012] ml-2"
                    >
                      {d.previewOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      내용보기
                    </button>
                  )}
                  <button
                    onClick={() => removeDoc(idx)}
                    disabled={d.status === 'extracting' || d.status === 'analyzing'}
                    className="text-gray-300 hover:text-red-400 ml-1 disabled:opacity-30"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Analysis preview */}
                {d.status === 'done' && d.previewOpen && d.doc?.analyzed && (
                  <div className="border-t border-[#D9E6B7] bg-[#F7F8F2] px-4 py-4 space-y-3">
                    {d.doc.analyzed.summary && (
                      <div>
                        <p className="text-[10px] font-semibold text-[#5a7012] uppercase mb-1">AI 분석 요약</p>
                        <p className="text-xs text-gray-700 leading-relaxed">{d.doc.analyzed.summary}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: '사업명', value: d.doc.analyzed.title },
                        { label: '대상국가', value: d.doc.analyzed.country },
                        { label: '사업분야', value: d.doc.analyzed.field },
                        { label: '사업기간', value: d.doc.analyzed.duration },
                        { label: '핵심문제', value: d.doc.analyzed.coreProblem },
                        { label: '수혜대상', value: d.doc.analyzed.targetBeneficiaries },
                      ].filter(r => r.value).map(r => (
                        <div key={r.label} className="bg-white border border-[#D9E6B7] rounded-lg px-3 py-2">
                          <p className="text-[9px] font-semibold text-gray-400 mb-0.5">{r.label}</p>
                          <p className="text-xs text-gray-700 leading-snug">{r.value}</p>
                        </div>
                      ))}
                    </div>
                    {d.doc.analyzed.keyTasks && d.doc.analyzed.keyTasks.length > 0 && (
                      <div className="bg-white border border-[#D9E6B7] rounded-lg px-3 py-2">
                        <p className="text-[9px] font-semibold text-gray-400 mb-1">주요 과업</p>
                        <ul className="space-y-0.5">
                          {d.doc.analyzed.keyTasks.map((t, i) => (
                            <li key={i} className="text-xs text-gray-700 flex gap-1.5">
                              <span className="text-[#8AA81E] flex-shrink-0">·</span>{t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Raw text preview */}
                    <details className="group">
                      <summary className="text-[10px] text-gray-400 cursor-pointer hover:text-[#5a7012] select-none">원문 텍스트 보기 ▸</summary>
                      <pre className="mt-2 text-[9px] text-gray-500 bg-white border border-gray-100 rounded-lg p-3 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                        {d.doc.extractedText.slice(0, 3000)}{d.doc.extractedText.length > 3000 ? '\n...' : ''}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Proceed button */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400">
            {docs.length === 0 && '파일을 업로드하면 자동으로 분석을 시작합니다.'}
            {docs.length > 0 && !allDone && anyProcessing && 'AI가 문서를 분석하고 있습니다…'}
            {allDone && `${docs.filter(d => d.status === 'done').length}개 파일 분석 완료 — 다음 단계로 이동하세요.`}
          </div>
          <div className="flex gap-3">
            {docs.length === 0 && (
              <button
                onClick={() => {
                  reset();
                  setProjectType('pmc');
                  router.push('/gni-an/ideation');
                }}
                className="text-sm text-gray-400 hover:text-gray-600 border border-gray-200 rounded-xl px-4 py-2.5"
              >
                파일 없이 계속하기
              </button>
            )}
            <button
              onClick={handleProceed}
              disabled={anyProcessing || docs.length === 0}
              className="flex items-center gap-2 bg-[#8AA81E] hover:bg-[#799516] text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {anyProcessing ? (
                <><Loader2 size={14} className="animate-spin" />분석 중…</>
              ) : (
                <>
                  <Sparkles size={14} />
                  제안서 작성 시작
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
