import { useState, useEffect } from "react";
import type { FC, FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { LinkItem } from "../types";

interface LinkModalProps {
  isOpen: boolean;
  type: "slack" | "github";
  editLink?: LinkItem;
  onClose: () => void;
  onSubmit: (link: LinkItem) => void;
}

const LinkModal: FC<LinkModalProps> = ({
  isOpen,
  type,
  editLink,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
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

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
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
          {editLink ? t("updateLink") : t("addLink")}{" "}
          {type === "slack" ? "Slack" : "GitHub"}
        </h3>
        <div className="space-y-3">
          <input
            type="text"
            placeholder={t("titlePh")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-sm p-2 border border-slate-200 rounded-md outline-none focus:border-blue-400"
            required
          />
          <input
            type="text"
            placeholder={t("subDescPh")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-sm p-2 border border-slate-200 rounded-md outline-none focus:border-blue-400"
          />
          <input
            type="url"
            placeholder={t("urlPh")}
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
            {t("cancel")}
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            {editLink ? t("update") : t("add")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LinkModal;
