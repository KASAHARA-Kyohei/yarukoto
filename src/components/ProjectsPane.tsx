import { ArrowDown, ArrowUp } from "lucide-react";
import { useLanguage } from "@/app/LanguageProvider";
import { SHORTCUT_KEYS } from "@/app/shortcutKeys";
import type { ActivePane } from "@/app/types";
import type { ThemeId } from "@/app/theme";
import { Button } from "@/components/ui/button";
import {
  getNodeDisplayTitle,
  statusBadgeClass,
} from "@/domain/nodes/nodeAppearance";
import type { YarukotoNode } from "@/domain/nodes/types";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { PaneHeader } from "./PaneHeader";
import { ThemeSwitcher } from "./ThemeSwitcher";

export function ProjectsPane({
  activePane,
  activeRootId,
  isMutating,
  isVisible,
  roots,
  themeId,
  onActivate,
  onChangeTheme,
  onCreateRoot,
  onMoveDown,
  onMoveUp,
  onSelectRoot,
}: {
  activePane: ActivePane;
  activeRootId: string | null;
  isMutating: boolean;
  isVisible: boolean;
  roots: YarukotoNode[];
  themeId: ThemeId;
  onActivate: () => void;
  onChangeTheme: (themeId: ThemeId) => void;
  onCreateRoot: () => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onSelectRoot: (rootId: string) => void;
}) {
  const { language, t } = useLanguage();
  const activeRootIndex = roots.findIndex((root) => root.id === activeRootId);

  return (
    <aside
      className={cn(
        "relative flex w-64 shrink-0 flex-col border-r border-border bg-muted/80 ring-inset transition-[margin-left,visibility,box-shadow,background-color] duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none",
        !isVisible && "invisible -ml-64",
        activePane === "projects"
          ? "bg-secondary"
          : "after:pointer-events-none after:absolute after:inset-0 after:bg-foreground/7 after:content-['']",
      )}
      data-app-pane="projects"
      inert={!isVisible}
      onMouseDown={onActivate}
    >
      <PaneHeader title="Projects">
        <div
          className="flex gap-1"
          onKeyDown={(event) => {
            if (event.key === "Enter") event.stopPropagation();
          }}
        >
          <Button
            aria-label={t.moveProjectUp}
            className="size-7"
            disabled={isMutating || activeRootIndex <= 0}
            shortcut={SHORTCUT_KEYS.moveUp}
            size="icon"
            type="button"
            variant="ghost"
            onClick={onMoveUp}
          >
            <ArrowUp aria-hidden="true" className="size-4" />
          </Button>
          <Button
            aria-label={t.moveProjectDown}
            className="size-7"
            disabled={
              isMutating || activeRootIndex === -1 || activeRootIndex === roots.length - 1
            }
            shortcut={SHORTCUT_KEYS.moveDown}
            size="icon"
            type="button"
            variant="ghost"
            onClick={onMoveDown}
          >
            <ArrowDown aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </PaneHeader>
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
              {getNodeDisplayTitle(root, language)}
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
            shortcut={SHORTCUT_KEYS.addProject}
            variant="outline"
            onClick={onCreateRoot}
            type="button"
          >
            {isMutating ? t.addingProject : t.addProject}
          </Button>
          <LanguageSwitcher />
          <ThemeSwitcher themeId={themeId} onChangeTheme={onChangeTheme} />
        </div>
      </div>
    </aside>
  );
}
