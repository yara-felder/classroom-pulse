import React, { useEffect, useRef, useState } from "react";
import { Upload, X, ClipboardPaste, FileSpreadsheet } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { parsePastedNames, parseRosterCsv } from "@/lib/rosterImport";

const RosterPreview = ({ roster, setRoster, pending }) => {
  const total = roster.length + pending.length;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-slate-700">Preview</span>
        <span className="text-[11px] font-semibold text-slate-500" data-testid="roster-preview-count">
          {total} student{total === 1 ? "" : "s"}
        </span>
      </div>
      {total === 0 ? (
        <p className="text-xs text-slate-400 italic" data-testid="roster-preview-empty">No students yet. You can also skip and add them later.</p>
      ) : (
        <ul className="max-h-44 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl" data-testid="roster-preview-list">
          {roster.map((r, i) => (
            <li key={`saved-${r.firstName}-${i}`} className="flex items-center gap-2 px-3 py-1.5 text-sm" data-testid={`roster-preview-row-${i}`}>
              <span className="font-semibold text-slate-800 truncate">{`${r.firstName} ${r.lastName}`.trim()}</span>
              <span className="text-[11px] text-slate-500 truncate flex-1">
                {[r.grade, r.guardianEmail].filter(Boolean).join(" · ")}
              </span>
              <button
                type="button"
                onClick={() => setRoster((prev) => prev.filter((_, j) => j !== i))}
                className="text-slate-400 hover:text-rose-600"
                aria-label="Remove student"
                data-testid={`roster-preview-remove-${i}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
          {pending.map((r, i) => (
            <li key={`pending-${r.firstName}-${i}`} className="flex items-center gap-2 px-3 py-1.5 text-sm" data-testid={`roster-preview-pending-${i}`}>
              <span className="font-semibold text-slate-800 truncate">{`${r.firstName} ${r.lastName}`.trim()}</span>
              <span className="text-[11px] text-slate-400 flex-1">Added when you continue</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const ModeTab = ({ active, onClick, icon: Icon, label, testid }) => (
  <button
    type="button"
    onClick={onClick}
    data-testid={testid}
    className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg py-2 transition-colors ${
      active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
    }`}
  >
    <Icon className="w-3.5 h-3.5" /> {label}
  </button>
);

export const StepRoster = ({ roster, setRoster, flushRef }) => {
  const [mode, setMode] = useState("paste");
  const [text, setText] = useState("");
  const fileRef = useRef(null);

  const add = (rows, source) => {
    if (!rows.length) {
      toast.error("No student names found", { description: source === "csv" ? "Check the CSV columns." : "Put one name per line." });
      return;
    }
    setRoster((prev) => [...prev, ...rows]);
    toast.success(`${rows.length} student${rows.length === 1 ? "" : "s"} added to preview`);
  };

  useEffect(() => {
    if (!flushRef) return undefined;
    flushRef.current = () => {
      const rows = mode === "paste" ? parsePastedNames(text) : [];
      if (rows.length) setText("");
      return rows;
    };
    return () => {
      flushRef.current = () => [];
    };
  }, [flushRef, mode, text]);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => add(parseRosterCsv(String(reader.result || "")), "csv");
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-3" data-testid="onboarding-step-roster">
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
        <ModeTab active={mode === "paste"} onClick={() => setMode("paste")} icon={ClipboardPaste} label="Quick paste" testid="roster-mode-paste" />
        <ModeTab
          active={mode === "csv"}
          onClick={() => {
            const rows = parsePastedNames(text);
            if (rows.length) {
              setRoster((prev) => [...prev, ...rows]);
              setText("");
            }
            setMode("csv");
          }}
          icon={FileSpreadsheet}
          label="CSV import"
          testid="roster-mode-csv"
        />
      </div>

      {mode === "paste" ? (
        <div className="space-y-2">
          <Textarea
            data-testid="roster-paste-input"
            placeholder={"One student per line, e.g.\nMaya Lin\nLucas Rodriguez"}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[110px] text-sm"
          />
          <Button
            type="button"
            onClick={() => {
              add(parsePastedNames(text), "paste");
              setText("");
            }}
            disabled={!text.trim()}
            className="h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white"
            data-testid="roster-paste-add-btn"
          >
            Add names
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center space-y-2">
          <p className="text-xs text-slate-600">
            Columns: <b>first, last</b>, and optionally <b>grade, guardian name, guardian email</b>. A header row is detected automatically.
          </p>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} data-testid="roster-csv-input" />
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} className="h-8 text-xs" data-testid="roster-csv-upload-btn">
            <Upload className="w-3.5 h-3.5 mr-1.5" /> Choose CSV file
          </Button>
        </div>
      )}

      <RosterPreview roster={roster} setRoster={setRoster} pending={mode === "paste" ? parsePastedNames(text) : []} />
    </div>
  );
};
