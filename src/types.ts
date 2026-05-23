export type TaskStatus = "todo" | "in-progress" | "review" | "done" | "archive";
export type NodeType = "root" | "project" | "module" | "task";

export interface LinkItem {
  id: string;
  title: string;
  description: string;
  url: string;
}

export interface TreeNode {
  id: string;
  name: string;
  type: NodeType;
  status?: TaskStatus;
  order?: number;
  color?: string;
  description?: string;
  assignee?: string;
  children?: TreeNode[];
  slackLinks?: LinkItem[];
  githubLinks?: LinkItem[];
}

export interface NewNodePayload {
  name: string;
  type: NodeType;
  status?: TaskStatus;
  description?: string;
}
