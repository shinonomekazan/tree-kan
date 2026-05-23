import { useState, useEffect, useCallback } from "react";
import type { FC } from "react";
import { Code, Plus, Edit2 } from "lucide-react";
import slackIcon from "./assets/slack-icon.png";
import githubIcon from "./assets/github-icon.png";
import type { TreeNode, NewNodePayload, LinkItem } from "./types";
import CreateNodeModal from "./CreateNodeModal";
import LinkModal from "./LinkModal";
import ConfirmModal from "./ConfirmModal";
import LinkGroup from "./LinkGroup";
import RenameNodeModal from "./RenameNodeModal";

interface DetailPanelProps {
  selectedNode: TreeNode | null;
  onAddChild: (parentId: string, payload: NewNodePayload) => void;
  onUpdateNodeLinks: (
    nodeId: string,
    slackLinks?: LinkItem[],
    githubLinks?: LinkItem[],
  ) => void;
  onUpdateDescription: (nodeId: string, description: string) => void;
  onUpdateNodeName: (nodeId: string, name: string) => void;
}

const DetailPanel: FC<DetailPanelProps> = ({
  selectedNode,
  onAddChild,
  onUpdateNodeLinks,
  onUpdateDescription,
  onUpdateNodeName,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [description, setDescription] = useState("");
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

  useEffect(() => {
    if (selectedNode) {
      setDescription(selectedNode.description || "");
    }
  }, [selectedNode]);

  const handleAddChild = useCallback(
    (payload: NewNodePayload) => {
      if (selectedNode) onAddChild(selectedNode.id, payload);
    },
    [selectedNode, onAddChild],
  );

  const handleDeleteLink = useCallback(() => {
    if (!selectedNode) return;
    const { type, id } = deleteConfirmState;

    const slackLinks =
      type === "slack"
        ? selectedNode.slackLinks?.filter((l) => l.id !== id) || []
        : selectedNode.slackLinks;

    const githubLinks =
      type === "github"
        ? selectedNode.githubLinks?.filter((l) => l.id !== id) || []
        : selectedNode.githubLinks;

    onUpdateNodeLinks(selectedNode.id, slackLinks, githubLinks);
    setDeleteConfirmState({ isOpen: false, type: "slack", id: "" });
  }, [selectedNode, deleteConfirmState, onUpdateNodeLinks]);

  const handleAddOrEditLink = useCallback(
    (link: LinkItem) => {
      if (!selectedNode) return;
      const isSlack = linkModalState.type === "slack";
      const currentLinks = isSlack
        ? selectedNode.slackLinks
        : selectedNode.githubLinks;

      const newLinks = currentLinks?.some((l) => l.id === link.id)
        ? currentLinks.map((l) => (l.id === link.id ? link : l))
        : [...(currentLinks || []), link];

      onUpdateNodeLinks(
        selectedNode.id,
        isSlack ? newLinks : selectedNode.slackLinks,
        !isSlack ? newLinks : selectedNode.githubLinks,
      );
      setLinkModalState((prev) => ({ ...prev, isOpen: false }));
    },
    [selectedNode, linkModalState.type, onUpdateNodeLinks],
  );

  const handleOpenLinkModal = useCallback(
    (type: "slack" | "github", editLink?: LinkItem) => {
      setLinkModalState({ isOpen: true, type, editLink });
    },
    [],
  );

  const handleOpenDeleteConfirm = useCallback(
    (type: "slack" | "github", id: string) => {
      setDeleteConfirmState({ isOpen: true, type, id });
    },
    [],
  );

  if (!selectedNode) {
    return (
      <div className="w-64 h-full bg-white shadow-xl flex flex-col z-10 border-l border-slate-200 shrink-0" />
    );
  }

  return (
    <>
      <div className="w-96 h-full bg-white shadow-xl flex flex-col z-10 border-l border-slate-200 shrink-0">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 truncate pr-4">
            {selectedNode.name}
          </h2>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setIsRenameModalOpen(true)}
              className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
              title="Đổi tên node"
            >
              <Edit2 size={18} />
            </button>
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
                className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                  selectedNode.status === "done"
                    ? "bg-blue-500"
                    : selectedNode.status === "review"
                      ? "bg-purple-500"
                      : selectedNode.status === "in-progress"
                        ? "bg-yellow-500"
                        : selectedNode.status === "archive"
                          ? "bg-slate-600"
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
            <LinkGroup
              title="Slack"
              type="slack"
              links={selectedNode.slackLinks}
              iconNode={
                <img
                  src={slackIcon}
                  alt="Slack"
                  className="w-5 h-5 object-contain"
                />
              }
              onAdd={handleOpenLinkModal}
              onEdit={handleOpenLinkModal}
              onDelete={handleOpenDeleteConfirm}
            />
            <LinkGroup
              title="GitHub"
              type="github"
              links={selectedNode.githubLinks}
              iconNode={
                <img
                  src={githubIcon}
                  alt="GitHub"
                  className="w-5 h-5 object-contain"
                />
              }
              onAdd={handleOpenLinkModal}
              onEdit={handleOpenLinkModal}
              onDelete={handleOpenDeleteConfirm}
            />
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
        onClose={() =>
          setLinkModalState((prev) => ({ ...prev, isOpen: false }))
        }
        onSubmit={handleAddOrEditLink}
      />
      <ConfirmModal
        isOpen={deleteConfirmState.isOpen}
        onClose={() =>
          setDeleteConfirmState((prev) => ({ ...prev, isOpen: false }))
        }
        onConfirm={handleDeleteLink}
      />
      <RenameNodeModal
        isOpen={isRenameModalOpen}
        initialName={selectedNode.name}
        onClose={() => setIsRenameModalOpen(false)}
        onSubmit={(name) => {
          onUpdateNodeName(selectedNode.id, name);
          setIsRenameModalOpen(false);
        }}
      />
    </>
  );
};

export default DetailPanel;
