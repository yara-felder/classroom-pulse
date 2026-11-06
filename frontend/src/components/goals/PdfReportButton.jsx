import React, { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const PdfReportButton = ({ testid, onExport, label = "Download PDF Report", shortLabel = "PDF" }) => {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      const filename = await onExport();
      toast.success("PDF report downloaded", { description: filename });
    } catch (e) {
      toast.error("Could not generate PDF", { description: String(e?.message || e) });
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      data-testid={testid}
      onClick={run}
      disabled={busy}
      className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 disabled:opacity-70 text-white rounded-lg px-3 py-1.5 transition-colors shadow-sm active:scale-95 shrink-0"
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{shortLabel}</span>
    </button>
  );
};

export const chartElFor = (testidPrefix) =>
  document.querySelector(`[data-testid="${testidPrefix}-trend-chart"]`);
