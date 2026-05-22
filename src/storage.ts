import type { TreeNode } from "./types";

export interface INodeStorage {
  savePosition(id: string, cx: number, cy: number): void;
  getPosition(id: string): { cx: number; cy: number } | null;
  saveTreeData(data: TreeNode): void;
  getTreeData(): TreeNode | null;
  clear(): void;
  saveTransform(x: number, y: number, k: number): void;
  getTransform(): { x: number; y: number; k: number } | null;
}

class LocalStorageAdapter implements INodeStorage {
  STORAGE_KEY = "node_positions";
  TREE_DATA_KEY = "tree_data";
  TRANSFORM_KEY = "map_transform";

  getPositions(): Record<string, { cx: number; cy: number }> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  }

  savePosition(id: string, cx: number, cy: number): void {
    const positions = this.getPositions();
    positions[id] = { cx, cy };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(positions));
  }

  getPosition(id: string): { cx: number; cy: number } | null {
    return this.getPositions()[id] || null;
  }

  saveTreeData(data: TreeNode): void {
    localStorage.setItem(this.TREE_DATA_KEY, JSON.stringify(data));
  }

  getTreeData(): TreeNode | null {
    const data = localStorage.getItem(this.TREE_DATA_KEY);
    return data ? JSON.parse(data) : null;
  }

  clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  saveTransform(x: number, y: number, k: number): void {
    localStorage.setItem(this.TRANSFORM_KEY, JSON.stringify({ x, y, k }));
  }

  getTransform(): { x: number; y: number; k: number } | null {
    const data = localStorage.getItem(this.TRANSFORM_KEY);
    return data ? JSON.parse(data) : null;
  }
}

export const nodeStorage: INodeStorage = new LocalStorageAdapter();
