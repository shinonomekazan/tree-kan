import slackIcon from "./assets/slack-icon.png";
import githubIcon from "./assets/github-icon.png";
import { useState, useEffect } from "react";
import { Code, Plus, ExternalLink, Trash2, Edit } from "lucide-react";
import type { TreeNode, NewNodePayload, LinkItem } from "./types";
import CreateNodeModal from "./CreateNodeModal";

interface DetailPanelProps {
  selectedNode: TreeNode | null;
  onAddChild: (parentId: string, payload: NewNodePayload) => void;
  onUpdateNodeLinks: (
    nodeId: string,
    slackLinks?: LinkItem[],
    githubLinks?: LinkItem[],
  ) => void;
  onUpdateDescription: (nodeId: string, description: string) => void;
}

export default function DetailPanel({
  selectedNode,
  onAddChild,
  onUpdateNodeLinks,
  onUpdateDescription,
}: DetailPanelProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [linkModalState, setLinkModalState] = useState<{
    isOpen: boolean;
    type: "slack" | "github";
    editLink?: LinkItem;
  }>({ isOpen: false, type: "slack" });
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    type: "slack" | "github";
    id: string;
  }>({ isOpen: false, type: "slack", id: "" });
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (selectedNode) {
      setDescription(selectedNode.description || "");
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return (
      <div className="w-96 h-full bg-white shadow-xl flex flex-col z-10 border-l border-slate-200 shrink-0" />
    );
  }

  const handleAddChild = (payload: NewNodePayload) => {
    onAddChild(selectedNode.id, payload);
  };

  const handleDeleteLink = () => {
    const { type, id } = deleteConfirmState;
    if (type === "slack") {
      onUpdateNodeLinks(
        selectedNode.id,
        selectedNode.slackLinks?.filter((l) => l.id !== id) || [],
        selectedNode.githubLinks,
      );
    } else {
      onUpdateNodeLinks(
        selectedNode.id,
        selectedNode.slackLinks,
        selectedNode.githubLinks?.filter((l) => l.id !== id) || [],
      );
    }
    setDeleteConfirmState({ isOpen: false, type: "slack", id: "" });
  };

  const handleAddOrEditLink = (link: LinkItem) => {
    const isSlack = linkModalState.type === "slack";
    const currentLinks = isSlack
      ? selectedNode.slackLinks
      : selectedNode.githubLinks;
    const linkExists = currentLinks?.find((l) => l.id === link.id);

    let newLinks: LinkItem[];
    if (linkExists) {
      newLinks = currentLinks!.map((l) => (l.id === link.id ? link : l));
    } else {
      newLinks = [...(currentLinks || []), link];
    }

    if (isSlack) {
      onUpdateNodeLinks(selectedNode.id, newLinks, selectedNode.githubLinks);
    } else {
      onUpdateNodeLinks(selectedNode.id, selectedNode.slackLinks, newLinks);
    }
    setLinkModalState({ isOpen: false, type: "slack" });
  };

  const renderLinkGroup = (
    title: string,
    type: "slack" | "github",
    links: LinkItem[] = [],
    iconNode: React.ReactNode,
  ) => (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3">
        {iconNode}
        <h4 className="font-bold text-slate-800">{title}</h4>
      </div>
      <div className="space-y-2">
        {links.map((link) => (
          <div
            key={link.id}
            className="group relative flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 transition-colors"
          >
            <div className="flex flex-col overflow-hidden mr-2">
              <span className="font-bold text-slate-800 text-sm truncate">
                {link.title}
              </span>
              <span className="text-xs text-slate-500 truncate mt-0.5">
                {link.description}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() =>
                  setLinkModalState({ isOpen: true, type, editLink: link })
                }
                className="opacity-0 group-hover:opacity-100 p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-all"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() =>
                  setDeleteConfirmState({ isOpen: true, type, id: link.id })
                }
                className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-50 rounded transition-all"
              >
                <Trash2 size={16} />
              </button>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
              >
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
        ))}
        <button
          onClick={() => setLinkModalState({ isOpen: true, type })}
          className="w-full py-2 flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-dashed border-slate-300 rounded-lg transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="w-96 h-full bg-white shadow-xl flex flex-col z-10 border-l border-slate-200 shrink-0">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 truncate pr-4">
            {selectedNode.name}
          </h2>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-full transition-colors"
              title="Thêm node con"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {selectedNode.type === "task" && selectedNode.status && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-600">
                Trạng thái:
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold text-white
${selectedNode.status === "done"
                    ? "bg-blue-500"
                    : selectedNode.status === "in-progress"
                      ? "bg-yellow-500"
                      : selectedNode.status === "blocked"
                        ? "bg-red-500"
                        : "bg-slate-400"
                  }`}
              >
                {selectedNode.status.toUpperCase()}
              </span>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="flex items-center gap-2 font-semibold text-slate-700">
              <Code size={18} /> Mô tả kỹ thuật
            </h3>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm text-slate-600 bg-slate-50 border border-slate-200 p-3 rounded-lg leading-relaxed outline-none focus:border-blue-400 min-h-[100px] resize-y transition-colors"
              placeholder="Nhập mô tả kỹ thuật..."
            />
            <div className="flex justify-end">
              <button
                onClick={() =>
                  onUpdateDescription(selectedNode.id, description)
                }
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Lưu
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {renderLinkGroup(
              "Slack",
              "slack",
              selectedNode.slackLinks,
              <img
                src={slackIcon}
                alt="Slack"
                className="w-5 h-5 object-contain"
              />,
            )}
            {renderLinkGroup(
              "GitHub",
              "github",
              selectedNode.githubLinks,
              <img
                src={githubIcon}
                alt="GitHub"
                className="w-5 h-5 object-contain"
              />,
            )}
          </div>
        </div>
      </div>
      <CreateNodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddChild}
      />
      <LinkModal
        isOpen={linkModalState.isOpen}
        type={linkModalState.type}
        editLink={linkModalState.editLink}
        onClose={() => setLinkModalState({ ...linkModalState, isOpen: false })}
        onSubmit={handleAddOrEditLink}
      />
      <ConfirmModal
        isOpen={deleteConfirmState.isOpen}
        onClose={() =>
          setDeleteConfirmState({ ...deleteConfirmState, isOpen: false })
        }
        onConfirm={handleDeleteLink}
      />
    </>
  );
}

interface LinkModalProps {
  isOpen: boolean;
  type: "slack" | "github";
  editLink?: LinkItem;
  onClose: () => void;
  onSubmit: (link: LinkItem) => void;
}

function LinkModal({
  isOpen,
  type,
  editLink,
  onClose,
  onSubmit,
}: LinkModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTitle(editLink?.title || "");
      setDescription(editLink?.description || "");
      setUrl(editLink?.url || "");
    }
  }, [isOpen, editLink]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    onSubmit({
      id: editLink?.id || crypto.randomUUID(),
      title,
      description,
      url,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg p-5 w-[400px] shadow-xl"
      >
        <h3 className="text-lg font-bold mb-4">
          {editLink ? "Cập nhật liên kết" : "Thêm liên kết"}{" "}
          {type === "slack" ? "Slack" : "GitHub"}
        </h3>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Tiêu đề (VD: #mobile-app-dev)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-sm p-2 border border-slate-200 rounded-md outline-none focus:border-blue-400"
            required
          />
          <input
            type="text"
            placeholder="Mô tả phụ"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-sm p-2 border border-slate-200 rounded-md outline-none focus:border-blue-400"
          />
          <input
            type="url"
            placeholder="Đường dẫn (URL)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full text-sm p-2 border border-slate-200 rounded-md outline-none focus:border-blue-400"
            required
          />
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            {editLink ? "Cập nhật" : "Thêm"}
          </button>
        </div>
      </form>
    </div>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function ConfirmModal({ isOpen, onClose, onConfirm }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-5 w-[350px] shadow-xl">
        <h3 className="text-lg font-bold mb-2 text-slate-800">Xác nhận xóa</h3>
        <p className="text-sm text-slate-600 mb-5">
          Bạn có chắc chắn muốn xóa liên kết này không?
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}
