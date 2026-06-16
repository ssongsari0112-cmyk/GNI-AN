'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Sparkles, FolderOpen, Users, CheckCircle, Download, ArrowRight, X, Lightbulb, MessageSquare, Network, FileEdit } from 'lucide-react';

const STEPS = [
  { icon: <Lightbulb size={16} />, title: '아이디어 입력', desc: '사업 분야, 지역, 핵심 아이디어를 입력합니다.' },
  { icon: <MessageSquare size={16} />, title: 'AI 전문가 컨설팅', desc: '분야·지역·기획·M&E 전문가와 상담하며 내용을 구체화합니다.' },
  { icon: <Network size={16} />, title: '사업 구조화 (PDM)', desc: '문제·목표 분석과 논리모형(PDM)을 자동으로 설계합니다.' },
  { icon: <FileEdit size={16} />, title: '제안서 작성 & 내보내기', desc: '17개 섹션을 작성하고 PDF/Word로 바로 내보냅니다.' },
];

function RecentProjectsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">최근 프로젝트</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <FolderOpen size={20} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">저장된 프로젝트가 없습니다.</p>
          <p className="text-gray-400 text-xs mt-1">새 프로젝트를 시작해보세요.</p>
        </div>
        <div className="p-4 border-t border-gray-100">
          <Link
            href="/gni-an/project/new"
            onClick={onClose}
            className="block w-full bg-[#8AA81E] hover:bg-[#799516] text-white rounded-lg py-2.5 text-sm font-medium text-center transition-colors"
          >
            새 프로젝트 시작하기
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function GniAnHome() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F8F2]">
      {/* Header */}
      <header className="border-b border-[#D9E6B7] bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#8AA81E] flex items-center justify-center">
              <Sparkles size={17} className="text-white" />
            </div>
            <span className="font-bold text-lg text-[#111827] tracking-tight">GNI-AN</span>
            <span className="text-gray-400">지니안</span>
          </div>
          <nav className="flex items-center gap-5 text-gray-500">
            <span className="text-[#8AA81E] font-medium cursor-default">홈</span>
            <span className="cursor-not-allowed opacity-40">도움말</span>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Hero Section */}
        <section className="py-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-1.5 bg-[#EEF5D6] border border-[#D9E6B7] rounded-full px-4 py-1.5 text-sm font-medium text-[#5a7012] mb-6">
              <Sparkles size={13} />
              AI 기반 사업제안서 작성 도구
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-[#111827] leading-tight mb-5">
              <span className="whitespace-nowrap">굿네이버스 사업제안서,</span>
              <br />
              <span className="text-[#8AA81E]">AI와 함께</span> 작성하세요
            </h1>

            <p className="text-gray-500 text-xl leading-relaxed mb-8">
              아이디어에서 완성된 제안서까지.<br />
              KOICA 시민사회협력사업 제안서를 AI 전문가와 함께 단계별로 완성하세요.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/gni-an/project/new"
                className="inline-flex items-center justify-center gap-2 bg-[#8AA81E] hover:bg-[#799516] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors shadow-sm shadow-[#8AA81E]/20"
              >
                새 프로젝트 시작하기
                <ArrowRight size={20} />
              </Link>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center justify-center gap-2 bg-white border border-[#D9E6B7] text-[#111827] hover:bg-[#EEF5D6] px-8 py-4 rounded-xl font-medium text-lg transition-colors"
              >
                <FolderOpen size={20} className="text-[#8AA81E]" />
                기존 프로젝트 불러오기
              </button>
            </div>
          </div>

          {/* Right - 진행 단계 */}
          <div className="bg-white border border-[#D9E6B7] rounded-2xl p-8 shadow-sm">
            <h3 className="font-bold text-lg text-[#111827] mb-6">제안서 완성까지 4단계</h3>
            <div className="space-y-5">
              {STEPS.map((step, i) => (
                <div key={step.title} className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full bg-[#EEF5D6] text-[#5a7012] flex items-center justify-center flex-shrink-0">
                    {step.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-[#111827] mb-0.5">{`${i + 1}. ${step.title}`}</p>
                    <p className="text-gray-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="pb-12 grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: <Users size={28} className="text-[#8AA81E]" />,
              title: '분야별 AI 전문가',
              desc: '분야·지역·기획·M&E 전문가 4인의 AI 컨설팅으로 전략적 제안서를 설계합니다.',
            },
            {
              icon: <CheckCircle size={28} className="text-[#8AA81E]" />,
              title: 'KOICA 기준 최적화',
              desc: '심사 기준에 맞는 17개 섹션 가이드와 AI 검토로 채점 품질을 높입니다.',
            },
            {
              icon: <Download size={28} className="text-[#8AA81E]" />,
              title: '원클릭 내보내기',
              desc: '2026 사업제안서 국문 템플릿에 맞춰 완성된 PDF를 바로 내보냅니다.',
            },
          ].map((card) => (
            <div
              key={card.title}
              className="bg-white border border-[#D9E6B7] rounded-2xl p-8 hover:border-[#8AA81E] hover:shadow-md transition-all cursor-default"
            >
              <div className="w-14 h-14 rounded-xl bg-[#EEF5D6] flex items-center justify-center mb-5">
                {card.icon}
              </div>
              <h3 className="font-bold text-lg text-[#111827] mb-2">{card.title}</h3>
              <p className="text-gray-500 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </section>
      </main>

      {showModal && <RecentProjectsModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
