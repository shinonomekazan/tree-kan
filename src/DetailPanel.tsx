import { X, MessageSquare, Clock, Code } from 'lucide-react';
import type { TreeNode } from './types';

interface DetailPanelProps {
  selectedNode: TreeNode | null;
  onClose: () => void;
}

export default function DetailPanel({ selectedNode, onClose }: DetailPanelProps) {
  if (!selectedNode) return null;

  return (
    <div className="w-96 h-full bg-white shadow-xl flex flex-col z-10 border-l border-slate-200 shrink-0">
      <div className="p-4 border-b flex justify-between items-center bg-slate-50">
        <h2 className="text-xl font-bold text-slate-800 truncate pr-4">{selectedNode.name}</h2>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-full shrink-0 text-slate-500 transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {selectedNode.type === 'task' && selectedNode.status && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-600">Trạng thái:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold text-white
              ${selectedNode.status === 'done' ? 'bg-blue-500' : 
                selectedNode.status === 'in-progress' ? 'bg-yellow-500' : 
                selectedNode.status === 'blocked' ? 'bg-red-500' : 'bg-slate-400'}`}>
              {selectedNode.status.toUpperCase()}
            </span>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="flex items-center gap-2 font-semibold text-slate-700">
            <Code size={18} /> Mô tả kỹ thuật
          </h3>
          <p className="text-sm text-slate-600 bg-slate-100 p-3 rounded-lg leading-relaxed">
            {selectedNode.description || "Chưa có mô tả kỹ thuật cho công việc này. Vui lòng cập nhật tài liệu."}
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="flex items-center gap-2 font-semibold text-slate-700">
            <MessageSquare size={18} /> Không gian thảo luận
          </h3>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 h-32 flex flex-col justify-end">
            <p className="text-xs text-slate-400 text-center mb-2">Bắt đầu cuộc trò chuyện...</p>
            <input type="text" placeholder="Nhập tin nhắn..." className="w-full text-sm p-2.5 border border-slate-200 rounded-md outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="flex items-center gap-2 font-semibold text-slate-700">
            <Clock size={18} /> Lịch sử thay đổi
          </h3>
          <ul className="text-sm text-slate-600 space-y-3 border-l-2 border-slate-200 pl-4 ml-1">
            <li className="relative">
              <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-slate-300"></span>
              <span className="font-semibold text-slate-700">{selectedNode.assignee || 'Admin'}</span> đã tạo task này (Hôm qua)
            </li>
            {selectedNode.status === 'in-progress' && (
              <li className="relative">
                <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-blue-400"></span>
                Chuyển sang Đang thực hiện (2 giờ trước)
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}