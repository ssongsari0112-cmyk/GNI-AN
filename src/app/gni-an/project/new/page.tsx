'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, Lock, Building2, Users, Lightbulb } from 'lucide-react';
const PROGRAMS = [
  {
    id: 'pmc',
    icon: <Building2 size={22} className="text-[#8AA81E]" />,
    label: '국별협력사업(PMC)',
    desc: '협력국의 국가개발전략과 한국의 CPS에 기반해 중장기 개발협력 사업을 기획하는 프로그램입니다.',
    tags: ['CPS 정합성', '정부협력', '중장기 사업', 'PDM 필수'],
    cta: 'PMC로 시작하기',
    active: false,
  },
  {
    id: 'civil-society-cooperation-entry',
    icon: <Users size={22} className="text-[#8AA81E]" />,
    label: '시민사회협력사업',
    desc: 'NGO와 시민사회단체가 개발도상국 현장에서 개발협력 사업을 수행하기 위한 프로그램입니다.',
    tags: ['진입형', '성장형', '전략형', '인도민협'],
    cta: '시민사회협력사업으로 시작하기',
    active: true,
  },
  {
    id: 'special',
    icon: <Lightbulb size={22} className="text-[#8AA81E]" />,
    label: '특수사업(CTS, IBS)',
    desc: '혁신기술, 포용적 비즈니스, 민간협력 기반의 특화형 개발협력 사업을 기획하는 프로그램입니다.',
    tags: ['CTS', 'IBS', '혁신기술', '민간협력'],
    cta: '특수사업으로 시작하기',
    active: false,
  },
];

export default function ProjectNewPage() {
  const router = useRouter();

  function handleSelect(programId: string) {
    router.push('/gni-an/project/civil-society');
  }

  return (
    <div className="min-h-screen bg-[#F7F8F2]">
      <header className="border-b border-[#D9E6B7] bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-3">
          <Link href="/gni-an" className="flex items-center gap-1.5 text-gray-500 hover:text-[#8AA81E] transition-colors text-sm">
            <ArrowLeft size={16} />
            홈으로
          </Link>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="text-sm font-medium text-[#111827]">새 프로젝트</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-[#111827] mb-3">어떤 프로그램을 준비하시나요?</h1>
          <p className="text-gray-500">사업 유형을 선택하면 적합한 공모 기준과 가이드를 제공합니다.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PROGRAMS.map((prog) => (
            <div
              key={prog.id}
              onClick={() => prog.active && handleSelect(prog.id)}
              className={`relative bg-white border rounded-2xl p-6 transition-all flex flex-col ${
                prog.active
                  ? 'border-[#D9E6B7] hover:border-[#8AA81E] hover:shadow-lg cursor-pointer group'
                  : 'border-gray-100 opacity-50 cursor-not-allowed'
              }`}
            >
              {!prog.active && (
                <div className="absolute top-4 right-4 flex items-center gap-1 bg-gray-100 rounded-full px-2 py-0.5 text-xs text-gray-400">
                  <Lock size={10} />
                  준비 중
                </div>
              )}

              <div className="w-12 h-12 rounded-xl bg-[#EEF5D6] flex items-center justify-center mb-4">
                {prog.icon}
              </div>

              <h3 className="font-bold text-[#111827] text-base mb-2">{prog.label}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">{prog.desc}</p>

              <div className="flex flex-wrap gap-1.5 mb-5">
                {prog.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-full border border-[#D9E6B7] bg-[#F7F8F2] text-[#5a7012]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {prog.active && (
                <div className="mt-auto flex items-center gap-1 text-[#8AA81E] text-sm font-semibold group-hover:gap-2 transition-all">
                  {prog.cta} <ChevronRight size={14} />
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
