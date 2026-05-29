import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TreeNode } from "../types";

export default function TreeGraphStats({ data }: { data: TreeNode }) {
  const { t } = useTranslation();
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  const stats = useMemo(() => {
    let total = 0,
      done = 0,
      review = 0,
      inProgress = 0,
      todo = 0;
    const traverse = (node: TreeNode) => {
      if (node.type === "task" && node.status !== "archive") {
        total++;
        if (node.status === "done") done++;
        else if (node.status === "review") review++;
        else if (node.status === "in-progress") inProgress++;
        else todo++;
      }
      if (node.children) node.children.forEach(traverse);
    };
    traverse(data);
    const getPercent = (count: number) =>
      total > 0 ? Math.round((count / total) * 100) : 0;
    return {
      done: getPercent(done),
      review: getPercent(review),
      inProgress: getPercent(inProgress),
      todo: getPercent(todo),
    };
  }, [data]);

  const pieStyle = useMemo(() => {
    const p1 = stats.done,
      p2 = p1 + stats.review,
      p3 = p2 + stats.inProgress;
    return {
      background: `conic-gradient(#3b82f6 0% ${p1}%, #a855f7 ${p1}% ${p2}%, #eab308 ${p2}% ${p3}%, #94a3b8 ${p3}% 100%)`,
    };
  }, [stats]);

  return (
    <div className="bg-white/95 rounded-lg shadow-md border border-slate-200 w-56 overflow-hidden transition-all">
      <div
        className="p-2.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
        onClick={() => setIsLegendOpen(!isLegendOpen)}
      >
        <h1 className="font-bold text-xs text-slate-800 flex items-center gap-2">
          {t("statistics")}
        </h1>
        {isLegendOpen ? (
          <ChevronUp size={14} className="text-slate-500" />
        ) : (
          <ChevronDown size={14} className="text-slate-500" />
        )}
      </div>

      <div
        className={`transition-all duration-300 ease-in-out ${isLegendOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="p-3 flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full shadow-sm border border-slate-200 shrink-0"
            style={pieStyle}
          />
          <ul className="flex-1 space-y-2 text-[10px] font-medium text-slate-700">
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm border border-white" />
                {t("done")}
              </span>
              <span className="font-bold text-slate-900">{stats.done}%</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500 shadow-sm border border-white" />
                {t("review")}
              </span>
              <span className="font-bold text-slate-900">{stats.review}%</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-sm border border-white" />
                {t("inProgress")}
              </span>
              <span className="font-bold text-slate-900">
                {stats.inProgress}%
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400 shadow-sm border border-white" />
                {t("todo")}
              </span>
              <span className="font-bold text-slate-900">{stats.todo}%</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
