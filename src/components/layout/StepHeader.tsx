'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, ArrowLeft, Check } from 'lucide-react';
import { clsx } from 'clsx';

const STEPS = [
  { label: '아이디어', path: '/gni-an/ideation' },
  { label: '컨설팅', path: '/gni-an/ideation/experts' },
  { label: '구조화', path: '/gni-an/ideation/structure' },
  { label: '개요서', path: '/gni-an/ideation/summary' },
];

function getStepIndex(pathname: string): number {
  if (pathname.includes('/summary')) return 3;
  if (pathname.includes('/structure')) return 2;
  if (pathname.includes('/experts')) return 1;
  return 0;
}

export function StepHeader() {
  const pathname = usePathname();
  const currentStep = getStepIndex(pathname);

  return (
    <header className="border-b border-[#D9E6B7] bg-white/90 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-4">
        <Link href="/gni-an" className="flex items-center gap-1.5 text-gray-400 hover:text-[#8AA81E] transition-colors">
          <ArrowLeft size={15} />
        </Link>

        <Link href="/gni-an" className="flex items-center gap-1.5 mr-3">
          <div className="w-6 h-6 rounded-md bg-[#8AA81E] flex items-center justify-center">
            <Sparkles size={12} className="text-white" />
          </div>
          <span className="text-sm font-bold text-[#111827]">GNI-AN</span>
        </Link>

        <div className="flex items-center gap-0">
          {STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                i === currentStep
                  ? 'bg-[#EEF5D6] text-[#5a7012]'
                  : i < currentStep
                  ? 'text-[#8AA81E]'
                  : 'text-gray-400'
              )}>
                {i < currentStep ? (
                  <Check size={12} className="text-[#8AA81E]" />
                ) : (
                  <span className={clsx(
                    'w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold',
                    i === currentStep ? 'bg-[#8AA81E] text-white' : 'bg-gray-200 text-gray-400'
                  )}>{i + 1}</span>
                )}
                {step.label}
              </div>
              {i < STEPS.length - 1 && (
                <span className="text-gray-200 mx-0.5">›</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
