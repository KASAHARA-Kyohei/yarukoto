import type { ReactNode } from "react";

export function PaneHeader({ children, title }: { children?: ReactNode; title: string }) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-3">
      <h1 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h1>
      {children}
    </header>
  );
}
