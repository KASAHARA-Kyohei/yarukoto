import { statusBadgeClass, typeBadgeClass } from "@/domain/nodes/nodeAppearance";
import { NODE_STATUSES, NODE_TYPES, type YarukotoNode } from "@/domain/nodes/types";
import { Badge } from "@/components/ui/badge";
import { addDays, toDateKey } from "../utils/date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ReportView({
  nodes,
  onSelectNode,
}: {
  nodes: YarukotoNode[];
  onSelectNode: (nodeId: string) => void;
}) {
  const today = toDateKey(new Date());
  const nextWeek = toDateKey(addDays(new Date(), 7));
  const openNodes = nodes.filter((node) => node.status !== "Done");
  const overdueNodes = openNodes.filter(
    (node) => node.dueDate && node.dueDate < today,
  );
  const upcomingNodes = openNodes.filter(
    (node) => node.dueDate && node.dueDate >= today && node.dueDate <= nextWeek,
  );
  const byStatus = NODE_STATUSES.map((status) => ({
    label: status,
    value: nodes.filter((node) => node.status === status).length,
  }));
  const byType = NODE_TYPES.map((type) => ({
    label: type,
    value: nodes.filter((node) => node.type === type).length,
  }));

  return (
    <div className="flex-1 overflow-auto bg-background p-4">
      <div className="grid grid-cols-4 gap-3">
        <MetricCard label="Total" value={nodes.length} />
        <MetricCard label="Open" value={openNodes.length} />
        <MetricCard label="Overdue" value={overdueNodes.length} />
        <MetricCard label="Next 7 days" value={upcomingNodes.length} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <Breakdown kind="status" title="Status" items={byStatus} />
        <Breakdown kind="type" title="Type" items={byType} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <NodeList title="期限切れ" nodes={overdueNodes} onSelectNode={onSelectNode} />
        <NodeList
          title="7日以内の期限"
          nodes={upcomingNodes}
          onSelectNode={onSelectNode}
        />
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function Breakdown({
  items,
  kind,
  title,
}: {
  items: Array<{ label: string; value: number }>;
  kind: "status" | "type";
  title: string;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <Card>
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-3 pt-0">
        {items.map((item) => (
          <div className="grid grid-cols-[80px_1fr_32px] items-center gap-2 text-xs" key={item.label}>
            <Badge
              variant="outline"
              className={
                kind === "status"
                  ? statusBadgeClass(item.label as (typeof NODE_STATUSES)[number])
                  : typeBadgeClass(item.label as (typeof NODE_TYPES)[number])
              }
            >
              {item.label}
            </Badge>
            <div className="h-2 rounded bg-muted">
              <div
                className="h-2 rounded bg-primary"
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
            <span className="text-right font-semibold">{item.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function NodeList({
  nodes,
  onSelectNode,
  title,
}: {
  nodes: YarukotoNode[];
  onSelectNode: (nodeId: string) => void;
  title: string;
}) {
  return (
    <Card>
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {nodes.length === 0 ? (
          <div className="text-sm text-muted-foreground">該当なし</div>
        ) : (
          nodes
            .slice(0, 8)
            .map((node) => (
              <button
                className="mb-1 grid w-full grid-cols-[1fr_88px] rounded px-2 py-1.5 text-left text-xs hover:bg-accent"
                key={node.id}
                onClick={() => onSelectNode(node.id)}
                type="button"
              >
                <span className="truncate font-medium">{node.title}</span>
                <span className="text-right text-muted-foreground">{node.dueDate}</span>
              </button>
            ))
        )}
      </CardContent>
    </Card>
  );
}
