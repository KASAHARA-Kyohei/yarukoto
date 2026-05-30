import { useMemo, useState } from "react";
import {
  NODE_STATUSES,
  NODE_TYPES,
  type NodeStatus,
  type NodeType,
  type YarukotoNode,
} from "../types";
import { toDateKey } from "../utils/date";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SearchView({
  nodes,
  onSelectNode,
  selectedId,
}: {
  nodes: YarukotoNode[];
  onSelectNode: (nodeId: string) => void;
  selectedId: string | null;
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<NodeType | "">("");
  const [status, setStatus] = useState<NodeStatus | "">("");
  const [dueFilter, setDueFilter] = useState<
    "all" | "withDue" | "overdue" | "none"
  >("all");
  const today = toDateKey(new Date());

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return nodes
      .filter((node) => {
        const matchesQuery =
          normalizedQuery.length === 0 ||
          node.title.toLowerCase().includes(normalizedQuery) ||
          node.memo.toLowerCase().includes(normalizedQuery);
        const matchesType = type === "" || node.type === type;
        const matchesStatus = status === "" || node.status === status;
        const matchesDue =
          dueFilter === "all" ||
          (dueFilter === "withDue" && Boolean(node.dueDate)) ||
          (dueFilter === "none" && !node.dueDate) ||
          (dueFilter === "overdue" &&
            node.dueDate !== null &&
            node.dueDate < today &&
            node.status !== "Done");
        return matchesQuery && matchesType && matchesStatus && matchesDue;
      })
      .sort((a, b) => {
        if (a.status === "Done" && b.status !== "Done") {
          return 1;
        }
        if (a.status !== "Done" && b.status === "Done") {
          return -1;
        }
        return (a.dueDate ?? "9999-12-31").localeCompare(
          b.dueDate ?? "9999-12-31",
        );
      });
  }, [dueFilter, nodes, query, status, today, type]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid shrink-0 grid-cols-[1fr_150px_150px_160px] gap-2 border-b border-border bg-muted/70 p-2">
        <Input
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder="タイトル・メモを検索"
          value={query}
        />
        <Select value={type || "all"} onValueChange={(value) => setType(value === "all" ? "" : (value as NodeType))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
          <SelectItem value="all">全種別</SelectItem>
          {NODE_TYPES.map((nodeType) => (
            <SelectItem key={nodeType} value={nodeType}>
              {nodeType}
            </SelectItem>
          ))}
          </SelectContent>
        </Select>
        <Select value={status || "all"} onValueChange={(value) => setStatus(value === "all" ? "" : (value as NodeStatus))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
          <SelectItem value="all">全ステータス</SelectItem>
          {NODE_STATUSES.map((nodeStatus) => (
            <SelectItem key={nodeStatus} value={nodeStatus}>
              {nodeStatus}
            </SelectItem>
          ))}
          </SelectContent>
        </Select>
        <Select
          value={dueFilter}
          onValueChange={(value) =>
            setDueFilter(value as "all" | "withDue" | "overdue" | "none")
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">期限すべて</SelectItem>
            <SelectItem value="withDue">期限あり</SelectItem>
            <SelectItem value="overdue">期限切れ</SelectItem>
            <SelectItem value="none">期限なし</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1 overflow-auto p-2">
        <div className="mb-2 px-1 text-xs text-muted-foreground">{results.length} 件</div>
        {results.map((node) => (
          <button
            className={`mb-1 grid w-full grid-cols-[1fr_90px_80px_100px] items-center gap-2 rounded border px-3 py-2 text-left text-sm ${
              selectedId === node.id
                ? "border-primary bg-accent text-accent-foreground"
                : "border-transparent bg-card hover:border-border"
            }`}
            data-node-focus-id={node.id}
            key={node.id}
            onClick={() => onSelectNode(node.id)}
            type="button"
          >
            <span className="min-w-0 truncate font-medium">{node.title}</span>
            <span className="text-xs text-muted-foreground">{node.type}</span>
            <span className="text-xs text-muted-foreground">{node.status}</span>
            <span className="text-xs text-muted-foreground">{node.dueDate ?? "-"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
