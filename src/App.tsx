import { useState, useCallback, useEffect } from "react";
import TreeGraph from "./tree/TreeGraph";
import DetailPanel from "./detail-panel/DetailPanel";
import { projectData } from "./save-data/mockData";
import { nodeStorage } from "./save-data/storage";
import { currentPositionsCache } from "./tree/useD3Tree";
import type { TreeNode, NewNodePayload, LinkItem, TaskStatus } from "./types";
import "./i18n";

export default function App() {
  const [data, setData] = useState<TreeNode>(
    () => nodeStorage.getTreeData() || projectData,
  );
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(
    () => nodeStorage.getTreeData() || projectData,
  );
  const [prevSelectedNode, setPrevSelectedNode] = useState<TreeNode | null>(
    null,
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

  const handleToggleLink = useCallback(
    (id1: string, id2: string, action: "create" | "delete") => {
      setData((prevData) => {
        const newData = JSON.parse(JSON.stringify(prevData)) as TreeNode;

        const findNode = (
          node: TreeNode,
          id: string,
          parent: TreeNode | null = null,
        ): { node: TreeNode; parent: TreeNode | null } | null => {
          if (node.id === id) return { node, parent };

          for (const child of node.children ?? []) {
            const result = findNode(child, id, node);
            if (result) return result;
          }

          return null;
        };

        const sourceResult = findNode(newData, id1);
        const targetResult = findNode(newData, id2);

        if (!sourceResult || !targetResult) return prevData;

        const sourceNode = sourceResult.node;
        const targetNode = targetResult.node;
        const currentTargetParent = targetResult.parent;

        if (action === "delete") {
          if (sourceNode.children?.some((child: TreeNode) => child.id === targetNode.id)) {
            sourceNode.children = sourceNode.children.filter(
              (child: TreeNode) => child.id !== targetNode.id,
            );

            if (!newData.children) newData.children = [];
            newData.children.push(targetNode);
          } else if (
            targetNode.children?.some((child: TreeNode) => child.id === sourceNode.id)
          ) {
            targetNode.children = targetNode.children.filter(
              (child: TreeNode) => child.id !== sourceNode.id,
            );

            if (!newData.children) newData.children = [];
            newData.children.push(sourceNode);
          }
        } else {
          let isDescendant = false;

          const checkDescendant = (node: TreeNode) => {
            if (node.id === sourceNode.id) isDescendant = true;

            for (const child of node.children ?? []) {
              checkDescendant(child);
            }
          };

          checkDescendant(targetNode);

          if (isDescendant || targetNode.id === newData.id) return prevData;

          if (currentTargetParent?.children) {
            currentTargetParent.children = currentTargetParent.children.filter(
              (child: TreeNode) => child.id !== targetNode.id,
            );
          }

          if (!sourceNode.children) sourceNode.children = [];
          sourceNode.children.push(targetNode);
        }

        nodeStorage.saveTreeData(newData);

        if (selectedNode?.id === targetNode.id) {
          setSelectedNode(targetNode);
        } else if (selectedNode?.id === sourceNode.id) {
          setSelectedNode(sourceNode);
        }

        return newData;
      });

      setPrevSelectedNode(null);
    },
    [selectedNode],
  );

  const handleDeleteNode = useCallback(
    (nodeId: string, keepChildren: boolean = false) => {
      setData((prevData) => {
        if (prevData.id === nodeId) return prevData;

        const newData = JSON.parse(JSON.stringify(prevData)) as TreeNode;

        const freezePositions = (n: TreeNode) => {
          const pos = currentPositionsCache.get(n.id);
          if (pos) nodeStorage.savePosition(n.id, pos.cx, pos.cy);
          n.children?.forEach(freezePositions);
        };
        freezePositions(newData);

        let deletedNodeChildren: TreeNode[] = [];

        const removeNode = (node: TreeNode): boolean => {
          if (!node.children) return false;

          const index = node.children.findIndex((child) => child.id === nodeId);
          if (index !== -1) {
            const [deletedNode] = node.children.splice(index, 1);
            if (keepChildren && deletedNode.children) {
              deletedNodeChildren = deletedNode.children.map((child) => ({
                ...child,
                isHiddenLink: true,
              }));
            }
            return true;
          }

          for (const child of node.children) {
            if (removeNode(child)) return true;
          }
          return false;
        };

        if (removeNode(newData)) {
          if (keepChildren && deletedNodeChildren.length > 0) {
            if (!newData.children) newData.children = [];
            newData.children.push(...deletedNodeChildren);
          }
          nodeStorage.saveTreeData(newData);
        }

        if (selectedNode?.id === nodeId) {
          setSelectedNode(newData);
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
          onNodeClick={(node) => {
            if (selectedNode?.id !== node.id) {
              setPrevSelectedNode(selectedNode);
            }
            setSelectedNode(node);
          }}
          onReorderTasks={handleReorderTasks}
          isKanban={isKanban}
          onToggleKanban={() => setIsKanban(!isKanban)}
          focusedTaskId={focusedTaskId}
          onSave={handleSave}
        />
      </div>
      <DetailPanel
        selectedNode={selectedNode}
        prevSelectedNode={prevSelectedNode}
        onToggleLink={handleToggleLink}
        onAddChild={handleAddChild}
        onUpdateNodeLinks={handleUpdateNodeLinks}
        onUpdateDescription={handleUpdateDescription}
        onUpdateNodeName={handleUpdateNodeName}
        onOpenKanban={handleOpenKanban}
        onDeleteNode={handleDeleteNode}
        onSelectRoot={() => {
          if (selectedNode?.id !== data.id) setPrevSelectedNode(selectedNode);
          setSelectedNode(data);
        }}
      />
    </div>
  );
}
