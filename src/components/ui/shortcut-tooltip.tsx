import * as Tooltip from "@radix-ui/react-tooltip";
import type { ReactElement, ReactNode } from "react";

export function ShortcutTooltipProvider({ children }: { children: ReactNode }) {
  return (
    <Tooltip.Provider delayDuration={350} disableHoverableContent>
      {children}
    </Tooltip.Provider>
  );
}

export function ShortcutTooltip({
  children,
  keys,
  label,
}: {
  children: ReactElement;
  keys: string;
  label?: string;
}) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className="z-[60] flex items-center gap-2 rounded-md border border-border bg-popover px-2 py-1.5 text-xs text-popover-foreground shadow-md"
          collisionPadding={8}
          data-slot="shortcut-tooltip"
          sideOffset={6}
        >
          {label}
          <kbd className="whitespace-nowrap rounded border border-border bg-muted px-1.5 py-0.5 font-mono font-semibold">
            {keys}
          </kbd>
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
