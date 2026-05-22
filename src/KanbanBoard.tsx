import { useMemo } from "react";
import type { TreeNode, TaskStatus } from "./types";

interface KanbanBoardProps {
  data: TreeNode;
  onNodeClick: (node: TreeNode) => void;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
}

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: "todo", label: "Chờ xử lý", color: "bg-slate-400" },
  { id: "in-progress", label: "Đang thực hiện", color: "bg-yellow-500" },
  { id: "done", label: "Hoàn thành", color: "bg-blue-500" },
  { id: "blocked", label: "Đang tắc nghẽn", color: "bg-red-500" },
];

export default function KanbanBoard({
  data,
  onNodeClick,
  onUpdateStatus,
}: KanbanBoardProps) {
  const tasks = useMemo(() => {
    const result: TreeNode[] = [];
    const traverse = (node: TreeNode) => {
      if (node.type === "task") result.push(node);
      if (node.children) node.children.forEach(traverse);
    };
    traverse(data);
    return result;
  }, [data]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) onUpdateStatus(id, status);
  };

  return (
    <div className="flex w-full h-full p-6 pt-32 gap-6 overflow-x-auto bg-slate-50">
      {COLUMNS.map((col) => (
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
              {tasks.filter((t) => (t.status || "todo") === col.id).length}
            </span>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-3">
            {tasks
              .filter((t) => (t.status || "todo") === col.id)
              .map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onClick={() => onNodeClick(task)}
                  className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:border-blue-400 transition-colors"
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
      ))}
    </div>
  );
}
