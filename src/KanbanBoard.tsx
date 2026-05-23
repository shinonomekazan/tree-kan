import { useMemo, useEffect, useRef, useState } from "react";
import type { TreeNode, TaskStatus } from "./types";

interface KanbanBoardProps {
  data: TreeNode;
  onNodeClick: (node: TreeNode) => void;
  onReorderTasks: (
    updates: { id: string; status: TaskStatus; order: number }[],
  ) => void;
  focusedTaskId: string | null;
}

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: "todo", label: "Chờ xử lý", color: "bg-slate-400" },
  { id: "in-progress", label: "Đang thực hiện", color: "bg-yellow-500" },
  { id: "review", label: "Review", color: "bg-purple-500" },
  { id: "done", label: "Hoàn thành", color: "bg-blue-500" },
  { id: "archive", label: "Lưu trữ", color: "bg-slate-600" },
];

export default function KanbanBoard({
  data,
  onNodeClick,
  onReorderTasks,
  focusedTaskId,
}: KanbanBoardProps) {
  const taskRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(
    null,
  );

  const tasks = useMemo(() => {
    const result: TreeNode[] = [];
    const traverse = (node: TreeNode) => {
      if (node.type === "task") result.push(node);
      if (node.children) node.children.forEach(traverse);
    };
    traverse(data);
    return result.sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [data]);

  useEffect(() => {
    if (focusedTaskId) {
      setHighlightedTaskId(focusedTaskId);
      const element = taskRefs.current.get(focusedTaskId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      const timer = setTimeout(() => {
        setHighlightedTaskId(null);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [focusedTaskId]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (
    e: React.DragEvent,
    status: TaskStatus,
    targetId?: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const draggedId = e.dataTransfer.getData("text/plain");
    if (!draggedId || draggedId === targetId) return;

    let colTasks = tasks.filter((t) => (t.status || "todo") === status);
    const draggedTask = tasks.find((t) => t.id === draggedId);
    if (!draggedTask) return;

    colTasks = colTasks.filter((t) => t.id !== draggedId);

    let insertIndex = colTasks.length;
    if (targetId) {
      const tIndex = colTasks.findIndex((t) => t.id === targetId);
      if (tIndex !== -1) insertIndex = tIndex;
    }

    colTasks.splice(insertIndex, 0, draggedTask);
    onReorderTasks(colTasks.map((t, i) => ({ id: t.id, status, order: i })));
  };

  return (
    <div className="flex w-full h-full p-6 pt-32 gap-6 overflow-x-auto bg-slate-50">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => (t.status || "todo") === col.id);

        return (
          <div
            key={col.id}
            className="flex-1 min-w-[280px] bg-slate-100/50 rounded-xl border border-slate-200 flex flex-col overflow-hidden"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className="p-4 border-b border-slate-200 bg-slate-100/80 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-slate-700">{col.label}</h3>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold text-white ${col.color}`}
              >
                {colTasks.length}
              </span>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-3">
              {colTasks.map((task) => (
                <div
                  key={task.id}
                  ref={(el) => {
                    if (el) taskRefs.current.set(task.id, el);
                    else taskRefs.current.delete(task.id);
                  }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.id, task.id)}
                  onClick={() => onNodeClick(task)}
                  className={`bg-white p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-all duration-500 ${
                    highlightedTaskId === task.id
                      ? "border-green-500 ring-4 ring-green-300 shadow-lg shadow-green-200 scale-[1.02]"
                      : "border-slate-200 shadow-sm hover:border-blue-400"
                  }`}
                >
                  <h4 className="font-semibold text-slate-800 text-sm mb-1">
                    {task.name}
                  </h4>
                  {task.assignee && (
                    <p className="text-xs text-slate-500 font-medium">
                      @{task.assignee}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
