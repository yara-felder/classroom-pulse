import React, { useState, useMemo, useEffect } from "react";
import { CalendarDays, FileText, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, subDays, startOfQuarter, endOfQuarter } from "date-fns";
import { useClassroom } from "@/context/ClassroomContext";

const PRESETS = [
  { id: "past-7", label: "Past 7 Days" },
  { id: "past-30", label: "Past 30 Days" },
  { id: "quarter", label: "Current Quarter" },
  { id: "custom", label: "Custom Range" },
];

const isoDate = (d) => format(d, "yyyy-MM-dd");

const rangeForPreset = (id) => {
  const now = new Date();
  if (id === "past-7") return { start: subDays(now, 7), end: now };
  if (id === "quarter") return { start: startOfQuarter(now), end: endOfQuarter(now) };
  if (id === "past-30" || id === "custom") return { start: subDays(now, 30), end: now };
  return { start: subDays(now, 30), end: now };
};

export const PdfExportDialog = ({ open, onOpenChange, student, onExport }) => {
  const { logs, skillsByStudent } = useClassroom();
  const [preset, setPreset] = useState("past-30");
  const [startDate, setStartDate] = useState(isoDate(subDays(new Date(), 30)));
  const [endDate, setEndDate] = useState(isoDate(new Date()));

  useEffect(() => {
    if (!open) return;
    setPreset("past-30");
    const { start, end } = rangeForPreset("past-30");
    setStartDate(isoDate(start));
    setEndDate(isoDate(end));
  }, [open]);

  const applyPreset = (id) => {
    setPreset(id);
    if (id === "custom") return; // keep current inputs, user edits manually
    const { start, end } = rangeForPreset(id);
    setStartDate(isoDate(start));
    setEndDate(isoDate(end));
  };

  const handleStartChange = (v) => {
    setStartDate(v);
    setPreset("custom");
  };
  const handleEndChange = (v) => {
    setEndDate(v);
    setPreset("custom");
  };

  const invalidRange = useMemo(() => {
    if (!startDate || !endDate) return true;
    return new Date(startDate) > new Date(endDate);
  }, [startDate, endDate]);

  const { behaviorCount, trialCount, total } = useMemo(() => {
    if (!student || invalidRange) return { behaviorCount: 0, trialCount: 0, total: 0 };
    const s = new Date(`${startDate}T00:00:00`);
    const e = new Date(`${endDate}T23:59:59`);
    const studentLogs = logs.filter((l) => l.studentId === student.id);
    const bh = studentLogs.filter((l) => {
      const t = new Date(l.timestamp);
      return t >= s && t <= e;
    }).length;
    const today = new Date();
    const todayInRange = today >= s && today <= e;
    const tr = todayInRange
      ? (skillsByStudent[student.id] || []).reduce(
          (sum, sk) => sum + (sk.trials || []).filter((t) => t !== null).length,
          0
        )
      : 0;
    return { behaviorCount: bh, trialCount: tr, total: bh + tr };
  }, [logs, skillsByStudent, student, startDate, endDate, invalidRange]);

  const noData = !invalidRange && total === 0;
  const canExport = !invalidRange && !noData;

  const handleExport = () => {
    if (!canExport) return;
    const s = new Date(`${startDate}T00:00:00`);
    const e = new Date(`${endDate}T23:59:59`);
    onExport({
      startDate: s,
      endDate: e,
      rangeLabel: `${format(s, "MMM d, yyyy")} – ${format(e, "MMM d, yyyy")}`,
    });
    onOpenChange(false);
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="modal-pdf-export-dialog"
        className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ fontFamily: "Outfit" }}>
            <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </span>
            Export History Report
          </DialogTitle>
          <DialogDescription>
            Pick a date range. Only logs and trials within the range are included.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs font-semibold">Quick Filters</Label>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5" data-testid="pdf-preset-grid">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  data-testid={`pdf-preset-${p.id}`}
                  onClick={() => applyPreset(p.id)}
                  className={`text-xs font-semibold rounded-lg border px-3 py-2 transition-all ${
                    preset === p.id
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pdf-start" className="text-xs font-semibold flex items-center gap-1">
                <CalendarDays className="w-3 h-3" /> Start Date
              </Label>
              <Input
                id="pdf-start"
                data-testid="pdf-start-date"
                type="date"
                value={startDate}
                onChange={(e) => handleStartChange(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="pdf-end" className="text-xs font-semibold flex items-center gap-1">
                <CalendarDays className="w-3 h-3" /> End Date
              </Label>
              <Input
                id="pdf-end"
                data-testid="pdf-end-date"
                type="date"
                value={endDate}
                onChange={(e) => handleEndChange(e.target.value)}
              />
            </div>
          </div>

          {invalidRange ? (
            <div
              data-testid="pdf-invalid-range-alert"
              className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              Start date must be on or before end date.
            </div>
          ) : noData ? (
            <div
              data-testid="pdf-no-data-alert"
              className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              No logs recorded for the selected dates. Pick a different range or log new activity.
            </div>
          ) : (
            <div
              data-testid="pdf-range-summary"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold"
            >
              <span>Records in range</span>
              <span>
                {behaviorCount} behavior · {trialCount} trials · {total} total
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="cancel-pdf-export-btn"
          >
            Cancel
          </Button>
          <Button
            data-testid="confirm-pdf-export-btn"
            onClick={handleExport}
            disabled={!canExport}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold disabled:bg-slate-200 disabled:text-slate-400"
          >
            <FileText className="w-4 h-4 mr-1.5" />
            Download Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
