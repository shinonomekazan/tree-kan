export type TaskStatus = "done" | "in-progress" | "blocked" | "todo";
export type NodeType = "root" | "project" | "module" | "task";

export interface TreeNode {
  id: string;
  name: string;
  type: NodeType;
  status?: TaskStatus;
  color?: string;
  description?: string;
  assignee?: string;
  children?: TreeNode[];
}

export interface NewNodePayload {
  name: string;
  type: NodeType;
  status?: TaskStatus;
  description?: string;
}
