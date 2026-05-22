import { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { ZoomIn, ZoomOut, ChevronDown, ChevronUp } from "lucide-react";
import type { TreeNode } from "./types";
import { nodeStorage } from "./storage";

interface TreeGraphProps {
  data: TreeNode;
  onNodeClick: (node: TreeNode) => void;
}

type CustomNode = d3.HierarchyPointNode<TreeNode> & {
  branchColor?: string;
  cx: number;
  cy: number;
  angle: number;
};

export default function TreeGraph({ data, onNodeClick }: TreeGraphProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  const stats = useMemo(() => {
    let total = 0;
    let done = 0;
    let inProgress = 0;
    let blocked = 0;
    let todo = 0;

    const traverse = (node: TreeNode) => {
      if (node.type === "task") {
        total++;
        if (node.status === "done") done++;
        else if (node.status === "in-progress") inProgress++;
        else if (node.status === "blocked") blocked++;
        else todo++;
      }
      if (node.children) {
        node.children.forEach(traverse);
      }
    };

    traverse(data);

    const getPercent = (count: number) =>
      total > 0 ? Math.round((count / total) * 100) : 0;

    return {
      done: getPercent(done),
      inProgress: getPercent(inProgress),
      blocked: getPercent(blocked),
      todo: getPercent(todo),
    };
  }, [data]);

  const pieStyle = useMemo(() => {
    const p1 = stats.done;
    const p2 = p1 + stats.inProgress;
    const p3 = p2 + stats.blocked;
    return {
      background: `conic-gradient(
        #3b82f6 0% ${p1}%,
        #eab308 ${p1}% ${p2}%,
        #ef4444 ${p2}% ${p3}%,
        #94a3b8 ${p3}% 100%
      )`,
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

      const root = d3.hierarchy(data);
      const treeRoot = tree(root);

      treeRoot.each((d) => {
        const node = d as CustomNode;
        node.angle = node.x;

        const savedPosition = nodeStorage.getPosition(node.data.id);
        if (savedPosition) {
          node.cx = savedPosition.cx;
          node.cy = savedPosition.cy;
        } else {
          const angleRad = node.x - Math.PI / 2;
          node.cx = node.y * Math.cos(angleRad);
          node.cy = node.y * Math.sin(angleRad);
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

      const linkGen = d3
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
        .attr(
          "stroke",
          (d) => (d.target as CustomNode).branchColor || "#cbd5e1",
        )
        .attr("stroke-width", (d) => Math.max(1.5, 4 - d.target.depth))
        .attr("opacity", 0.6)
        .attr("d", linkGen);

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
          d.cx += event.dx;
          d.cy += event.dy;

          d3.select(this).attr("transform", `translate(${d.cx},${d.cy})`);

          linkPath
            .filter(
              (l) =>
                l.source.data.id === d.data.id ||
                l.target.data.id === d.data.id,
            )
            .attr("d", linkGen);
        })
        .on("end", function (event, d) {
          nodeStorage.savePosition(d.data.id, d.cx, d.cy);
        });

      nodeGroup.call(drag as (selection: typeof nodeGroup) => void);

      const getColor = (d: CustomNode) => {
        if (d.data.type === "project" || d.data.type === "module")
          return d.branchColor || "#cbd5e1";
        switch (d.data.status) {
          case "done":
            return "#3b82f6";
          case "in-progress":
            return "#eab308";
          case "blocked":
            return "#ef4444";
          default:
            return "#94a3b8";
        }
      };

      nodeGroup
        .filter((d) => d.data.type !== "root")
        .append("circle")
        .attr("r", (d) =>
          d.data.type === "project" ? 14 : d.data.type === "module" ? 10 : 6,
        )
        .attr("fill", getColor)
        .attr("stroke", "#ffffff")
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
          return d.angle < Math.PI === !d.children ? 16 : -16;
        })
        .attr("text-anchor", (d) => {
          if (d.data.type === "root") return "middle";
          return d.angle < Math.PI === !d.children ? "start" : "end";
        })
        .text((d) => d.data.name)
        .attr("font-size", (d) =>
          d.data.type === "root"
            ? "16px"
            : d.data.type === "project"
              ? "14px"
              : "12px",
        )
        .attr("font-weight", (d) =>
          d.data.type === "root" || d.data.type === "project" ? "bold" : "500",
        )
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
        className="block w-full h-full outline-none"
        onContextMenu={(e) => e.preventDefault()}
      />

      <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
        <button
          onClick={() => handleZoom(1.2)}
          className="p-2.5 bg-white rounded-lg shadow-md border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
        >
          <ZoomIn size={20} />
        </button>
        <button
          onClick={() => handleZoom(0.8)}
          className="p-2.5 bg-white rounded-lg shadow-md border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
        >
          <ZoomOut size={20} />
        </button>
      </div>

      <div className="absolute top-6 left-6 z-10">
        <div className="bg-white/95 rounded-xl shadow-md border border-slate-200 w-80 overflow-hidden transition-all">
          <div
            className="p-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={() => setIsLegendOpen(!isLegendOpen)}
          >
            <h1 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              Thống kê
            </h1>
            {isLegendOpen ? (
              <ChevronUp size={16} className="text-slate-500" />
            ) : (
              <ChevronDown size={16} className="text-slate-500" />
            )}
          </div>

          <div
            className={`transition-all duration-300 ease-in-out ${isLegendOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"}`}
          >
            <div className="p-4 flex items-center gap-6">
              <div
                className="w-20 h-20 rounded-full shadow-sm border border-slate-200 shrink-0"
                style={pieStyle}
              />
              <ul className="flex-1 space-y-2.5 text-xs font-medium text-slate-700">
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm border border-white"></span>{" "}
                    Hoàn thành
                  </span>
                  <span className="font-bold text-slate-900">
                    {stats.done}%
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm border border-white"></span>{" "}
                    Đang làm
                  </span>
                  <span className="font-bold text-slate-900">
                    {stats.inProgress}%
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm border border-white"></span>{" "}
                    Tắc nghẽn
                  </span>
                  <span className="font-bold text-slate-900">
                    {stats.blocked}%
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-slate-400 shadow-sm border border-white"></span>{" "}
                    Chờ xử lý
                  </span>
                  <span className="font-bold text-slate-900">
                    {stats.todo}%
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
