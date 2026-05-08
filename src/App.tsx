import { useState } from 'react';
import TreeGraph from './TreeGraph';
import DetailPanel from './DetailPanel';
import { projectData } from './mockData';
import type { TreeNode } from './types';

export default function App() {
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);

  return (
    <div className="flex w-screen h-screen font-sans overflow-hidden bg-slate-50">
      <div className="flex-1 relative w-full h-full">
        <TreeGraph data={projectData} onNodeClick={setSelectedNode} />
      </div>
      <DetailPanel selectedNode={selectedNode} onClose={() => setSelectedNode(null)} />
    </div>
  );
}