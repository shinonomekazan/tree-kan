import { useState, useCallback, useEffect } from "react";
import TreeGraph from "./TreeGraph";
import DetailPanel from "./DetailPanel";
import { projectData } from "./mockData";
import { nodeStorage } from "./storage";
import type { TreeNode, NewNodePayload, LinkItem, TaskStatus } from "./types";
import "./i18n";

export default function App() {
  const [data, setData] = useState<TreeNode>(
    () => nodeStorage.getTreeData() || projectData,
  );
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(
    () => nodeStorage.getTreeData() || projectData,
  );
  const [isKanban, setIsKanban] = useState(false);
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.has("export")) {
      const exportData = nodeStorage.exportAllData();
      const blob = new Blob([JSON.stringify(exportData)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "tree-data-export.json";
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, []);

  const handleSave = useCallback(() => {
    nodeStorage.saveTreeData(data);
  }, [data]);

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

  const handleReorderTasks = useCallback(
    (updates: { id: string; status: TaskStatus; order: number }[]) => {
      setData((prevData) => {
        const newData = JSON.parse(JSON.stringify(prevData)) as TreeNode;
        const updateMap = new Map(updates.map((u) => [u.id, u]));
        let updatedNode: TreeNode | null = null;

        const traverse = (node: TreeNode) => {
          if (updateMap.has(node.id)) {
            const u = updateMap.get(node.id);
            if (u) {
              node.status = u.status;
              node.order = u.order;
            }
            if (node.id === selectedNode?.id) updatedNode = node;
          }
          if (node.children) {
            node.children.forEach(traverse);
          }
        };

        traverse(newData);
        nodeStorage.saveTreeData(newData);

        if (updatedNode) {
          setSelectedNode(updatedNode);
        }

        return newData;
      });
    },
    [selectedNode],
  );

  const handleUpdateNodeName = useCallback(
    (nodeId: string, name: string) => {
      setData((prevData) => {
        const newData = JSON.parse(JSON.stringify(prevData)) as TreeNode;
        let updatedNode: TreeNode | null = null;

        const updateNode = (node: TreeNode): boolean => {
          if (node.id === nodeId) {
            node.name = name;
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

  const handleOpenKanban = useCallback((id: string) => {
    setIsKanban(true);
    setFocusedTaskId(id);
  }, []);

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setData((prevData) => {
        if (prevData.id === nodeId) return prevData;

        const newData = JSON.parse(JSON.stringify(prevData)) as TreeNode;

        const removeNode = (node: TreeNode): boolean => {
          if (!node.children) return false;

          const index = node.children.findIndex((child) => child.id === nodeId);
          if (index !== -1) {
            node.children.splice(index, 1);
            return true;
          }

          for (const child of node.children) {
            if (removeNode(child)) return true;
          }
          return false;
        };

        removeNode(newData);
        nodeStorage.saveTreeData(newData);

        if (selectedNode?.id === nodeId) {
          setSelectedNode(null);
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
          onReorderTasks={handleReorderTasks}
          isKanban={isKanban}
          onToggleKanban={() => setIsKanban(!isKanban)}
          focusedTaskId={focusedTaskId}
          onSave={handleSave}
        />
      </div>
      <DetailPanel
        selectedNode={selectedNode}
        onAddChild={handleAddChild}
        onUpdateNodeLinks={handleUpdateNodeLinks}
        onUpdateDescription={handleUpdateDescription}
        onUpdateNodeName={handleUpdateNodeName}
        onOpenKanban={handleOpenKanban}
        onDeleteNode={handleDeleteNode}
      />
    </div>
  );
}