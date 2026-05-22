import { useState } from "react";
import { X } from "lucide-react";
import type { NodeType, TaskStatus, NewNodePayload } from "./types";

interface CreateNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewNodePayload) => void;
}

export default function CreateNodeModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateNodeModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<NodeType>("task");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [description, setDescription] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      type,
      status: type === "task" ? status : undefined,
      description,
    });
    setName("");
    setType("task");
    setStatus("todo");
    setDescription("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-[400px] shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Thêm Node Mới</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">
              Tên Node
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              placeholder="Nhập tên..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Loại</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as NodeType)}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            >
              <option value="project">Project</option>
              <option value="module">Module</option>
              <option value="task">Task</option>
            </select>
          </div>

          {type === "task" && (
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Trạng thái
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              >
                <option value="todo">Chờ xử lý</option>
                <option value="in-progress">Đang thực hiện</option>
                <option value="done">Hoàn thành</option>
                <option value="blocked">Đang tắc nghẽn</option>
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">
              Mô tả
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none h-24"
              placeholder="Nhập mô tả..."
            />
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              Tạo mới
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
