'use client';

import { cn } from '@/lib/utils';

const WATERMARK_TEXT = 'RPMA v2';
const WATERMARK_SUBTEXT = 'Proprietary software';

interface WatermarkProps {
  className?: string;
}

export function Watermark({ className }: WatermarkProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none fixed bottom-3 right-3 z-50 select-none',
        'rounded-full border border-[hsl(var(--rpma-border))]/70 bg-background/85 px-3 py-1.5',
        'text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground shadow-sm backdrop-blur-md',
        className
      )}
    >
      <span className="block leading-none">{WATERMARK_TEXT}</span>
      <span className="block mt-1 text-[9px] leading-none tracking-[0.24em] opacity-80">
        {WATERMARK_SUBTEXT}
      </span>
    </div>
  );
}
