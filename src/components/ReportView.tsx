import { useLanguage } from "@/app/LanguageProvider";
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
import { NodeEditButton } from "./NodeEditButton";

export function ReportView({
  editDisabled,
  nodes,
  onEditNode,
  selectedId,
  onSelectNode,
}: {
  editDisabled: boolean;
  nodes: YarukotoNode[];
  onEditNode: (nodeId: string) => void;
  selectedId?: string | null;
  onSelectNode: (nodeId: string) => void;
}) {
  const { t } = useLanguage();
  const model = useMemo(() => buildReportModel(nodes), [nodes]);

  const todayFocusItems: Array<{ node: YarukotoNode; tag: string; tagClass: string }> = [
    ...model.overdueTasks.map((n) => ({
      node: n,
      tag: t.overdue,
      tagClass: "text-rose-600 bg-rose-50 border-rose-200",
    })),
    ...model.upcomingTasks
      .filter((n) => !model.overdueTasks.some((o) => o.id === n.id))
      .map((n) => ({
        node: n,
        tag: t.dueSoon,
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
        tag: t.inProgress,
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
          label={t.averageProgress}
          value={model.averageTaskProgress !== null ? `${model.averageTaskProgress}%` : "—"}
        />
        <SummaryCard label={t.completionRate} value={`${model.doneRate}%`} />
        <SummaryCard
          label={t.overdue}
          value={String(model.overdueTasks.length)}
          urgent={model.overdueTasks.length > 0}
        />
        <SummaryCard label={t.withinWeek} value={String(model.upcomingTasks.length)} />
      </div>

      {/* 2. Today Focus */}
      <Card className="mt-4">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm">{t.todaysTasks}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          {todayFocusItems.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t.noTodaysTasks}</p>
          ) : (
            <div className="space-y-1">
              {todayFocusItems.map(({ node, tag, tagClass }) => (
                <ReportNodeRow
                  editDisabled={editDisabled}
                  focusTag={{ label: tag, className: tagClass }}
                  isSelected={selectedId === node.id}
                  key={node.id}
                  node={node}
                  onEditNode={onEditNode}
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
          <CardTitle className="text-sm">{t.completed}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="mb-3 flex items-center gap-3">
            <span className="text-sm font-medium text-emerald-700">
              {t.tasksCompleted(model.doneTaskCount, model.taskCount)}
            </span>
            <div className="h-2 flex-1 rounded bg-muted">
              <div
                className="h-2 rounded bg-emerald-500 transition-all"
                style={{ width: `${model.doneRate}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{model.doneRate}%</span>
          </div>
          {model.recentlyDoneTasks.length > 0 && (
            <div className="space-y-1">
              {model.recentlyDoneTasks.map((node) => (
                <ReportNodeRow
                  editDisabled={editDisabled}
                  onEditNode={onEditNode}
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
            <CardTitle className="text-sm">{t.tasksWithoutDueDate}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {model.noDateTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t.noMatchingTasks}</p>
            ) : (
              <div className="space-y-1">
                {model.noDateTasks.slice(0, 8).map((node) => (
                  <ReportNodeRow
                    editDisabled={editDisabled}
                    onEditNode={onEditNode}
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
            <CardTitle className="text-sm">{t.atRiskTasks}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {riskItems.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t.noMatchingTasks}</p>
            ) : (
              <div className="space-y-1">
                {riskItems.slice(0, 8).map((node) => (
                  <ReportNodeRow
                    editDisabled={editDisabled}
                    onEditNode={onEditNode}
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

function ReportNodeRow({
  editDisabled,
  focusTag,
  isSelected,
  node,
  onEditNode,
  onSelectNode,
}: {
  editDisabled: boolean;
  focusTag?: { label: string; className: string };
  isSelected: boolean;
  node: YarukotoNode;
  onEditNode: (nodeId: string) => void;
  onSelectNode: (nodeId: string) => void;
}) {
  const { language, t } = useLanguage();

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded pr-1 hover:bg-accent",
        isSelected && "bg-accent",
      )}
    >
      <button
        className="grid min-w-0 flex-1 grid-cols-[72px_minmax(0,1fr)_80px] items-center gap-2 rounded px-2 py-1.5 text-left text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        type="button"
        onClick={() => onSelectNode(node.id)}
      >
        {focusTag ? (
          <span
            className={cn(
              "inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium",
              focusTag.className,
            )}
          >
            {focusTag.label}
          </span>
        ) : (
          <Badge
            className={cn("justify-center text-[10px]", statusBadgeClass(node.status))}
            variant="outline"
          >
            {node.status}
          </Badge>
        )}
        <span className="truncate font-medium">{getNodeDisplayTitle(node, language)}</span>
        <span className="text-right text-muted-foreground">{node.dueDate ?? t.reportNoDueDate}</span>
      </button>
      <NodeEditButton disabled={editDisabled} node={node} onEditNode={onEditNode} />
    </div>
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
