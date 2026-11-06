import React from "react";
import { Lock, Users, BarChart3 } from "lucide-react";
import { FERPA_NOTICE } from "@/lib/ferpa";

const Opt = ({ active, onClick, icon: Icon, title, hint, testid }) => (
  <button
    type="button"
    role="radio"
    aria-checked={active}
    onClick={onClick}
    data-testid={testid}
    className={`text-left rounded-xl border px-3 py-2.5 transition-colors ${active ? "border-teal-500 bg-teal-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
  >
    <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
      <Icon className={`w-4 h-4 ${active ? "text-teal-600" : "text-slate-400"}`} /> {title}
    </span>
    <span className="block text-[11px] text-slate-500">{hint}</span>
  </button>
);

export const PrivacySettings = ({ draft, set }) => (
  <div className="space-y-4" data-testid="privacy-settings">
    <div className="border border-slate-200 rounded-xl p-4 space-y-3">
      <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5" style={{ fontFamily: "Outfit" }}>
        <Lock className="w-4 h-4 text-teal-600" /> District Privacy Settings
      </p>
      <p className="text-xs font-semibold text-slate-700">School Administrator visibility</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup">
        <Opt active={draft.adminVisibility === "aggregate"} onClick={() => set("adminVisibility")("aggregate")} icon={BarChart3} title="Aggregate Only" hint="Class totals and trends, no student names" testid="privacy-admin-aggregate" />
        <Opt active={draft.adminVisibility === "full"} onClick={() => set("adminVisibility")("full")} icon={Users} title="Full Roster Access" hint="Read-only student profiles and IEP reports" testid="privacy-admin-full" />
      </div>
      <ul className="text-[11px] text-slate-600 space-y-1 list-disc ml-4">
        <li>Official logs (chips, trial counts, parent digest entries) are part of the student record.</li>
        <li>Private reflection notes are visible only to the teacher and never appear in parent digests. They're included in IEP progress reports only when you choose to include them.</li>
      </ul>
    </div>
    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3" data-testid="privacy-ferpa-preview">
      <p className="text-[11px] font-bold text-slate-700 mb-1">Added to every PDF and parent digest:</p>
      <p className="text-[11px] text-slate-500 leading-relaxed">{FERPA_NOTICE}</p>
    </div>
  </div>
);
