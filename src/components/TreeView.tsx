import { useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { TreePeriodCell, TreePeriodHeader } from "./TreePeriod";
import { TaskProgressInline } from "./TaskProgress";
import {
  getNodeDisplayTitle,
  statusBadgeClass,
  typeBadgeClass,
} from "@/domain/nodes/nodeAppearance";
import type { TaskProgressInfo } from "@/domain/nodes/progress";
import {
  getTimelineMarkers,
  getNodePeriodDates,
  getTimelineBoundsFromRanges,
  getTimelineModeFromRanges,
  getTimelinePeriodColumnMinWidth,
  getTodayLineStyle,
  isInvalidDateRange,
} from "@/domain/nodes/period";
import type { FlatTreeNode } from "@/domain/nodes/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const INDENT_STEP = 22;
const INDENT_START = 18;
const TREE_ROW_GAP = 20;

function getTreeColumns(periodColumnMinWidth: number) {
  return `minmax(320px, 520px) 68px 74px 92px minmax(${periodColumnMinWidth}px, 1fr)`;
}

function IndentGuides({
  depth,
  guideColumns,
  isLastSibling,
}: {
  depth: number;
  guideColumns: boolean[];
  isLastSibling: boolean;
}) {
  if (depth === 0) {
    return null;
  }

  const branchLeft = INDENT_START + (depth - 1) * INDENT_STEP;

  return (
    <div className="pointer-events-none absolute inset-y-0 left-0">
      {guideColumns.slice(0, -1).map((shouldContinue, index) =>
        shouldContinue ? (
          <span
            className="absolute top-0 w-px rounded-full bg-border/70"
            key={index}
            style={{
              bottom: -TREE_ROW_GAP,
              left: INDENT_START + index * INDENT_STEP,
            }}
          />
        ) : null,
      )}
      <span
        className="absolute w-px rounded-none bg-border/70"
        style={{
          height: `calc(50% + ${TREE_ROW_GAP}px)`,
          left: branchLeft,
          top: -TREE_ROW_GAP,
        }}
      />
      {!isLastSibling ? (
        <span
          className="absolute top-1/2 w-px rounded-full bg-border/70"
          style={{ bottom: -TREE_ROW_GAP, left: branchLeft }}
        />
      ) : null}
      <span
        className="absolute top-1/2 h-px w-3 -translate-y-1/2 rounded-full bg-border/70"
        style={{ left: branchLeft }}
      />
    </div>
  );
}

export function TreeView({
  expandedIds,
  onSelectNode,
  onToggleExpanded,
  selectedId,
  taskProgressById,
  visibleNodes,
}: {
  expandedIds: Set<string>;
  onSelectNode: (nodeId: string) => void;
  onToggleExpanded: (nodeId: string) => void;
  selectedId: string | null;
  taskProgressById: Map<string, TaskProgressInfo>;
  visibleNodes: FlatTreeNode[];
}) {
  const periodRanges = useMemo(
    () => [
      ...visibleNodes.map(({ node }) => getNodePeriodDates(node)),
      ...visibleNodes.map(({ descendantPeriod }) => descendantPeriod),
    ],
    [visibleNodes],
  );
  const timelineMode = useMemo(
    () => getTimelineModeFromRanges(periodRanges),
    [periodRanges],
  );
  const timelineBounds = useMemo(
    () => getTimelineBoundsFromRanges(periodRanges),
    [periodRanges],
  );
  const markers = useMemo(
    () => getTimelineMarkers(timelineBounds, timelineMode),
    [timelineBounds, timelineMode],
  );
  const todayLineStyle = useMemo(
    () => getTodayLineStyle(timelineBounds),
    [timelineBounds],
  );
  const periodColumnMinWidth = useMemo(
    () => getTimelinePeriodColumnMinWidth(timelineMode),
    [timelineMode],
  );
  const treeColumns = useMemo(
    () => getTreeColumns(periodColumnMinWidth),
    [periodColumnMinWidth],
  );
  const treeMinWidth = useMemo(
    () => 320 + 68 + 74 + 92 + periodColumnMinWidth + 40,
    [periodColumnMinWidth],
  );

  return (
    <div className="flex-1 overflow-auto px-2 py-3">
      {visibleNodes.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          ルートを追加してください。
        </div>
      ) : (
        <div style={{ minWidth: `${treeMinWidth}px` }}>
          <div
            className="mb-2 grid items-end gap-y-1 px-2 text-[11px] font-medium uppercase text-muted-foreground/90"
            style={{ gridTemplateColumns: treeColumns }}
          >
            <div className="pl-2">Title</div>
            <div>Type</div>
            <div>Status</div>
            <div>Progress</div>
            <TreePeriodHeader
              markers={markers}
              timelineBounds={timelineBounds}
              timelineMode={timelineMode}
              todayLineStyle={todayLineStyle}
            />
          </div>
          {visibleNodes.map(
            ({
              childCount,
              descendantPeriod,
              guideColumns,
              isLastSibling,
              node,
              depth,
              hasChildren,
            }) => {
              const isSelected = node.id === selectedId;
              const isExpanded = expandedIds.has(node.id);
              const isInvalidRange = isInvalidDateRange(node);
              const taskProgress = taskProgressById.get(node.id) ?? null;
              return (
                <div
                  className={cn(
                    "group mb-1 grid h-11 items-center rounded-md border text-sm transition-colors",
                    isInvalidRange && "border-amber-300/70",
                    isSelected
                      ? "border-primary/70 bg-background"
                      : "border-transparent hover:bg-muted",
                  )}
                  key={node.id}
                  onClick={() => onSelectNode(node.id)}
                  style={{ gridTemplateColumns: treeColumns }}
                >
                  <div className="relative flex min-w-0 items-center pl-2">
                    <IndentGuides
                      depth={depth}
                      guideColumns={guideColumns}
                      isLastSibling={isLastSibling}
                    />
                    <div
                      className="flex min-w-0 items-center"
                      style={{ marginLeft: depth * INDENT_STEP }}
                    >
                      <div
                        className={cn(
                          "flex h-7 shrink-0 items-center justify-center",
                          hasChildren ? "mr-2 w-7" : "mr-1 w-3",
                        )}
                      >
                        {hasChildren ? (
                          <button
                            aria-label={isExpanded ? "折りたたみ" : "展開"}
                            className="grid h-7 w-7 place-items-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={(event) => {
                              event.stopPropagation();
                              onToggleExpanded(node.id);
                            }}
                            type="button"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        ) : (
                          <span className="h-7 w-3" />
                        )}
                      </div>
                      <button
                        className={cn(
                          "min-w-0 truncate rounded-md px-2 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isSelected && "bg-accent",
                        )}
                        data-node-focus-id={node.id}
                        type="button"
                      >
                        <span className="font-medium">
                          {getNodeDisplayTitle(node)}
                        </span>
                        {hasChildren ? (
                          <span className="ml-2 rounded-full border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {childCount}
                          </span>
                        ) : null}
                      </button>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "justify-self-start px-1.5 py-0 text-[11px]",
                      typeBadgeClass(node.type),
                    )}
                  >
                    {node.type}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "justify-self-start px-1.5 py-0 text-[11px]",
                      statusBadgeClass(node.status),
                    )}
                  >
                    {node.status}
                  </Badge>
                  <div className="min-w-0 pr-2">
                    <TaskProgressInline progress={taskProgress} />
                  </div>
                  <TreePeriodCell
                    descendantPeriod={descendantPeriod}
                    markers={markers}
                    node={node}
                    timelineBounds={timelineBounds}
                    todayLineStyle={todayLineStyle}
                  />
                </div>
              );
            },
          )}
        </div>
      )}
    </div>
  );
}
