export function PaneHeader({ title }: { title: string }) {
  return (
    <header className="flex h-12 shrink-0 items-center border-b border-border bg-background px-3">
      <h1 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h1>
    </header>
  );
}
