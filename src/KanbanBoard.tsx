import { useMemo, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TreeNode, TaskStatus } from "./types";

interface KanbanBoardProps {
  data: TreeNode;
  onNodeClick: (node: TreeNode) => void;
  onReorderTasks: (
    updates: { id: string; status: TaskStatus; order: number }[],
  ) => void;
  focusedTaskId: string | null;
}

export default function KanbanBoard({
  data,
  onNodeClick,
  onReorderTasks,
  focusedTaskId,
}: KanbanBoardProps) {
  const { t } = useTranslation();
  const taskRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(
    null,
  );
  const [dragState, setDragState] = useState<{ id: string } | null>(null);
  const [dropState, setDropState] = useState<{
    colId: TaskStatus;
    taskId?: string;
    pos?: "top" | "bottom";
  } | null>(null);

  const columns = useMemo(
    () => [
      { id: "todo" as TaskStatus, label: t("todo"), color: "bg-slate-400" },
      {
        id: "in-progress" as TaskStatus,
        label: t("inProgress"),
        color: "bg-yellow-500",
      },
      {
        id: "review" as TaskStatus,
        label: t("review"),
        color: "bg-purple-500",
      },
      { id: "done" as TaskStatus, label: t("done"), color: "bg-blue-500" },
      {
        id: "archive" as TaskStatus,
        label: t("archive"),
        color: "bg-slate-600",
      },
    ],
    [t],
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
    setDragState({ id });
  };

  const handleDragEnd = () => {
    setDragState(null);
    setDropState(null);
  };

  const handleDragOver = (
    e: React.DragEvent,
    colId: TaskStatus,
    taskId?: string,
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (dragState?.id === taskId) {
      setDropState(null);
      return;
    }

    let pos: "top" | "bottom" | undefined;
    if (taskId) {
      e.stopPropagation();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      pos = e.clientY - rect.top < rect.height / 2 ? "top" : "bottom";
    }

    setDropState((prev) => {
      if (prev?.colId === colId && prev?.taskId === taskId && prev?.pos === pos)
        return prev;
      return { colId, taskId, pos };
    });
  };

  const handleDrop = (e: React.DragEvent, colId: TaskStatus) => {
    e.preventDefault();
    e.stopPropagation();

    const draggedId = e.dataTransfer.getData("text/plain");
    const currentDropState = dropState;

    setDragState(null);
    setDropState(null);

    if (!draggedId) return;

    let colTasks = tasks.filter((t) => (t.status || "todo") === colId);
    const draggedTask = tasks.find((t) => t.id === draggedId);
    if (!draggedTask) return;

    colTasks = colTasks.filter((t) => t.id !== draggedId);

    let insertIndex = colTasks.length;
    if (currentDropState?.taskId) {
      const tIndex = colTasks.findIndex(
        (t) => t.id === currentDropState.taskId,
      );
      if (tIndex !== -1) {
        insertIndex = currentDropState.pos === "top" ? tIndex : tIndex + 1;
      }
    }

    colTasks.splice(insertIndex, 0, draggedTask);
    onReorderTasks(
      colTasks.map((t, i) => ({ id: t.id, status: colId, order: i })),
    );
  };

  return (
    <div className="flex w-full h-full p-6 pt-32 gap-6 overflow-x-auto bg-slate-50">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => (t.status || "todo") === col.id);

        return (
          <div
            key={col.id}
            className="flex-1 min-w-[280px] bg-slate-100/50 rounded-xl border border-slate-200 flex flex-col overflow-hidden"
            onDragOver={(e) => handleDragOver(e, col.id)}
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

            <div className="flex-1 p-3 overflow-y-auto space-y-3 relative">
              {colTasks.map((task) => {
                const isDragged = dragState?.id === task.id;
                const isDropTarget = dropState?.taskId === task.id;
                const showTop = isDropTarget && dropState?.pos === "top";
                const showBottom = isDropTarget && dropState?.pos === "bottom";

                return (
                  <div
                    key={task.id}
                    ref={(el) => {
                      if (el) taskRefs.current.set(task.id, el);
                      else taskRefs.current.delete(task.id);
                    }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragOver={(e) => handleDragOver(e, col.id, task.id)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, col.id)}
                    onClick={() => onNodeClick(task)}
                    className={`relative bg-white p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-all duration-300 ${
                      highlightedTaskId === task.id
                        ? "border-green-500 ring-4 ring-green-300 shadow-lg shadow-green-200 scale-[1.02]"
                        : isDragged
                          ? "opacity-80 border-dashed shadow-none"
                          : "border-slate-200 shadow-sm hover:border-blue-400"
                    }`}
                  >
                    {showTop && (
                      <div className="absolute -top-2 left-0 right-0 h-1 bg-blue-500 rounded-full pointer-events-none" />
                    )}
                    <h4 className="font-semibold text-slate-800 text-sm mb-1">
                      {task.name}
                    </h4>
                    {task.assignee && (
                      <p className="text-xs text-slate-500 font-medium">
                        @{task.assignee}
                      </p>
                    )}
                    {showBottom && (
                      <div className="absolute -bottom-2 left-0 right-0 h-1 bg-blue-500 rounded-full pointer-events-none" />
                    )}
                  </div>
                );
              })}
              {colTasks.length === 0 &&
                dropState?.colId === col.id &&
                !dropState.taskId && (
                  <div className="h-1 bg-blue-500 rounded-full transition-all pointer-events-none" />
                )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
