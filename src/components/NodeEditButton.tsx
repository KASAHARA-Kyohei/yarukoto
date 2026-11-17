import { Pencil } from "lucide-react";
import { useLanguage } from "@/app/LanguageProvider";
import { SHORTCUT_KEYS } from "@/app/shortcutKeys";
import { Button } from "@/components/ui/button";
import { getNodeDisplayTitle } from "@/domain/nodes/nodeAppearance";
import type { YarukotoNode } from "@/domain/nodes/types";
import { cn } from "@/lib/utils";

export function NodeEditButton({
  className,
  disabled,
  node,
  onEditNode,
}: {
  className?: string;
  disabled: boolean;
  node: Pick<YarukotoNode, "id" | "title">;
  onEditNode: (nodeId: string) => void;
}) {
  const { language, t } = useLanguage();

  return (
    <Button
      aria-label={t.editNamedNode(getNodeDisplayTitle(node, language))}
      className={cn("size-6 shrink-0 text-muted-foreground hover:text-foreground", className)}
      disabled={disabled}
      shortcut={SHORTCUT_KEYS.edit}
      size="icon"
      type="button"
      variant="ghost"
      onClick={(event) => {
        event.stopPropagation();
        onEditNode(node.id);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.stopPropagation();
      }}
    >
      <Pencil aria-hidden="true" className="size-3.5" />
    </Button>
  );
}
