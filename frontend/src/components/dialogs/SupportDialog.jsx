import React, { useState, useEffect } from "react";
import { AlertTriangle, ChevronDown, Heart, Mail, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useClassroom } from "@/context/ClassroomContext";
import { SUPPORT_TAGS } from "@/data/mockData";
import {
  SUPPORT_CONTEXT_GROUPS,
  cleanSupportContext,
  contextStateFromLog,
  dateFromTimeInput,
  emptySupportContext,
  timeInputValue,
} from "@/data/supportContext";
import { timeBlockLabel } from "@/lib/schoolAnalytics";
import { ActionChip } from "@/components/dialogs/ActionChip";
import { PrivateToggle } from "@/components/dialogs/ReflectionNote";

export const SupportDialog = ({ open, onOpenChange, student, log = null }) => {
  const { addSupport, updateLog } = useClassroom();
  const [selectedIds, setSelectedIds] = useState([]);
  const [note, setNote] = useState("");
  const [notePrivate, setNotePrivate] = useState(false);
  const [notifyParent, setNotifyParent] = useState(false);
  const [logTime, setLogTime] = useState(() => timeInputValue());
  const [contextOpen, setContextOpen] = useState(false);
  const [context, setContext] = useState(emptySupportContext);
  const [otherOpen, setOtherOpen] = useState({});

  const hasPlan = !!(student?.iep || student?.plan504);

  useEffect(() => {
    if (!open) return;
    const saved = log ? contextStateFromLog(log) : { context: emptySupportContext(), otherOpen: {} };
    const when = log?.timestamp ? new Date(log.timestamp) : new Date();
    const matched = log
      ? SUPPORT_TAGS.filter((tag) => tag.label === log.tag || tag.title === log.tag).map((tag) => tag.id)
      : [];
    setSelectedIds(matched);
    setNote(log?.note || "");
    setNotePrivate(!!log?.notePrivate);
    setNotifyParent(!!(log?.notifyParent || log?.includeInDigest));
    setLogTime(timeInputValue(Number.isNaN(when.getTime()) ? new Date() : when));
    setContext(saved.context);
    setOtherOpen(saved.otherOpen);
    setContextOpen(hasPlan || Object.values(saved.context).some(Boolean));
  }, [open, hasPlan, log]);

  const toggle = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const selectedTags = SUPPORT_TAGS.filter((t) => selectedIds.includes(t.id));

  const handleSubmit = () => {
    if (selectedIds.length === 0) {
      toast.error("Pick at least one support cue.");
      return;
    }
    const when = dateFromTimeInput(logTime);
    const savedContext = cleanSupportContext(context);
    const payload = {
      notifyParent,
      notePrivate,
      timestamp: when.toISOString(),
      context: savedContext,
    };
    if (log?.id) {
      updateLog(log.id, {
        tag: selectedTags[0].label,
        note,
        notePrivate: !!(note && notePrivate),
        notifyParent: !!notifyParent,
        includeInDigest: !!notifyParent,
        timestamp: payload.timestamp,
        logDate: when.toLocaleDateString("en-CA"),
        context: savedContext,
      });
      selectedTags.slice(1).forEach((tag) => addSupport(student.id, tag.label, note, payload));
    } else {
      selectedTags.forEach((tag) => addSupport(student.id, tag.label, note, payload));
    }
    toast(`Support noted — ${student.name}`, {
      description: `${selectedIds.length} cue${selectedIds.length === 1 ? "" : "s"}${
        notifyParent ? " · queued for parent digest" : ""
      }`,
      duration: 3500,
    });
    onOpenChange(false);
  };

  const count = selectedIds.length;
  const when = dateFromTimeInput(logTime);
  const block = timeBlockLabel(when.toISOString());

  const pickContext = (groupId, option) => {
    setOtherOpen((prev) => ({ ...prev, [groupId]: false }));
    setContext((prev) => ({ ...prev, [groupId]: prev[groupId] === option ? "" : option }));
  };

  const toggleOther = (group) => {
    setOtherOpen((prev) => {
      const next = !prev[group.id];
      setContext((current) => ({
        ...current,
        [group.id]: next && !group.options.includes(current[group.id]) ? current[group.id] : "",
      }));
      return { ...prev, [group.id]: next };
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="modal-needs-support-dialog"
        className="sm:max-w-[480px] max-h-[92vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2" style={{ fontFamily: "Outfit" }}>
            <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </span>
            <span>Needs Support · {student.name}</span>
            <input
              type="time"
              aria-label="Time this happened"
              data-testid="support-log-time"
              value={logTime}
              onChange={(event) => setLogTime(event.target.value)}
              className="h-8 rounded-lg border border-amber-200 bg-amber-50 px-2 text-sm font-bold text-amber-950"
            />
            <span className="text-xs font-semibold text-slate-500" data-testid="support-log-block">
              {block}
            </span>
          </DialogTitle>
          <DialogDescription>
            Tap every cue you noticed. Change the time if you are logging it after class.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2" data-testid="support-cues-grid">
          {SUPPORT_TAGS.map((tag) => (
            <ActionChip
              key={tag.id}
              item={tag}
              tone="amber"
              active={selectedIds.includes(tag.id)}
              onToggle={() => toggle(tag.id)}
              testid={`support-option-${tag.id}`}
              checkTestid={`support-check-${tag.id}`}
            />
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70" data-testid="support-context-section">
          <button
            type="button"
            onClick={() => setContextOpen((open) => !open)}
            aria-expanded={contextOpen}
            data-testid="support-context-toggle"
            className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left"
          >
            <span className="text-xs font-bold text-slate-700">More context (optional)</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${contextOpen ? "rotate-180" : ""}`} />
          </button>
          {contextOpen && (
            <div className="px-3 pb-3 space-y-3" data-testid="support-context-pills">
              {SUPPORT_CONTEXT_GROUPS.map((group) => (
                <div key={group.id}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">{group.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.options.map((option) => {
                      const active = !otherOpen[group.id] && context[group.id] === option;
                      const slug = option.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                      return (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={active}
                          onClick={() => pickContext(group.id, option)}
                          data-testid={`support-context-${group.id}-${slug}`}
                          className={`text-xs font-semibold rounded-full border px-2.5 py-1 transition-colors ${
                            active
                              ? "bg-slate-700 text-white border-slate-700"
                              : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                    {group.allowOther && (
                      <button
                        type="button"
                        aria-pressed={!!otherOpen[group.id]}
                        onClick={() => toggleOther(group)}
                        data-testid={`support-context-${group.id}-other`}
                        className={`inline-flex items-center gap-0.5 text-xs font-semibold rounded-full border px-2.5 py-1 transition-colors ${
                          otherOpen[group.id]
                            ? "bg-slate-700 text-white border-slate-700"
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                        }`}
                      >
                        <Plus className="w-3 h-3" strokeWidth={2.6} /> Other
                      </button>
                    )}
                  </div>
                  {group.allowOther && otherOpen[group.id] && (
                    <input
                      type="text"
                      value={group.options.includes(context[group.id]) ? "" : context[group.id]}
                      onChange={(event) => setContext((prev) => ({ ...prev, [group.id]: event.target.value }))}
                      placeholder={group.otherPlaceholder}
                      aria-label={group.otherPlaceholder}
                      data-testid={`support-context-${group.id}-other-input`}
                      className="mt-1.5 h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 placeholder:text-slate-400"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedTags.length > 0 && (
          <div className="mt-1 space-y-1.5" data-testid="support-suggestions-stack">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Suggested response · {selectedTags.length} cue{selectedTags.length === 1 ? "" : "s"}
            </div>
            {selectedTags.map((t) => (
              <div
                key={t.id}
                data-testid={`support-suggestion-${t.id}`}
                className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex gap-2"
              >
                <Heart className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-800 leading-relaxed">
                  <span className="font-bold">{t.title}:</span> {t.suggestion}
                </p>
              </div>
            ))}
          </div>
        )}

        <Textarea
          data-testid="support-note-textarea"
          placeholder="Optional note (e.g., 'redirected during read-aloud')..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="min-h-[72px] resize-none"
        />
        <PrivateToggle prefix="support" checked={notePrivate} onChange={setNotePrivate} />

        <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <Checkbox
            id="support-notify-parent"
            checked={notifyParent}
            onCheckedChange={setNotifyParent}
            data-testid="support-notify-parent-checkbox"
          />
          <label
            htmlFor="support-notify-parent"
            className="text-sm text-slate-700 font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 text-slate-500" />
            Include in Digest
          </label>
        </div>

        <DialogFooter className="mt-1 flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="cancel-support-btn"
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            data-testid="submit-support-btn"
            onClick={handleSubmit}
            disabled={count === 0}
            className="w-full sm:flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold shadow-sm"
          >
            <span data-testid="submit-support-btn-label">
              {count === 0
                ? "Select at least one cue"
                : log?.id
                ? "Save support"
                : `Log ${count} Support Cue${count === 1 ? "" : "s"}`}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
