import { useState, useEffect } from "react";
import type { FC, FormEvent } from "react";
import { useTranslation } from "react-i18next";

interface RenameNodeModalProps {
  isOpen: boolean;
  initialName: string;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

const RenameNodeModal: FC<RenameNodeModalProps> = ({
  isOpen,
  initialName,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");

  useEffect(() => {
    if (isOpen) setName(initialName);
  }, [isOpen, initialName]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-[350px] shadow-2xl overflow-hidden p-5">
        <h3 className="text-lg font-bold mb-4 text-slate-800">
          {t("renameNode")}
        </h3>
        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2.5 mb-5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            placeholder={t("newNamePh")}
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              {t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenameNodeModal;
