import type { TreeNode } from "./types";

export interface INodeStorage {
  savePosition(id: string, cx: number, cy: number): void;
  getPosition(id: string): { cx: number; cy: number } | null;
  saveTreeData(data: TreeNode): void;
  getTreeData(): TreeNode | null;
  clear(): void;
  saveTransform(x: number, y: number, k: number): void;
  getTransform(): { x: number; y: number; k: number } | null;
  exportAllData(): Record<string, unknown>;
  importAllData(data: Record<string, unknown>): void;
  commit(): void;
}

class LocalStorageAdapter implements INodeStorage {
  STORAGE_KEY = "node_positions";
  TREE_DATA_KEY = "tree_data";
  TRANSFORM_KEY = "map_transform";

  pendingPositions: Record<string, { cx: number; cy: number }> | null = null;
  pendingTreeData: TreeNode | null = null;
  pendingTransform: { x: number; y: number; k: number } | null = null;

  getPositions(): Record<string, { cx: number; cy: number }> {
    if (this.pendingPositions) return this.pendingPositions;
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  }

  savePosition(id: string, cx: number, cy: number): void {
    if (!this.pendingPositions) this.pendingPositions = this.getPositions();
    this.pendingPositions[id] = { cx, cy };
  }

  getPosition(id: string): { cx: number; cy: number } | null {
    return this.getPositions()[id] || null;
  }

  saveTreeData(data: TreeNode): void {
    this.pendingTreeData = data;
  }

  getTreeData(): TreeNode | null {
    if (this.pendingTreeData) return this.pendingTreeData;
    const data = localStorage.getItem(this.TREE_DATA_KEY);
    return data ? JSON.parse(data) : null;
  }

  clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  saveTransform(x: number, y: number, k: number): void {
    this.pendingTransform = { x, y, k };
  }

  getTransform(): { x: number; y: number; k: number } | null {
    if (this.pendingTransform) return this.pendingTransform;
    const data = localStorage.getItem(this.TRANSFORM_KEY);
    return data ? JSON.parse(data) : null;
  }

  commit(): void {
    if (this.pendingPositions) {
      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(this.pendingPositions),
      );
    }
    if (this.pendingTreeData) {
      localStorage.setItem(
        this.TREE_DATA_KEY,
        JSON.stringify(this.pendingTreeData),
      );
    }
    if (this.pendingTransform) {
      localStorage.setItem(
        this.TRANSFORM_KEY,
        JSON.stringify(this.pendingTransform),
      );
    }
  }

  exportAllData(): Record<string, unknown> {
    return {
      positions: this.getPositions(),
      treeData: this.getTreeData(),
      transform: this.getTransform(),
    };
  }

  importAllData(data: Record<string, unknown>): void {
    if (data.positions) {
      this.pendingPositions = data.positions as Record<
        string,
        { cx: number; cy: number }
      >;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data.positions));
    }
    if (data.treeData) {
      this.pendingTreeData = data.treeData as TreeNode;
      localStorage.setItem(this.TREE_DATA_KEY, JSON.stringify(data.treeData));
    }
    if (data.transform) {
      this.pendingTransform = data.transform as {
        x: number;
        y: number;
        k: number;
      };
      localStorage.setItem(this.TRANSFORM_KEY, JSON.stringify(data.transform));
    }
  }
}

export const nodeStorage: INodeStorage = new LocalStorageAdapter();
