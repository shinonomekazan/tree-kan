import { useEffect, useRef, useState } from "react";
import { Save, Loader2, Lock, Unlock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { nodeStorage } from "../save-data/storage";
import type { TreeNode } from "../types";

interface Props {
  data: TreeNode;
  onSave: () => void;
  isLocked: boolean;
  onToggleLock: () => void;
}

export default function TreeGraphHeader({
  data,
  onSave,
  isLocked,
  onToggleLock,
}: Props) {
  const { t, i18n } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImportBtn, setShowImportBtn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("import")) {
      setShowImportBtn(true);
    }
  }, []);

  const handleSaveClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsSaving(true);
    nodeStorage.saveTreeData(data);
    nodeStorage.commit();
    onSave();
    setTimeout(() => {
      setIsSaving(false);
    }, 400);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        nodeStorage.importAllData(JSON.parse(content));
        window.location.href = window.location.pathname;
      } catch { }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
      {/* Hàng trên: Gồm Import và các nút chuyển ngôn ngữ */}
      <div className="flex gap-2">
        {showImportBtn && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-md text-xs font-bold shadow-sm transition-colors border bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            >
              Import
            </button>
            <input
              type="file"
              accept=".json,application/json"
              ref={fileInputRef}
              className="hidden"
              onChange={handleImportFile}
            />
          </>
        )}
        <button
          onClick={() => i18n.changeLanguage("en")}
          className={`px-3 py-1.5 rounded-md text-xs font-bold shadow-sm transition-colors border ${i18n.language === "en" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}`}
        >
          EN
        </button>
        <button
          onClick={() => i18n.changeLanguage("ja")}
          className={`px-3 py-1.5 rounded-md text-xs font-bold shadow-sm transition-colors border ${i18n.language === "ja" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}`}
        >
          JA
        </button>
      </div>

      {/* Hàng dưới: Gồm Lock và Save nằm ngang hàng nhau */}
      <div className="flex gap-2 w-full">
        <button
          onClick={onToggleLock}
          className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold shadow-sm transition-colors border ${isLocked
              ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
        >
          {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
          {isLocked ? t("locked", "Locked") : t("unlocked", "Unlock")}
        </button>

        <button
          onClick={handleSaveClick}
          disabled={isSaving}
          className="flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold shadow-sm transition-all border bg-blue-600 text-white border-blue-600 hover:bg-blue-700 disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
