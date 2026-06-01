import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { TreeNode } from "../types";
import { nodeStorage } from "../save-data/storage";

export const currentPositionsCache = new Map<
  string,
  { cx: number; cy: number }
>();

type CustomNode = d3.HierarchyPointNode<TreeNode> & {
  branchColor?: string;
  cx: number;
  cy: number;
  angle: number;
};

export function useD3Tree(
  wrapperRef: React.RefObject<HTMLDivElement | null>,
  svgRef: React.RefObject<SVGSVGElement | null>,
  data: TreeNode,
  onNodeClick: (node: TreeNode) => void,
  isLocked: boolean = false,
) {
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const isLockedRef = useRef(isLocked);

  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

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

        currentPositionsCache.set(node.data.id, { cx: node.cx, cy: node.cy });
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
        .attr("display", (d) =>
          (d.target as CustomNode).data.isHiddenLink ? "none" : "block",
        )
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
        .filter((e: MouseEvent) => !isLockedRef.current && e.button === 0)
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
        .on("end", function (d) {
          const descendants = d.descendants() as CustomNode[];
          const descendantIds = new Set(descendants.map((n) => n.data.id));

          descendants.forEach((n) => {
            if (n.parent) {
              const parentNode = n.parent as CustomNode;
              n.angle = n.cx > parentNode.cx ? 0 : Math.PI;
            }
            nodeStorage.savePosition(n.data.id, n.cx, n.cy);
            currentPositionsCache.set(n.data.id, { cx: n.cx, cy: n.cy });
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
  }, [data, onNodeClick, wrapperRef, svgRef]);

  const handleZoom = (factor: number) => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomRef.current.scaleBy, factor);
  };

  return { handleZoom };
}
