'use client';
import { useRef, useState } from 'react';
import { ProposalLayout } from '@/components/layout/ProposalLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useProjectStore } from '@/lib/store/projectStore';
import { Download, Upload, FileSpreadsheet, X, CheckCircle2 } from 'lucide-react';

export default function OperationBudgetPage() {
  const { budgetFile, setBudgetFile, updateSection } = useProjectStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(file: File) {
    if (!file.name.match(/\.(xlsm|xlsx)$/)) {
      alert('.xlsm 또는 .xlsx 파일만 업로드 가능합니다.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      alert('파일 크기는 20MB 이하여야 합니다.');
      return;
    }
    setBudgetFile({ name: file.name, size: file.size, uploadedAt: new Date().toISOString() });
    updateSection('operation-budget', `budget:${file.name}`, 'completed');
  }

  return (
    <ProposalLayout sectionId="operation-budget" sectionTitle="예산">
      <div className="max-w-3xl mx-auto px-6 py-6">
        <h1 className="text-xl font-bold text-[#111827] mb-6">II-2 예산</h1>

        {/* Download card */}
        <div className="bg-[#EEF5D6] border border-[#D9E6B7] rounded-2xl p-5 mb-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#8AA81E] flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[#111827] mb-1">예산서 양식 다운로드</h3>
              <p className="text-sm text-gray-600 mb-1">시민사회협력팀에서 제공하는 별도 엑셀 양식을 사용하는 것을 권장합니다.</p>
              <p className="text-xs text-gray-400">최종 예산은 이 양식에 맞추어 작성하신 후 제출해주세요.</p>
            </div>
          </div>
          <div className="mt-4">
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); alert('양식 파일 다운로드는 실제 서버 연동 후 제공됩니다.'); }}
              className="inline-flex items-center gap-2 bg-white border border-[#D9E6B7] text-[#5a7012] rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-white/80 transition-colors"
            >
              <Download size={16} />
              시민사회협력사업 예산서 양식 다운로드
            </a>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            <div className="font-medium mb-1">필수 시트:</div>
            <div className="flex flex-wrap gap-2">
              {['기준(양식)', '유의사항', '전체 총괄', '1차년도 총괄', '1차년도 산출내역', '2차년도 총괄', '2차년도 산출내역'].map((s) => (
                <Badge key={s} variant="olive">{s}</Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Upload card */}
        <div className="bg-white border border-[#D9E6B7] rounded-2xl p-5">
          <h3 className="font-semibold text-[#111827] mb-1">작성한 예산서 첨부</h3>
          <p className="text-sm text-gray-500 mb-4">작성 완료한 예산 엑셀 파일을 첨부해주세요. 제안서 제출 시 함께 포함됩니다.</p>
          <p className="text-xs text-gray-400 mb-4">지원 형식: .xlsm, .xlsx / 최대 20MB</p>

          {budgetFile ? (
            <div className="flex items-center gap-3 bg-[#EEF5D6] border border-[#D9E6B7] rounded-xl p-4">
              <CheckCircle2 size={18} className="text-[#8AA81E] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[#111827] truncate">{budgetFile.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {(budgetFile.size / 1024).toFixed(1)}KB · {new Date(budgetFile.uploadedAt).toLocaleDateString('ko-KR')} 업로드 완료
                </div>
              </div>
              <button
                onClick={() => { setBudgetFile(null); updateSection('operation-budget', '', 'empty'); }}
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragOver ? 'border-[#8AA81E] bg-[#EEF5D6]' : 'border-gray-200 hover:border-[#D9E6B7]'}`}
            >
              <Upload size={24} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-1">파일을 드래그하거나</p>
              <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
                파일 선택
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsm,.xlsx"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-gray-500 mb-2">안내사항</h4>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• 예산은 위 엑셀 양식을 다운로드하여 별도 작성해주세요.</li>
            <li>• 작성한 엑셀 파일을 제안서와 함께 제출하시면 됩니다.</li>
            <li>• 연간 집행률 95% 이상 권장</li>
            <li>• 내부거래 금지 / 사업 무관 집행 금지</li>
          </ul>
        </div>
      </div>
    </ProposalLayout>
  );
}
