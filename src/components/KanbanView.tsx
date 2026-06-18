import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DragDropProvider,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/react";
import { CalendarDays, GripVertical } from "lucide-react";
import type {
  KanbanCard,
  KanbanColumn as KanbanColumnModel,
  KanbanModel,
} from "@/domain/nodes/kanban";
import {
  getNodeDisplayTitle,
  priorityBadgeClass,
  priorityLabel,
  statusBadgeClass,
} from "@/domain/nodes/nodeAppearance";
import type { NodeStatus } from "@/domain/nodes/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type CardDragData = {
  kind: "kanban-card";
  nodeId: string;
  status: NodeStatus;
};

type ColumnDropData = {
  kind: "kanban-column";
  status: NodeStatus;
};

const POINTER_SENSORS = [PointerSensor];

const COLUMN_ACCENTS: Record<NodeStatus, string> = {
  Inbox: "border-t-zinc-400",
  Next: "border-t-sky-500",
  Doing: "border-t-amber-500",
  Done: "border-t-emerald-500",
};

function isCardDragData(value: unknown): value is CardDragData {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as CardDragData).kind === "kanban-card"
  );
}

function isColumnDropData(value: unknown): value is ColumnDropData {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as ColumnDropData).kind === "kanban-column"
  );
}

export function KanbanView({
  disabled,
  model,
  onChangeStatus,
  onSelectNode,
  selectedId,
}: {
  disabled: boolean;
  model: KanbanModel;
  onChangeStatus: (nodeId: string, status: NodeStatus) => Promise<unknown>;
  onSelectNode: (nodeId: string) => void;
  selectedId: string | null;
}) {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const cardElements = useRef(new Map<string, HTMLButtonElement>());
  const activeCard = useMemo(
    () =>
      model.columns
        .flatMap((column) => column.cards)
        .find((card) => card.node.id === activeCardId) ?? null,
    [activeCardId, model],
  );

  const registerCardElement = useCallback(
    (nodeId: string, element: HTMLButtonElement | null) => {
      if (element) {
        cardElements.current.set(nodeId, element);
      } else {
        cardElements.current.delete(nodeId);
      }
    },
    [],
  );

  useEffect(() => {
    if (!selectedId) {
      return;
    }
    cardElements.current.get(selectedId)?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [selectedId]);

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.operation.source?.data;
    if (isCardDragData(data)) {
      setActiveCardId(data.nodeId);
      onSelectNode(data.nodeId);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCardId(null);
    if (event.canceled) {
      return;
    }
    const source = event.operation.source?.data;
    const target = event.operation.target?.data;
    if (
      !isCardDragData(source) ||
      !isColumnDropData(target) ||
      source.status === target.status
    ) {
      return;
    }
    void onChangeStatus(source.nodeId, target.status);
  };

  const taskCount = model.columns.reduce(
    (total, column) => total + column.cards.length,
    0,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Status board</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {taskCount}件のTaskをツリー順で表示
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          ドラッグまたは H / L で状態変更
        </p>
      </div>

      <DragDropProvider
        sensors={POINTER_SENSORS}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
      >
        <div className="min-h-0 flex-1 overflow-auto p-3">
          <div className="grid min-h-full min-w-[1080px] grid-cols-4 gap-3">
            {model.columns.map((column) => (
              <KanbanColumn
                column={column}
                disabled={disabled}
                key={column.status}
                registerCardElement={registerCardElement}
                selectedId={selectedId}
                onSelectNode={onSelectNode}
              />
            ))}
          </div>
        </div>
        <DragOverlay
          className="pointer-events-none z-50 w-[250px]"
          dropAnimation={{ duration: 180, easing: "ease-out" }}
        >
          {activeCard ? <KanbanCardSurface card={activeCard} overlay /> : null}
        </DragOverlay>
      </DragDropProvider>
    </div>
  );
}

function KanbanColumn({
  column,
  disabled,
  onSelectNode,
  registerCardElement,
  selectedId,
}: {
  column: KanbanColumnModel;
  disabled: boolean;
  onSelectNode: (nodeId: string) => void;
  registerCardElement: (
    nodeId: string,
    element: HTMLButtonElement | null,
  ) => void;
  selectedId: string | null;
}) {
  const { isDropTarget, ref } = useDroppable<ColumnDropData>({
    data: { kind: "kanban-column", status: column.status },
    disabled,
    id: `kanban-column:${column.status}`,
  });

  return (
    <section
      aria-label={`${column.status} ${column.cards.length}件`}
      className={cn(
        "flex min-h-[420px] min-w-0 flex-col rounded-xl border border-t-4 bg-card/65 shadow-sm transition-[border-color,background-color,box-shadow] duration-150",
        COLUMN_ACCENTS[column.status],
        isDropTarget && "border-primary/70 bg-accent/45 shadow-md",
      )}
      ref={ref}
    >
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/70 px-3">
        <Badge
          className={cn("px-2 py-0.5 text-[11px]", statusBadgeClass(column.status))}
          variant="outline"
        >
          {column.status}
        </Badge>
        <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
          {column.cards.length}
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-2 p-2.5">
        {column.cards.length === 0 ? (
          <div
            className={cn(
              "grid min-h-28 flex-1 place-items-center rounded-lg border border-dashed border-border/80 px-4 text-center text-xs text-muted-foreground transition-colors",
              isDropTarget && "border-primary/60 bg-background/70 text-foreground",
            )}
          >
            この状態のTaskはありません
          </div>
        ) : (
          column.cards.map((card) => (
            <DraggableKanbanCard
              card={card}
              disabled={disabled}
              isSelected={selectedId === card.node.id}
              key={card.node.id}
              registerElement={registerCardElement}
              onSelectNode={onSelectNode}
            />
          ))
        )}
      </div>
    </section>
  );
}

function DraggableKanbanCard({
  card,
  disabled,
  isSelected,
  onSelectNode,
  registerElement,
}: {
  card: KanbanCard;
  disabled: boolean;
  isSelected: boolean;
  onSelectNode: (nodeId: string) => void;
  registerElement: (
    nodeId: string,
    element: HTMLButtonElement | null,
  ) => void;
}) {
  const { isDragging, ref } = useDraggable<CardDragData>({
    data: {
      kind: "kanban-card",
      nodeId: card.node.id,
      status: card.node.status,
    },
    disabled,
    id: `kanban-card:${card.node.id}`,
  });

  return (
    <button
      aria-label={`${getNodeDisplayTitle(card.node)}を選択`}
      aria-pressed={isSelected}
      className={cn(
        "kanban-card-enter w-full touch-none rounded-lg border bg-background p-0 text-left shadow-xs outline-none transition-[border-color,box-shadow,opacity,transform] duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring",
        isSelected && "border-primary/70 ring-2 ring-primary/15",
        isDragging && "opacity-25",
      )}
      data-node-focus-id={card.node.id}
      disabled={disabled}
      ref={(element) => {
        ref(element);
        registerElement(card.node.id, element);
      }}
      type="button"
      onClick={() => onSelectNode(card.node.id)}
      onFocus={() => onSelectNode(card.node.id)}
    >
      <KanbanCardSurface card={card} />
    </button>
  );
}

function KanbanCardSurface({
  card,
  overlay = false,
}: {
  card: KanbanCard;
  overlay?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg bg-background px-3 py-2.5",
        overlay && "rotate-1 border border-primary/40 shadow-xl",
      )}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/65" />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-medium leading-5 text-foreground">
            {getNodeDisplayTitle(card.node)}
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <Badge
              className={cn(
                "px-1.5 py-0 text-[10px]",
                priorityBadgeClass(card.node.priority),
              )}
              variant="outline"
            >
              {priorityLabel(card.node.priority)}
            </Badge>
          </div>
          {card.parentPath.length > 0 ? (
            <p className="mt-1 truncate text-[11px] text-muted-foreground">
              {card.parentPath.join(" / ")}
            </p>
          ) : null}
        </div>
      </div>
      {card.node.dueDate ? (
        <div className="mt-2 flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          <span>{card.node.dueDate}</span>
        </div>
      ) : null}
    </div>
  );
}
