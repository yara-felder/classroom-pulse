import React from "react";
import { ShieldCheck } from "lucide-react";
import { roleLabel } from "@/lib/rbac";

export const RestrictedNotice = ({ role, title, body, testid = "restricted-notice" }) => (
  <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex gap-3 mb-4" data-testid={testid}>
    <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
    <div>
      <p className="text-sm font-bold text-indigo-900" style={{ fontFamily: "Outfit" }}>{title}</p>
      <p className="text-xs text-indigo-800 mt-0.5">
        {body} <span className="font-semibold">Viewing as {roleLabel(role)}.</span>
      </p>
    </div>
  </div>
);
