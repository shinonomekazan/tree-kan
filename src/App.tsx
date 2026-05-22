import { useState, useCallback } from "react";
import TreeGraph from "./TreeGraph";
import DetailPanel from "./DetailPanel";
import { projectData } from "./mockData";
import type { TreeNode, NewNodePayload } from "./types";

export default function App() {
  const [data, setData] = useState<TreeNode>(projectData);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);

  const handleAddChild = useCallback(
    (parentId: string, payload: NewNodePayload) => {
      setData((prevData) => {
        const newData = JSON.parse(JSON.stringify(prevData)) as TreeNode;
        let updatedNode: TreeNode | null = null;

        const appendChild = (node: TreeNode): boolean => {
          if (node.id === parentId) {
            if (!node.children) node.children = [];
            node.children.push({
              id: crypto.randomUUID(),
              name: payload.name,
              type: payload.type,
              status: payload.status,
              description: payload.description,
            });
            updatedNode = node;
            return true;
          }
          if (node.children) {
            for (const child of node.children) {
              if (appendChild(child)) return true;
            }
          }
          return false;
        };

        appendChild(newData);

        if (updatedNode && selectedNode?.id === parentId) {
          setSelectedNode(updatedNode);
        }

        return newData;
      });
    },
    [selectedNode],
  );

  return (
    <div className="flex w-screen h-screen font-sans overflow-hidden bg-slate-50">
      <div className="flex-1 relative w-full h-full">
        <TreeGraph data={data} onNodeClick={setSelectedNode} />
      </div>
      <DetailPanel
        selectedNode={selectedNode}
        onClose={() => setSelectedNode(null)}
        onAddChild={handleAddChild}
      />
    </div>
  );
}
