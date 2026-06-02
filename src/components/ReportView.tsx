import { useMemo } from "react";
import {
  getNodeDisplayTitle,
  statusBadgeClass,
  typeBadgeClass,
} from "@/domain/nodes/nodeAppearance";
import { buildReportModel } from "@/domain/nodes/report";
import { NODE_STATUSES, NODE_TYPES, type YarukotoNode } from "@/domain/nodes/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ReportView({
  nodes,
  selectedId,
  onSelectNode,
}: {
  nodes: YarukotoNode[];
  selectedId?: string | null;
  onSelectNode: (nodeId: string) => void;
}) {
  const model = useMemo(() => buildReportModel(nodes), [nodes]);

  const todayFocusItems: Array<{ node: YarukotoNode; tag: string; tagClass: string }> = [
    ...model.overdueTasks.map((n) => ({
      node: n,
      tag: "期限切れ",
      tagClass: "text-rose-600 bg-rose-50 border-rose-200",
    })),
    ...model.upcomingTasks
      .filter((n) => !model.overdueTasks.some((o) => o.id === n.id))
      .map((n) => ({
        node: n,
        tag: "まもなく",
        tagClass: "text-amber-700 bg-amber-50 border-amber-200",
      })),
    ...model.doingTasks
      .filter(
        (n) =>
          !model.overdueTasks.some((o) => o.id === n.id) &&
          !model.upcomingTasks.some((u) => u.id === n.id),
      )
      .map((n) => ({
        node: n,
        tag: "対応中",
        tagClass: "text-sky-700 bg-sky-50 border-sky-200",
      })),
    ...model.nearDeadlineNotStartedTasks
      .filter(
        (n) =>
          !model.overdueTasks.some((o) => o.id === n.id) &&
          !model.upcomingTasks.some((u) => u.id === n.id),
      )
      .map((n) => ({
        node: n,
        tag: "Next",
        tagClass: "text-slate-600 bg-slate-50 border-slate-200",
      })),
  ];

  const riskItems: YarukotoNode[] = [
    ...model.overdueTasks,
    ...model.nearDeadlineNotStartedTasks.filter(
      (n) => !model.overdueTasks.some((o) => o.id === n.id),
    ),
  ];

  return (
    <div className="flex-1 overflow-auto bg-background p-4">
      {/* 1. Summary */}
      <div className="grid grid-cols-4 gap-3">
        <SummaryCard
          label="平均進捗"
          value={model.averageTaskProgress !== null ? `${model.averageTaskProgress}%` : "—"}
        />
        <SummaryCard label="完了率" value={`${model.doneRate}%`} />
        <SummaryCard
          label="期限切れ"
          value={String(model.overdueTasks.length)}
          urgent={model.overdueTasks.length > 0}
        />
        <SummaryCard label="7日以内" value={String(model.upcomingTasks.length)} />
      </div>

      {/* 2. Today Focus */}
      <Card className="mt-4">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm">今日見るべきタスク</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          {todayFocusItems.length === 0 ? (
            <p className="text-xs text-muted-foreground">対応が必要なタスクはありません。</p>
          ) : (
            <div className="space-y-1">
              {todayFocusItems.map(({ node, tag, tagClass }) => (
                <FocusRow
                  key={node.id}
                  node={node}
                  tag={tag}
                  tagClass={tagClass}
                  isSelected={selectedId === node.id}
                  onSelectNode={onSelectNode}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Completion */}
      <Card className="mt-4">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm">完了</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="mb-3 flex items-center gap-3">
            <span className="text-sm font-medium text-emerald-700">
              {model.doneTaskCount} / {model.taskCount} 件
            </span>
            <div className="h-2 flex-1 rounded bg-muted">
              <div
                className="h-2 rounded bg-emerald-500 transition-all"
                style={{ width: `${model.doneRate}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{model.doneRate}%</span>
          </div>
          <p className="mb-2 text-xs text-muted-foreground">
            {model.doneTaskCount > 0
              ? "完了済みのタスクがあります。流れは良いです。"
              : "まだ完了タスクはありません。Doing から1つ終わらせましょう。"}
          </p>
          {model.recentlyDoneTasks.length > 0 && (
            <div className="space-y-1">
              {model.recentlyDoneTasks.map((node) => (
                <NodeRow
                  key={node.id}
                  node={node}
                  isSelected={selectedId === node.id}
                  onSelectNode={onSelectNode}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Health / Breakdown */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <Breakdown
          kind="status"
          title="Status"
          items={model.statusBreakdown}
        />
        <Breakdown
          kind="type"
          title="Type"
          items={model.typeBreakdown}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        {/* 期限なし Task */}
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm">期限なし Task</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {model.noDateTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground">該当なし</p>
            ) : (
              <div className="space-y-1">
                {model.noDateTasks.slice(0, 8).map((node) => (
                  <NodeRow
                    key={node.id}
                    node={node}
                    isSelected={selectedId === node.id}
                    onSelectNode={onSelectNode}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* リスクあり Task */}
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm">リスクあり Task</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {riskItems.length === 0 ? (
              <p className="text-xs text-muted-foreground">該当なし</p>
            ) : (
              <div className="space-y-1">
                {riskItems.slice(0, 8).map((node) => (
                  <NodeRow
                    key={node.id}
                    node={node}
                    isSelected={selectedId === node.id}
                    onSelectNode={onSelectNode}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  urgent,
}: {
  label: string;
  value: string;
  urgent?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div
          className={cn(
            "mt-1 text-2xl font-semibold",
            urgent ? "text-rose-600" : undefined,
          )}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function FocusRow({
  isSelected,
  node,
  onSelectNode,
  tag,
  tagClass,
}: {
  isSelected: boolean;
  node: YarukotoNode;
  onSelectNode: (id: string) => void;
  tag: string;
  tagClass: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "grid w-full grid-cols-[64px_1fr_80px] items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-accent",
        isSelected && "bg-accent",
      )}
      onClick={() => onSelectNode(node.id)}
    >
      <span
        className={cn(
          "inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium",
          tagClass,
        )}
      >
        {tag}
      </span>
      <span className="truncate font-medium">{getNodeDisplayTitle(node)}</span>
      <span className="text-right text-muted-foreground">{node.dueDate ?? "期限なし"}</span>
    </button>
  );
}

function NodeRow({
  isSelected,
  node,
  onSelectNode,
}: {
  isSelected: boolean;
  node: YarukotoNode;
  onSelectNode: (id: string) => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "grid w-full grid-cols-[72px_1fr_80px] items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-accent",
        isSelected && "bg-accent",
      )}
      onClick={() => onSelectNode(node.id)}
    >
      <Badge
        variant="outline"
        className={cn("justify-center text-[10px]", statusBadgeClass(node.status))}
      >
        {node.status}
      </Badge>
      <span className="truncate font-medium">{getNodeDisplayTitle(node)}</span>
      <span className="text-right text-muted-foreground">{node.dueDate ?? "期限なし"}</span>
    </button>
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

