import React, { useEffect, useState } from "react";
import { Printer, FileDown, Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { RESOURCE_SHEETS } from "./ResourceSheets";
import { saveSheetAsPdf } from "./saveSheetPdf";

const SHEET_ID = "resource-print-sheet";

export const ResourcePreviewModal = ({ resource, onClose }) => {
  const [saving, setSaving] = useState(false);
  const open = !!resource;
  const Sheet = resource ? RESOURCE_SHEETS[resource.id] : null;

  useEffect(() => {
    document.body.classList.toggle("printing-resource", open);
    return () => {
      document.body.classList.remove("printing-resource");
    };
  }, [open]);

  const savePdf = async () => {
    setSaving(true);
    try {
      await saveSheetAsPdf(SHEET_ID, resource.title);
      toast.success(`Saved "${resource.title}" as PDF`);
    } catch (e) {
      toast.error("Could not create the PDF. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-testid="resource-preview-modal"
        className="resource-print-modal max-w-3xl w-[96vw] max-h-[92vh] overflow-y-auto p-0 gap-0 bg-slate-100 [&>button]:hidden"
        onEscapeKeyDown={onClose}
        onPointerDownOutside={onClose}
      >
        <div className="no-print sticky top-0 z-10 bg-white border-b border-slate-200 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <DialogTitle className="text-lg font-bold text-slate-900" style={{ fontFamily: "Outfit" }} data-testid="resource-preview-title">
              {resource?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Letter size (8.5 x 11 in) preview
            </DialogDescription>
          </div>
          <div className="flex gap-2">
            <button
              data-testid="resource-save-pdf-btn"
              onClick={savePdf}
              disabled={saving}
              className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-slate-800 bg-white border border-slate-300 hover:border-slate-400 rounded-xl px-3 py-2 transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              Save as PDF
            </button>
            <button
              data-testid="resource-print-btn"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-white bg-slate-900 hover:bg-slate-700 rounded-xl px-3 py-2 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print Resource
            </button>
            <button
              data-testid="resource-close-btn"
              onClick={onClose}
              aria-label="Close preview"
              className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl px-3 py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </div>
        <div className="p-4 sm:p-6 min-w-0">
          <div
            id={SHEET_ID}
            data-testid="resource-print-sheet"
            className="resource-sheet min-w-0 bg-white mx-auto w-full max-w-[816px] shadow-md rounded-sm p-6 sm:p-10"
          >
            {Sheet && <Sheet />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
