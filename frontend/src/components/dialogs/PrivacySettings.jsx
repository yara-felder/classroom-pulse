import React from "react";
import { Lock } from "lucide-react";
import { FERPA_NOTICE } from "@/lib/ferpa";

export const PrivacySettings = () => (
  <div className="space-y-4" data-testid="privacy-settings">
    <div className="border border-slate-200 rounded-xl p-4 space-y-3">
      <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5" style={{ fontFamily: "Outfit" }}>
        <Lock className="w-4 h-4 text-teal-600" /> District Privacy Settings
      </p>
      <p className="text-xs font-semibold text-slate-700">School administrator roster</p>
      <p className="text-[11px] text-slate-600 leading-relaxed" data-testid="privacy-admin-roster">
        The school administrator automatically sees this school’s roster, including student names, so they can assign IEP and 504 caseloads. You do not turn that on or off per classroom.
      </p>
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
