import type { FC } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DeleteNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (keepChildren: boolean) => void;
}

const DeleteNodeModal: FC<DeleteNodeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-[400px] shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">
            {t("deleteNode")}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => onConfirm(true)}
            className="w-full py-3 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg transition-colors text-left"
          >
            {t("deleteNodeKeepChildren")}
          </button>
          <button
            onClick={() => onConfirm(false)}
            className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-lg transition-colors text-left"
          >
            {t("deleteNodeAndChildren")}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors text-left mt-2"
          >
            {t("cancel", "Cancel")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteNodeModal;
