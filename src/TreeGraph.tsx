import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ZoomIn, ZoomOut, Focus, ChevronDown, ChevronUp } from 'lucide-react';
import type { TreeNode } from './types';

interface TreeGraphProps {
  data: TreeNode;
  onNodeClick: (node: TreeNode) => void;
}

type CustomNode = d3.HierarchyPointNode<TreeNode> & { branchColor?: string };

export default function TreeGraph({ data, onNodeClick }: TreeGraphProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [isLegendOpen, setIsLegendOpen] = useState(true);

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

      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on("zoom", (e) => {
          zoomGroup.attr("transform", e.transform.toString());
        });

      zoomRef.current = zoom;
      svg.call(zoom);
      svg.call(zoom.transform, d3.zoomIdentity);

      const tree = d3.tree<TreeNode>()
        .size([2 * Math.PI, radius])
        .separation((a, b) => (a.parent === b.parent ? 1 : 1.5) / a.depth);

      const root = d3.hierarchy(data);
      const treeRoot = tree(root);

      treeRoot.each((d) => {
        const node = d as CustomNode;
        if (node.depth === 1) {
          node.branchColor = node.data.color;
        } else if (node.depth > 1) {
          node.branchColor = (node.parent as CustomNode).branchColor;
        } else {
          node.branchColor = "#cbd5e1";
        }
      });

      zoomGroup.append("g")
        .selectAll("path")
        .data(treeRoot.links())
        .join("path")
        .attr("fill", "none")
        .attr("stroke", (d) => (d.target as CustomNode).branchColor || "#cbd5e1")
        .attr("stroke-width", d => Math.max(1.5, 4 - d.target.depth))
        .attr("opacity", 0.6)
        .attr("d", d3.linkRadial<d3.HierarchyPointLink<TreeNode>, d3.HierarchyPointNode<TreeNode>>()
          .angle(d => d.x)
          .radius(d => d.y)
        );

      const nodeGroup = zoomGroup.append("g")
        .selectAll("g")
        .data(treeRoot.descendants())
        .join("g")
        .attr("transform", d => `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y},0)`)
        .style("cursor", "pointer")
        .on("click", (event, d) => {
          event.stopPropagation();
          onNodeClick(d.data);
        });

      const getColor = (d: CustomNode) => {
        if (d.data.type === 'root') return '#1e293b';
        if (d.data.type === 'project' || d.data.type === 'module') return d.branchColor || '#cbd5e1';
        switch (d.data.status) {
          case 'done': return '#3b82f6';
          case 'in-progress': return '#eab308';
          case 'blocked': return '#ef4444';
          default: return '#94a3b8';
        }
      };

      nodeGroup.append("circle")
        .attr("r", d => d.data.type === 'root' ? 22 : d.data.type === 'project' ? 14 : d.data.type === 'module' ? 10 : 6)
        .attr("fill", d => getColor(d as CustomNode))
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2)
        .attr("class", "transition-all duration-300 hover:opacity-80");

      nodeGroup.append("text")
        .attr("dy", "0.31em")
        .attr("x", d => (d.x < Math.PI === !d.children ? 12 : -12))
        .attr("text-anchor", d => (d.x < Math.PI === !d.children ? "start" : "end"))
        .attr("transform", d => (d.x >= Math.PI ? "rotate(180)" : null))
        .text(d => d.data.name)
        .attr("font-size", d => d.data.type === 'root' ? "16px" : d.data.type === 'project' ? "14px" : "12px")
        .attr("font-weight", d => d.data.type === 'root' || d.data.type === 'project' ? "bold" : "500")
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
          drawGraph(wrapperRef.current.clientWidth, wrapperRef.current.clientHeight);
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
    d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, factor);
  };

  const handleCenter = () => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current).transition().duration(500).call(zoomRef.current.transform, d3.zoomIdentity);
  };

  return (
    <div ref={wrapperRef} className="absolute inset-0 w-full h-full bg-slate-50 z-0">
      <svg ref={svgRef} className="block w-full h-full outline-none" />
      
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
        <button onClick={() => handleZoom(1.2)} className="p-2.5 bg-white rounded-lg shadow-md border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors">
          <ZoomIn size={20} />
        </button>
        <button onClick={handleCenter} className="p-2.5 bg-white rounded-lg shadow-md border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors">
          <Focus size={20} />
        </button>
        <button onClick={() => handleZoom(0.8)} className="p-2.5 bg-white rounded-lg shadow-md border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors">
          <ZoomOut size={20} />
        </button>
      </div>

      <div className="absolute top-6 left-6 z-10">
        <div className="bg-white/95 rounded-xl shadow-md border border-slate-200 w-56 overflow-hidden transition-all">
          <div 
            className="p-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={() => setIsLegendOpen(!isLegendOpen)}
          >
            <h1 className="font-bold text-sm text-slate-800 flex items-center gap-2">🌲 Cây Sinh Thái</h1>
            {isLegendOpen ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
          </div>
          
          <div className={`transition-all duration-300 ease-in-out ${isLegendOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="p-4">
              <p className="text-[11px] text-slate-500 mb-3 border-b border-slate-100 pb-3">Cuộn: Zoom • Kéo: Pan</p>
              <ul className="space-y-2.5 text-xs font-medium text-slate-700">
                <li className="flex items-center gap-2.5"><span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm border border-white"></span> Hoàn thành</li>
                <li className="flex items-center gap-2.5"><span className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm border border-white"></span> Đang thực hiện</li>
                <li className="flex items-center gap-2.5"><span className="w-3 h-3 rounded-full bg-red-500 shadow-sm border border-white"></span> Đang tắc nghẽn</li>
                <li className="flex items-center gap-2.5"><span className="w-3 h-3 rounded-full bg-slate-400 shadow-sm border border-white"></span> Chờ xử lý</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}