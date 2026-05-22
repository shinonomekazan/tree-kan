export interface INodeStorage {
  savePosition(id: string, cx: number, cy: number): void;
  getPosition(id: string): { cx: number; cy: number } | null;
  clear(): void;
}

class LocalStorageAdapter implements INodeStorage {
  STORAGE_KEY = "node_positions";

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

  clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

export const nodeStorage: INodeStorage = new LocalStorageAdapter();
