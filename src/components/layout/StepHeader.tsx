'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Sparkles, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { clsx } from 'clsx';

const STEPS = [
  { label: '아이디어', path: '/gni-an/ideation' },
  { label: '컨설팅', path: '/gni-an/ideation/experts' },
  { label: '사업구체화', path: '/gni-an/ideation/clarify' },
  { label: '구조화', path: '/gni-an/ideation/structure' },
  { label: '개요서', path: '/gni-an/ideation/summary' },
];

function getStepIndex(pathname: string): number {
  if (pathname.includes('/summary')) return 4;
  if (pathname.includes('/structure')) return 3;
  if (pathname.includes('/clarify')) return 2;
  if (pathname.includes('/experts')) return 1;
  return 0;
}

export function StepHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const currentStep = getStepIndex(pathname);
  const prevStep = STEPS[currentStep - 1];
  const nextStep = STEPS[currentStep + 1];
  const nextPath = nextStep?.path || (currentStep === STEPS.length - 1 ? '/gni-an/create' : undefined);

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
          {STEPS.map((step, i) => {
            const isPast = i < currentStep;
            const isCurrent = i === currentStep;
            const inner = (
              <div className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                isCurrent
                  ? 'bg-[#EEF5D6] text-[#5a7012]'
                  : isPast
                  ? 'text-[#8AA81E] hover:bg-[#EEF5D6] cursor-pointer'
                  : 'text-gray-400 cursor-default'
              )}>
                {isPast ? (
                  <Check size={12} className="text-[#8AA81E]" />
                ) : (
                  <span className={clsx(
                    'w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold',
                    isCurrent ? 'bg-[#8AA81E] text-white' : 'bg-gray-200 text-gray-400'
                  )}>{i + 1}</span>
                )}
                {step.label}
              </div>
            );
            return (
              <div key={step.label} className="flex items-center">
                {isPast ? <Link href={step.path}>{inner}</Link> : inner}
                {i < STEPS.length - 1 && (
                  <span className="text-gray-200 mx-0.5">›</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => prevStep && router.push(prevStep.path)}
            disabled={!prevStep}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#8AA81E] border border-gray-200 hover:border-[#8AA81E] rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={13} />이전
          </button>
          <button
            onClick={() => nextPath && router.push(nextPath)}
            disabled={!nextPath}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#8AA81E] border border-gray-200 hover:border-[#8AA81E] rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="점검용 건너뛰기"
          >
            건너뛰기<ArrowRight size={13} />
          </button>
        </div>
      </div>
    </header>
  );
}
