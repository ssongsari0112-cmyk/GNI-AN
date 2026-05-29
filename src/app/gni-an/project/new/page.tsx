'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowLeft, ChevronRight, Lock } from 'lucide-react';
import { useProjectStore } from '@/lib/store/projectStore';
import type { Project } from '@/types';

const PROGRAMS = [
  {
    id: 'civil-society-cooperation-entry',
    label: '시민사회협력사업',
    sublabel: '진입형',
    desc: 'KOICA 시민사회협력사업 진입형 제안서 작성을 지원합니다.',
    active: true,
  },
  { id: 'civil-society-cooperation-growth', label: '시민사회협력사업', sublabel: '성장형', desc: '준비 중', active: false },
  { id: 'koica-oda', label: 'ODA 일반 사업', sublabel: '', desc: '준비 중', active: false },
  { id: 'global-citizens', label: '글로벌시민교육', sublabel: '', desc: '준비 중', active: false },
];

export default function ProjectNewPage() {
  const router = useRouter();
  const { setProject, reset } = useProjectStore();

  function handleSelect(programId: string) {
    reset();
    const newProject: Project = {
      id: crypto.randomUUID(),
      program: 'civil-society-cooperation-entry',
      title: '',
      organization: '',
      country: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProject(newProject);
    router.push('/gni-an/ideation');
  }

  return (
    <div className="min-h-screen bg-[#F7F8F2]">
      <header className="border-b border-[#D9E6B7] bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-3">
          <Link href="/gni-an" className="flex items-center gap-1.5 text-gray-500 hover:text-[#8AA81E] transition-colors text-sm">
            <ArrowLeft size={16} />
            홈으로
          </Link>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="text-sm font-medium text-[#111827]">새 프로젝트</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-[#111827] mb-2">프로그램 선택</h1>
          <p className="text-gray-500">작성할 제안서 프로그램을 선택하세요.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PROGRAMS.map((prog) => (
            <div
              key={prog.id}
              onClick={() => prog.active && handleSelect(prog.id)}
              className={`relative bg-white border-2 rounded-2xl p-6 transition-all ${
                prog.active
                  ? 'border-[#D9E6B7] hover:border-[#8AA81E] hover:shadow-md cursor-pointer group'
                  : 'border-gray-100 opacity-50 cursor-not-allowed'
              }`}
            >
              {!prog.active && (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-gray-100 rounded-full px-2 py-0.5 text-xs text-gray-400">
                  <Lock size={10} />
                  준비 중
                </div>
              )}
              {prog.active && (
                <div className="absolute top-3 right-3 bg-[#EEF5D6] border border-[#D9E6B7] rounded-full px-2 py-0.5 text-xs text-[#5a7012] font-medium">
                  활성
                </div>
              )}
              <div className="w-10 h-10 rounded-xl bg-[#EEF5D6] flex items-center justify-center mb-4">
                <Sparkles size={18} className="text-[#8AA81E]" />
              </div>
              <h3 className="font-semibold text-[#111827] mb-0.5">{prog.label}</h3>
              {prog.sublabel && (
                <span className="text-xs text-[#8AA81E] font-medium">{prog.sublabel}</span>
              )}
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">{prog.desc}</p>
              {prog.active && (
                <div className="mt-4 flex items-center gap-1 text-[#8AA81E] text-sm font-medium group-hover:gap-2 transition-all">
                  선택하기 <ChevronRight size={14} />
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
