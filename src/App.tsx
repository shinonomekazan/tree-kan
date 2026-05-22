import { useState, useCallback } from "react";
import TreeGraph from "./TreeGraph";
import DetailPanel from "./DetailPanel";
import { projectData } from "./mockData";
import { nodeStorage } from "./storage";
import type { TreeNode, NewNodePayload, LinkItem, TaskStatus } from "./types";

export default function App() {
  const [data, setData] = useState<TreeNode>(
    () => nodeStorage.getTreeData() || projectData,
  );
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(
    () => nodeStorage.getTreeData() || projectData,
  );

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
        nodeStorage.saveTreeData(newData);

        if (updatedNode && selectedNode?.id === parentId) {
          setSelectedNode(updatedNode);
        }

        return newData;
      });
    },
    [selectedNode],
  );

  const handleUpdateNodeLinks = useCallback(
    (nodeId: string, slackLinks?: LinkItem[], githubLinks?: LinkItem[]) => {
      setData((prevData) => {
        const newData = JSON.parse(JSON.stringify(prevData)) as TreeNode;
        let updatedNode: TreeNode | null = null;

        const updateNode = (node: TreeNode): boolean => {
          if (node.id === nodeId) {
            if (slackLinks !== undefined) node.slackLinks = slackLinks;
            if (githubLinks !== undefined) node.githubLinks = githubLinks;
            updatedNode = node;
            return true;
          }
          if (node.children) {
            for (const child of node.children) {
              if (updateNode(child)) return true;
            }
          }
          return false;
        };

        updateNode(newData);
        nodeStorage.saveTreeData(newData);

        if (updatedNode && selectedNode?.id === nodeId) {
          setSelectedNode(updatedNode);
        }

        return newData;
      });
    },
    [selectedNode],
  );

  const handleUpdateDescription = useCallback(
    (nodeId: string, description: string) => {
      setData((prevData) => {
        const newData = JSON.parse(JSON.stringify(prevData)) as TreeNode;
        let updatedNode: TreeNode | null = null;

        const updateNode = (node: TreeNode): boolean => {
          if (node.id === nodeId) {
            node.description = description;
            updatedNode = node;
            return true;
          }
          if (node.children) {
            for (const child of node.children) {
              if (updateNode(child)) return true;
            }
          }
          return false;
        };

        updateNode(newData);
        nodeStorage.saveTreeData(newData);

        if (updatedNode && selectedNode?.id === nodeId) {
          setSelectedNode(updatedNode);
        }

        return newData;
      });
    },
    [selectedNode],
  );

  const handleUpdateStatus = useCallback(
    (nodeId: string, status: TaskStatus) => {
      setData((prevData) => {
        const newData = JSON.parse(JSON.stringify(prevData)) as TreeNode;
        let updatedNode: TreeNode | null = null;

        const updateNode = (node: TreeNode): boolean => {
          if (node.id === nodeId) {
            node.status = status;
            updatedNode = node;
            return true;
          }
          if (node.children) {
            for (const child of node.children) {
              if (updateNode(child)) return true;
            }
          }
          return false;
        };

        updateNode(newData);
        nodeStorage.saveTreeData(newData);

        if (updatedNode && selectedNode?.id === nodeId) {
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
        <TreeGraph
          data={data}
          onNodeClick={setSelectedNode}
          onUpdateStatus={handleUpdateStatus}
        />
      </div>
      <DetailPanel
        selectedNode={selectedNode}
        onAddChild={handleAddChild}
        onUpdateNodeLinks={handleUpdateNodeLinks}
        onUpdateDescription={handleUpdateDescription}
      />
    </div>
  );
}
