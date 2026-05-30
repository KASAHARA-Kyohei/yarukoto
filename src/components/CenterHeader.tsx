import type { CenterView } from "../types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const VIEW_LABELS: Array<{ value: CenterView; label: string }> = [
  { value: "tree", label: "Tree" },
  { value: "calendar", label: "Calendar" },
  { value: "report", label: "Report" },
];

export function CenterHeader({
  onChangeView,
  view,
}: {
  onChangeView: (view: CenterView) => void;
  view: CenterView;
}) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-3">
      <h1 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Workspace
      </h1>
      <Tabs value={view} onValueChange={(value) => onChangeView(value as CenterView)}>
        <TabsList>
          {VIEW_LABELS.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </header>
  );
}
