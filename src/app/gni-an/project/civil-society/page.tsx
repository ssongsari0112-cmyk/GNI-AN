'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, Sprout, TrendingUp, Target, Heart } from 'lucide-react';
import { useProjectStore } from '@/lib/store/projectStore';
import type { Project } from '@/types';

const TYPES = [
  {
    id: 'entry',
    icon: <Sprout size={20} className="text-[#8AA81E]" />,
    label: '진입형',
    period: '2년',
    periodColor: 'bg-[#EEF5D6] text-[#5a7012]',
    desc: '국제개발협력 사업 경험이 없거나 적은 신규 NGO가 처음 참여하는 유형입니다.',
    features: [
      { left: '사업 규모: 소규모', right: 'KOICA 신규 협력 NGO' },
      { left: '역량 강화 지원 포함', right: '기초 PDM 구조' },
    ],
    active: true,
  },
  {
    id: 'growth',
    icon: <TrendingUp size={20} className="text-[#8AA81E]" />,
    label: '성장형',
    period: '2~3년',
    periodColor: 'bg-[#EEF5D6] text-[#5a7012]',
    desc: '기존 진입형 사업 경험이 있는 중견 NGO가 규모를 확대하는 유형입니다.',
    features: [
      { left: '사업 규모: 중규모', right: '진입형 수행 NGO' },
      { left: '성과 관리 강화', right: '파트너십 확대' },
    ],
    active: true,
  },
  {
    id: 'strategic',
    icon: <Target size={20} className="text-[#8AA81E]" />,
    label: '전략형',
    period: '5년~',
    periodColor: 'bg-[#EEF5D6] text-[#5a7012]',
    desc: '대형 NGO가 중장기 전략 사업을 추진하는 유형입니다.',
    features: [
      { left: '사업 규모: 대규모', right: '풍부한 사업 경험' },
      { left: '전략적 파트너십', right: '복잡한 PDM 구조' },
    ],
    active: true,
  },
  {
    id: 'hdpn',
    icon: <Heart size={20} className="text-[#8AA81E]" />,
    label: '인도민협(HDP-N)',
    period: 'Nexus',
    periodColor: 'bg-blue-50 text-blue-600',
    desc: 'Humanitarian-Development-Peace Nexus 접근방식을 적용하는 복합 위기 대응 사업입니다.',
    features: [
      { left: '인도적 지원 연계', right: '평화구축 요소 포함' },
      { left: '복합위기 대응', right: 'Nexus 접근방식' },
    ],
    active: true,
  },
];

export default function CivilSocietyPage() {
  const router = useRouter();
  const { setProject, reset } = useProjectStore();

  function handleSelect() {
    if (!reset()) {
      alert('저장 가능한 프로젝트가 이미 5개입니다. 홈 화면에서 기존 프로젝트를 1개 이상 삭제한 뒤 다시 시도해주세요.');
      return;
    }
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
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-3">
          <Link href="/gni-an/project/new" className="flex items-center gap-1.5 text-gray-500 hover:text-[#8AA81E] transition-colors text-sm">
            <ArrowLeft size={16} />
            프로그램 선택
          </Link>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="text-sm font-medium text-[#111827]">시민사회협력사업</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <div className="inline-flex items-center bg-[#EEF5D6] border border-[#D9E6B7] rounded-full px-3 py-1 text-xs font-medium text-[#5a7012] mb-4">
            시민사회협력사업
          </div>
          <h1 className="text-3xl font-bold text-[#111827] mb-3">시민사회협력사업 유형을 선택해주세요</h1>
          <p className="text-gray-500">NGO 규모와 사업 경험에 맞는 유형을 선택하면 최적화된 가이드를 제공합니다.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TYPES.map((type) => (
            <div
              key={type.id}
              onClick={handleSelect}
              className="relative bg-white border border-[#D9E6B7] rounded-2xl p-6 transition-all hover:border-[#8AA81E] hover:shadow-md cursor-pointer group"
            >

              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#EEF5D6] flex items-center justify-center flex-shrink-0">
                  {type.icon}
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[#111827] text-base">{type.label}</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${type.periodColor}`}>
                    {type.period}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-500 leading-relaxed mb-4">{type.desc}</p>

              <div className="space-y-1.5 mb-5">
                {type.features.map((f, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span className="w-1 h-1 rounded-full bg-[#8AA81E] flex-shrink-0" />
                      {f.left}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span className="w-1 h-1 rounded-full bg-[#8AA81E] flex-shrink-0" />
                      {f.right}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-1 text-[#8AA81E] text-sm font-semibold group-hover:gap-2 transition-all">
                이 유형으로 시작하기 <ChevronRight size={14} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
