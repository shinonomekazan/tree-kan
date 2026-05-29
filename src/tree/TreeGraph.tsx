import { useRef } from "react";
import { ZoomIn, ZoomOut, Kanban } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TreeNode, TaskStatus } from "../types";
import KanbanBoard from "../KanbanBoard";
import TreeGraphHeader from "./TreeGraphHeader";
import TreeGraphStats from "./TreeGraphStats";
import { useD3Tree } from "./useD3Tree";

interface TreeGraphProps {
  data: TreeNode;
  onNodeClick: (node: TreeNode) => void;
  onReorderTasks: (
    updates: { id: string; status: TaskStatus; order: number }[],
  ) => void;
  isKanban: boolean;
  onToggleKanban: () => void;
  focusedTaskId: string | null;
  onSave: () => void;
}

export default function TreeGraph({
  data,
  onNodeClick,
  onReorderTasks,
  isKanban,
  onToggleKanban,
  focusedTaskId,
  onSave,
}: TreeGraphProps) {
  const { t } = useTranslation();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { handleZoom } = useD3Tree(wrapperRef, svgRef, data, onNodeClick);

  return (
    <div
      ref={wrapperRef}
      className="absolute inset-0 w-full h-full bg-slate-50 z-0"
    >
      <svg
        ref={svgRef}
        className={`block w-full h-full outline-none transition-opacity ${isKanban ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        onContextMenu={(e) => e.preventDefault()}
      />

      <TreeGraphHeader data={data} onSave={onSave} />

      {isKanban && (
        <div className="absolute inset-0 z-0 bg-transparent">
          <KanbanBoard
            data={data}
            onNodeClick={onNodeClick}
            onReorderTasks={onReorderTasks}
            focusedTaskId={focusedTaskId}
          />
        </div>
      )}

      {!isKanban && (
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
          <button
            onClick={() => handleZoom(1.2)}
            className="p-2 bg-white rounded-lg shadow-md border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={() => handleZoom(0.8)}
            className="p-2 bg-white rounded-lg shadow-md border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
          >
            <ZoomOut size={18} />
          </button>
        </div>
      )}

      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <TreeGraphStats data={data} />

        <button
          onClick={onToggleKanban}
          className={`flex items-center justify-center gap-2 w-56 p-2 rounded-lg shadow-md border transition-colors font-bold text-xs ${
            isKanban
              ? "bg-red-500 hover:bg-red-600 text-white border-red-600"
              : "bg-white/95 hover:bg-slate-50 text-slate-800 border-slate-200"
          }`}
        >
          <Kanban size={14} />
          {isKanban ? t("showGraph") : t("kanbanBoard")}
        </button>
      </div>
    </div>
  );
}
