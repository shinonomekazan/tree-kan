import { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { ZoomIn, ZoomOut, ChevronDown, ChevronUp, Kanban } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TreeNode, TaskStatus } from "./types";
import { nodeStorage } from "./storage";
import KanbanBoard from "./KanbanBoard";

interface TreeGraphProps {
  data: TreeNode;
  onNodeClick: (node: TreeNode) => void;
  onReorderTasks: (
    updates: { id: string; status: TaskStatus; order: number }[],
  ) => void;
  isKanban: boolean;
  onToggleKanban: () => void;
  focusedTaskId: string | null;
}

type CustomNode = d3.HierarchyPointNode<TreeNode> & {
  branchColor?: string;
  cx: number;
  cy: number;
  angle: number;
};

export default function TreeGraph({
  data,
  onNodeClick,
  onReorderTasks,
  isKanban,
  onToggleKanban,
  focusedTaskId,
}: TreeGraphProps) {
  const { t, i18n } = useTranslation();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [showImportBtn, setShowImportBtn] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("import")) {
      setShowImportBtn(true);
    }
  }, []);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        nodeStorage.importAllData(JSON.parse(content));
        window.location.href = window.location.pathname;
      } catch { }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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

  useEffect(() => {
    if (!wrapperRef.current || !svgRef.current) return;

    let resizeTimer: ReturnType<typeof setTimeout>;

    const drawGraph = (w: number, h: number) => {
      if (!svgRef.current || w <= 0 || h <= 0) return;

      const radius = Math.min(w, h) / 2.2;
      const svg = d3.select(svgRef.current);

      svg.selectAll("*").remove();
      svg.attr("viewBox", `${-w / 2} ${-h / 2} ${w} ${h}`);

      const zoomGroup = svg.append("g");

      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on("start", () => {
          d3.select(svgRef.current).style("cursor", "grabbing");
        })
        .on("zoom", (e) => {
          zoomGroup.attr("transform", e.transform.toString());
        })
        .on("end", (e) => {
          d3.select(svgRef.current).style("cursor", null);
          nodeStorage.saveTransform(
            e.transform.x,
            e.transform.y,
            e.transform.k,
          );
        });

      zoomRef.current = zoom;
      svg.call(zoom);

      const savedTransform = nodeStorage.getTransform();
      if (savedTransform) {
        svg.call(
          zoom.transform,
          d3.zoomIdentity
            .translate(savedTransform.x, savedTransform.y)
            .scale(savedTransform.k),
        );
      } else {
        svg.call(zoom.transform, d3.zoomIdentity);
      }

      const tree = d3
        .tree<TreeNode>()
        .size([2 * Math.PI, radius])
        .separation((a, b) => (a.parent === b.parent ? 1 : 1.5) / a.depth);

      const root = d3.hierarchy(data, (d) =>
        d.children?.filter((c) => c.status !== "archive"),
      );

      const treeRoot = tree(root);

      treeRoot.each((d) => {
        const node = d as CustomNode;

        const savedPosition = nodeStorage.getPosition(node.data.id);
        if (savedPosition) {
          node.cx = savedPosition.cx;
          node.cy = savedPosition.cy;
        } else {
          const angleRad = node.x - Math.PI / 2;
          node.cx = node.y * Math.cos(angleRad);
          node.cy = node.y * Math.sin(angleRad);
        }

        if (node.parent) {
          const parentNode = node.parent as CustomNode;
          node.angle = node.cx > parentNode.cx ? 0 : Math.PI;
        } else {
          node.angle = node.x;
        }

        if (node.depth === 1) {
          node.branchColor = node.data.color;
        } else if (node.depth > 1) {
          node.branchColor = (node.parent as CustomNode).branchColor;
        } else {
          node.branchColor = "#cbd5e1";
        }
      });

      const nodesData = treeRoot.descendants() as CustomNode[];

      const radialLinkGen = d3
        .linkRadial<d3.HierarchyPointLink<TreeNode>, CustomNode>()
        .source((d) => d.source as CustomNode)
        .target((d) => d.target as CustomNode)
        .angle((n) => Math.atan2(n.cy, n.cx) + Math.PI / 2)
        .radius((n) => Math.hypot(n.cx, n.cy));

      const linkPath = zoomGroup
        .append("g")
        .selectAll("path")
        .data(treeRoot.links())
        .join("path")
        .attr("fill", "none")
        .attr("stroke", "#3a3838")
        .attr("stroke-width", (d) => Math.max(1.5, 4 - d.target.depth))
        .attr("opacity", 0.6)
        .attr("d", (d) => {
          const source = d.source as CustomNode;
          const target = d.target as CustomNode;
          if (target.data.type !== "task") {
            return `M${source.cx},${source.cy} L${target.cx},${target.cy}`;
          }
          return radialLinkGen(d);
        });

      const nodeGroup = zoomGroup
        .append("g")
        .selectAll<SVGGElement, CustomNode>("g")
        .data(nodesData)
        .join("g")
        .attr("transform", (d) => `translate(${d.cx},${d.cy})`)
        .style("cursor", "pointer")
        .on("click", (event, d) => {
          if (event.defaultPrevented) return;
          event.stopPropagation();
          onNodeClick(d.data);
        });

      const drag = d3
        .drag<SVGGElement, CustomNode>()
        .filter((e: MouseEvent) => e.button === 0)
        .on("drag", function (event, d) {
          if (d.data.type === "root") {
            return;
          }
          const descendants = d.descendants() as CustomNode[];
          const descendantIds = new Set(descendants.map((n) => n.data.id));

          descendants.forEach((n) => {
            n.cx += event.dx;
            n.cy += event.dy;
          });

          nodeGroup
            .filter((n) => descendantIds.has(n.data.id))
            .attr("transform", (n) => `translate(${n.cx},${n.cy})`);

          linkPath
            .filter(
              (l) =>
                descendantIds.has(l.source.data.id) ||
                descendantIds.has(l.target.data.id),
            )
            .attr("d", (l) => {
              const source = l.source as CustomNode;
              const target = l.target as CustomNode;
              return target.data.type !== "task"
                ? `M${source.cx},${source.cy} L${target.cx},${target.cy}`
                : radialLinkGen(l);
            });
        })
        .on("end", function (event, d) {
          const descendants = d.descendants() as CustomNode[];
          const descendantIds = new Set(descendants.map((n) => n.data.id));

          descendants.forEach((n) => {
            if (n.parent) {
              const parentNode = n.parent as CustomNode;
              n.angle = n.cx > parentNode.cx ? 0 : Math.PI;
            }
          });

          nodeGroup
            .filter((n) => descendantIds.has(n.data.id))
            .select("text")
            .attr("x", (n) => {
              if (n.data.type === "root") return 0;
              if (n.parent && n.children && n.children.length > 0) return 16;
              if (n.parent && (!n.children || n.children.length === 0)) {
                return n.angle < Math.PI ? 16 : -16;
              }
              return 16;
            })
            .attr("text-anchor", (n) => {
              if (n.data.type === "root") return "middle";
              if (n.parent && n.children && n.children.length > 0)
                return "start";
              if (n.parent && (!n.children || n.children.length === 0)) {
                return n.angle < Math.PI ? "start" : "end";
              }
              return "start";
            });
        });

      nodeGroup.call(drag as (selection: typeof nodeGroup) => void);

      const getColor = (d: CustomNode) => {
        if (d.data.type !== "task") return "#22c55e";
        switch (d.data.status) {
          case "done":
            return "#3b82f6";
          case "review":
            return "#a855f7";
          case "in-progress":
            return "#eab308";
          default:
            return "#94a3b8";
        }
      };

      nodeGroup
        .filter((d) => d.data.type === "module")
        .append("rect")
        .attr("width", 16)
        .attr("height", 16)
        .attr("x", -8)
        .attr("y", -8)
        .attr("fill", getColor)
        .attr("stroke", "#000000")
        .attr("stroke-width", 2)
        .attr("class", "transition-all duration-300 hover:opacity-80");

      nodeGroup
        .filter((d) => d.data.type === "project")
        .append("polygon")
        .attr("points", "0,-14 12,-7 12,7 0,14 -12,7 -12,-7")
        .attr("fill", getColor)
        .attr("stroke", "#000000")
        .attr("stroke-width", 2)
        .attr("class", "transition-all duration-300 hover:opacity-80");

      nodeGroup
        .filter((d) => d.data.type === "task")
        .append("circle")
        .attr("r", 6)
        .attr("fill", getColor)
        .attr("stroke", "#000000")
        .attr("stroke-width", 2)
        .attr("class", "transition-all duration-300 hover:opacity-80");

      nodeGroup
        .filter((d) => d.data.type === "root")
        .append("image")
        .attr(
          "href",
          "https://avatars.slack-edge.com/2020-02-13/951875291607_eee49e20d24ec93a2fae_102.png",
        )
        .attr("width", 44)
        .attr("height", 44)
        .attr("x", -22)
        .attr("y", -22)
        .attr("class", "transition-all duration-300 hover:opacity-80");

      nodeGroup
        .append("text")
        .attr("dy", (d) => (d.data.type === "root" ? "32px" : "0.31em"))
        .attr("x", (d) => {
          if (d.data.type === "root") return 0;
          if (d.parent && d.children && d.children.length > 0) return 16;
          if (d.parent && (!d.children || d.children.length === 0)) {
            return d.angle < Math.PI ? 16 : -16;
          }
          return 16;
        })
        .attr("text-anchor", (d) => {
          if (d.data.type === "root") return "middle";
          if (d.parent && d.children && d.children.length > 0) return "start";
          if (d.parent && (!d.children || d.children.length === 0)) {
            return d.angle < Math.PI ? "start" : "end";
          }
          return "start";
        })
        .text((d) => d.data.name)
        .attr("font-size", (d) => (d.data.type === "root" ? "16px" : "14px"))
        .attr("font-weight", (d) => (d.data.type === "root" ? "bold" : "500"))
        .attr("fill", "#1e293b")
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 4)
        .attr("stroke-linejoin", "round")
        .attr("paint-order", "stroke fill");
    };

    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (wrapperRef.current) {
          drawGraph(
            wrapperRef.current.clientWidth,
            wrapperRef.current.clientHeight,
          );
        }
      }, 50);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(wrapperRef.current);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(resizeTimer);
      if (svgRef.current) {
        d3.select(svgRef.current).on(".zoom", null);
      }
    };
  }, [data, onNodeClick]);

  const handleZoom = (factor: number) => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomRef.current.scaleBy, factor);
  };

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

      <div className="absolute top-4 right-4 z-20 flex gap-2">
        {showImportBtn && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-md text-xs font-bold shadow-sm transition-colors border bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            >
              Import
            </button>
            <input
              type="file"
              accept=".json,application/json"
              ref={fileInputRef}
              className="hidden"
              onChange={handleImportFile}
            />
          </>
        )}
        <button
          onClick={() => i18n.changeLanguage("en")}
          className={`px-3 py-1.5 rounded-md text-xs font-bold shadow-sm transition-colors border ${i18n.language === "en" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}`}
        >
          EN
        </button>
        <button
          onClick={() => i18n.changeLanguage("ja")}
          className={`px-3 py-1.5 rounded-md text-xs font-bold shadow-sm transition-colors border ${i18n.language === "ja" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}`}
        >
          JA
        </button>
      </div>

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
                  <span className="font-bold text-slate-900">
                    {stats.done}%
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500 shadow-sm border border-white" />
                    {t("review")}
                  </span>
                  <span className="font-bold text-slate-900">
                    {stats.review}%
                  </span>
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
                  <span className="font-bold text-slate-900">
                    {stats.todo}%
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <button
          onClick={onToggleKanban}
          className="flex items-center justify-center gap-2 w-56 p-2 bg-white/95 rounded-lg shadow-md border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs transition-colors"
        >
          <Kanban size={14} />
          {isKanban ? t("showGraph") : t("kanbanBoard")}
        </button>
      </div>
    </div>
  );
}
