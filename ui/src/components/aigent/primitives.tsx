import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({
  index,
  title,
  subtitle,
  badge,
  children,
}: {
  index: string;
  title: string;
  subtitle?: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-border pt-8">
      <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="label-xs">{index}</span>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {subtitle ? (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
        {badge ? (
          <span className="label-xs rounded-sm border border-success/40 bg-success/10 px-2 py-0.5 text-[0.625rem] text-success">
            {badge}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function DemoTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "label-xs rounded-sm border border-border-strong px-2 py-0.5 text-[0.625rem]",
        className,
      )}
    >
      UI demonstration
    </span>
  );
}

export function Field({ k, v, mono }: { k: string; v: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-border/60 py-2 last:border-0">
      <span className="label-xs">{k}</span>
      <span
        className={cn(
          "text-right text-sm text-foreground",
          mono && "font-mono tabular-nums",
        )}
      >
        {v}
      </span>
    </div>
  );
}

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("panel p-5", className)}>{children}</div>;
}
