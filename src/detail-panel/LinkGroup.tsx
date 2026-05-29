import { Edit, Trash2, ExternalLink, Plus } from "lucide-react";
import type { FC, ReactNode } from "react";
import type { LinkItem } from "../types";

interface LinkGroupProps {
  title: string;
  type: "slack" | "github";
  links?: LinkItem[];
  iconNode: ReactNode;
  onAdd: (type: "slack" | "github") => void;
  onEdit: (type: "slack" | "github", link: LinkItem) => void;
  onDelete: (type: "slack" | "github", id: string) => void;
}

const LinkGroup: FC<LinkGroupProps> = ({
  title,
  type,
  links = [],
  iconNode,
  onAdd,
  onEdit,
  onDelete,
}) => {
  return (
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
              <span className="font-bold text-slate-800 text-sm truncate">{link.title}</span>
              <span className="text-xs text-slate-500 truncate mt-0.5">{link.description}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onEdit(type, link)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-all"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => onDelete(type, link.id)}
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
          onClick={() => onAdd(type)}
          className="w-full py-2 flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-dashed border-slate-300 rounded-lg transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

export default LinkGroup;