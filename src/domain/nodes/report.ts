import { buildTaskProgressMap } from "./progress";
import { NODE_STATUSES, NODE_TYPES, type NodeStatus, type NodeType, type YarukotoNode } from "./types";
import { addDays, toDateKey } from "../../utils/date";

export type ReportModel = {
  totalCount: number;
  taskCount: number;
  openTaskCount: number;
  doneTaskCount: number;
  doneRate: number;
  averageTaskProgress: number | null;

  overdueTasks: YarukotoNode[];
  upcomingTasks: YarukotoNode[];
  doingTasks: YarukotoNode[];
  nearDeadlineNotStartedTasks: YarukotoNode[];
  noDateTasks: YarukotoNode[];
  recentlyDoneTasks: YarukotoNode[];

  statusBreakdown: Array<{ label: NodeStatus; value: number }>;
  typeBreakdown: Array<{ label: NodeType; value: number }>;
};

export function buildReportModel(
  nodes: YarukotoNode[],
  todayKey?: string,
): ReportModel {
  const today = todayKey ?? toDateKey(new Date());
  const nextWeek = toDateKey(addDays(new Date(today), 7));

  const tasks = nodes.filter((n) => n.type === "Task");
  const openTasks = tasks.filter((n) => n.status !== "Done");
  const doneTasks = tasks.filter((n) => n.status === "Done");

  const taskCount = tasks.length;
  const openTaskCount = openTasks.length;
  const doneTaskCount = doneTasks.length;
  const doneRate =
    taskCount === 0 ? 0 : Math.round((doneTaskCount / taskCount) * 100);

  // 平均進捗率
  let averageTaskProgress: number | null = null;
  if (taskCount > 0) {
    const progressMap = buildTaskProgressMap(nodes);
    let sum = 0;
    let count = 0;
    for (const task of tasks) {
      const info = progressMap.get(task.id);
      if (info !== undefined) {
        sum += info.value;
        count++;
      }
    }
    averageTaskProgress = count > 0 ? Math.round(sum / count) : 0;
  }

  // 期限切れ: open Task, dueDate あり, dueDate < today
  const overdueTasks = openTasks.filter(
    (n) => n.dueDate && n.dueDate < today,
  );

  // 7日以内: open Task, dueDate あり, today <= dueDate <= nextWeek
  const upcomingTasks = openTasks.filter(
    (n) => n.dueDate && n.dueDate >= today && n.dueDate <= nextWeek,
  );

  // Doing: Task, status === "Doing"
  const doingTasks = tasks.filter((n) => n.status === "Doing");

  // 未着手で期限が近い: open Task, Inbox|Next, today <= dueDate <= nextWeek
  const nearDeadlineNotStartedTasks = openTasks.filter(
    (n) =>
      (n.status === "Inbox" || n.status === "Next") &&
      n.dueDate &&
      n.dueDate >= today &&
      n.dueDate <= nextWeek,
  );

  // 期限なし: open Task, startDate === null, dueDate === null
  const noDateTasks = openTasks.filter(
    (n) => n.startDate === null && n.dueDate === null,
  );

  // 最近完了: Task, Done, updatedAt 降順, 最大5件
  const recentlyDoneTasks = [...doneTasks]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  // Breakdown
  const statusBreakdown = NODE_STATUSES.map((status) => ({
    label: status as NodeStatus,
    value: nodes.filter((n) => n.status === status).length,
  }));

  const typeBreakdown = NODE_TYPES.map((type) => ({
    label: type as NodeType,
    value: nodes.filter((n) => n.type === type).length,
  }));

  return {
    totalCount: nodes.length,
    taskCount,
    openTaskCount,
    doneTaskCount,
    doneRate,
    averageTaskProgress,
    overdueTasks,
    upcomingTasks,
    doingTasks,
    nearDeadlineNotStartedTasks,
    noDateTasks,
    recentlyDoneTasks,
    statusBreakdown,
    typeBreakdown,
  };
}
