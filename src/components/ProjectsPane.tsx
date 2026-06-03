import type { ActivePane } from "@/app/types";
import type { ThemeId } from "@/app/theme";
import { Button } from "@/components/ui/button";
import {
  getNodeDisplayTitle,
  statusBadgeClass,
} from "@/domain/nodes/nodeAppearance";
import type { YarukotoNode } from "@/domain/nodes/types";
import { cn } from "@/lib/utils";
import { PaneHeader } from "./PaneHeader";
import { ThemeSwitcher } from "./ThemeSwitcher";

export function ProjectsPane({
  activePane,
  activeRootId,
  isMutating,
  roots,
  themeId,
  onActivate,
  onChangeTheme,
  onCreateRoot,
  onSelectRoot,
}: {
  activePane: ActivePane;
  activeRootId: string | null;
  isMutating: boolean;
  roots: YarukotoNode[];
  themeId: ThemeId;
  onActivate: () => void;
  onChangeTheme: (themeId: ThemeId) => void;
  onCreateRoot: () => void;
  onSelectRoot: (rootId: string) => void;
}) {
  return (
    <aside
      className={cn(
        "relative flex w-64 shrink-0 flex-col border-r border-border bg-muted/80 ring-inset transition-[box-shadow,background-color]",
        activePane === "projects"
          ? "bg-secondary"
          : "after:pointer-events-none after:absolute after:inset-0 after:bg-foreground/7 after:content-['']",
      )}
      data-app-pane="projects"
      onMouseDown={onActivate}
    >
      <PaneHeader title="Projects" />
      <div className="flex-1 overflow-y-auto p-2">
        {roots.map((root) => (
          <button
            className={cn(
              "mb-1 block w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
              activeRootId === root.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-card",
              activePane === "projects" &&
                activeRootId === root.id &&
                "ring-2 ring-primary/30 ring-offset-1 ring-offset-muted",
            )}
            data-project-focus-id={root.id}
            key={root.id}
            onClick={() => onSelectRoot(root.id)}
            type="button"
          >
            <span className="block truncate font-medium">
              {getNodeDisplayTitle(root)}
            </span>
            <span
              className={cn(
                "inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                activeRootId === root.id
                  ? "border-primary-foreground/20 bg-primary-foreground/12 text-primary-foreground"
                  : statusBadgeClass(root.status),
              )}
            >
              {root.status}
            </span>
          </button>
        ))}
      </div>
      <div className="border-t border-border p-2">
        <div className="flex gap-2">
          <Button
            className="min-w-0 flex-1"
            disabled={isMutating}
            variant="outline"
            onClick={onCreateRoot}
            type="button"
          >
            {isMutating ? "追加中..." : "ルート追加"}
          </Button>
          <ThemeSwitcher themeId={themeId} onChangeTheme={onChangeTheme} />
        </div>
      </div>
    </aside>
  );
}
