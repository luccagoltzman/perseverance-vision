import type { ReactNode } from 'react';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
}

export function SectionTitle({ title, subtitle, trailing }: SectionTitleProps) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div>
        <h2 className="font-display text-lg text-white tracking-wide">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {trailing}
    </div>
  );
}
