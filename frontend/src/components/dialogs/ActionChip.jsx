import React from "react";
import { Check } from "lucide-react";

const TONES = {
  emerald: {
    on: "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500",
    off: "bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40",
    title: "text-emerald-900",
    check: "bg-emerald-500",
  },
  amber: {
    on: "bg-amber-50 border-amber-500 ring-1 ring-amber-500",
    off: "bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/40",
    title: "text-amber-900",
    check: "bg-amber-500",
  },
};

export const ActionChip = ({ item, active, onToggle, tone, testid, checkTestid }) => {
  const t = TONES[tone];
  return (
    <button
      type="button"
      data-testid={testid}
      aria-pressed={active}
      onClick={onToggle}
      className={`relative px-3 py-2.5 rounded-xl border text-left transition-colors ${active ? t.on : t.off}`}
    >
      {active && (
        <span
          data-testid={checkTestid}
          className={`absolute top-2 right-2 w-4 h-4 rounded-full text-white flex items-center justify-center ${t.check}`}
        >
          <Check className="w-2.5 h-2.5" strokeWidth={3.5} />
        </span>
      )}
      <div className={`text-sm font-bold leading-tight pr-5 ${active ? t.title : "text-slate-800"}`}>
        {item.title || item.label}
      </div>
      {item.action && <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.action}</div>}
    </button>
  );
};
