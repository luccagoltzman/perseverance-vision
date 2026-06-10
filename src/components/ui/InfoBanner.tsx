import type { ReactNode } from 'react';

type BannerVariant = 'info' | 'warning' | 'success';

interface InfoBannerProps {
  variant?: BannerVariant;
  title?: string;
  children: ReactNode;
}

const variants: Record<BannerVariant, string> = {
  info: 'bg-sky-500/10 border-sky-500/25 text-sky-200',
  warning: 'bg-amber-500/10 border-amber-500/25 text-amber-200',
  success: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-200',
};

export function InfoBanner({ variant = 'info', title, children }: InfoBannerProps) {
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${variants[variant]}`}>
      {title && <p className="font-medium mb-1">{title}</p>}
      <div className="text-xs opacity-90 [&_a]:underline [&_a]:hover:opacity-80 [&_code]:font-mono [&_code]:text-[11px]">
        {children}
      </div>
    </div>
  );
}
