import React, { useMemo, useState } from "react";
import { Mail, Sparkles, Trophy, StickyNote, Pencil, Check, X, Send, History, ChevronDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import DOMPurify from "dompurify";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { toast } from "sonner";
import { useClassroom } from "@/context/ClassroomContext";
import { DigestPreviewDialog, EditedBadge, weekLabel } from "@/components/dialogs/DigestPreviewDialog";
import { buildDigestSnapshot } from "@/lib/digest";
import { scheduleLabel, sentLabel } from "@/lib/digestSchedule";

const shortDT = (iso) => (iso ? format(new Date(iso), "EEE MMM d · h:mm a") : "—");

const DigestRow = ({ log, onEdit, onToggle }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(log.note || "");

  const commit = () => {
    onEdit(log.id, draft.trim());
    setEditing(false);
    toast.success("Note updated");
  };

  const cancel = () => {
    setDraft(log.note || "");
    setEditing(false);
  };

  return (
    <div
      data-testid={`digest-row-${log.id}`}
      className={`p-3 rounded-xl border transition-all ${
        log.includeInDigest ? "bg-white border-slate-200" : "bg-slate-50 border-slate-100 opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 border border-teal-200">
              {log.tag || log.type}
            </span>
            <span className="text-[10px] text-slate-500">{shortDT(log.timestamp)}</span>
          </div>
          {editing ? (
            <Textarea
              data-testid={`digest-edit-input-${log.id}`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              className="text-sm min-h-[60px]"
            />
          ) : (
            <p
              data-testid={`digest-note-text-${log.id}`}
              className="text-sm text-slate-800 leading-snug break-words"
            >
              {log.notePrivate ? <span className="italic text-slate-400">Private reflection (never sent)</span> : log.note || <span className="italic text-slate-400">No note</span>}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <Switch
            data-testid={`digest-toggle-${log.id}`}
            checked={log.includeInDigest === true}
            aria-label="Include in Digest"
            onCheckedChange={() => onToggle(log.id)}
            className="data-[state=checked]:bg-teal-600"
          />
          {editing ? (
            <div className="flex items-center gap-1">
              <button
                data-testid={`digest-edit-save-${log.id}`}
                onClick={commit}
                className="w-7 h-7 rounded-lg bg-teal-500 text-white hover:bg-teal-600 flex items-center justify-center"
              >
                <Check className="w-3.5 h-3.5" strokeWidth={3} />
              </button>
              <button
                data-testid={`digest-edit-cancel-${log.id}`}
                onClick={cancel}
                className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-rose-500 hover:border-rose-300 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              data-testid={`digest-edit-btn-${log.id}`}
              onClick={() => setEditing(true)}
              aria-label="Edit note"
              className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-teal-700 hover:border-teal-300 flex items-center justify-center"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const HistoryItem = ({ send }) => {
  const [open, setOpen] = useState(false);
  return (
    <li data-testid={`digest-history-item-${send.id}`} className="bg-white border border-slate-200 rounded-xl p-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
            {send.mode === "auto" ? "Auto-sent" : "Sent"}
          </span>
          <span className="text-[12px] text-slate-700">{sentLabel(send.sentAt)} · {send.entryIds.length} entr{send.entryIds.length === 1 ? "y" : "ies"}</span>
          {send.edited && <EditedBadge testid={`digest-history-edited-${send.id}`} />}
        </div>
        {send.html && (
          <button data-testid={`digest-history-view-${send.id}`} onClick={() => setOpen((o) => !o)} className="text-[12px] font-semibold text-teal-700 inline-flex items-center gap-1">
            {open ? "Hide email" : "View email"} <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>
      {open && (
        <div data-testid={`digest-history-html-${send.id}`} className="mt-3 border border-slate-100 rounded-lg p-3 bg-slate-50" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(send.html) }} />
      )}
    </li>
  );
};

const DigestHistory = ({ sends }) => (
  <div className="space-y-2" data-testid="digest-history">
    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1 flex items-center gap-1">
      <History className="w-3.5 h-3.5" /> Sent digest history
    </div>
    {sends.length === 0 ? (
      <p className="text-[12px] text-slate-500 px-1" data-testid="digest-history-empty">No digests sent yet.</p>
    ) : (
      <ul className="space-y-2">{sends.map((s) => <HistoryItem key={s.id} send={s} />)}</ul>
    )}
  </div>
);

export const ParentDigestTab = ({ student }) => {
  const { logs, skillsByStudent, iepGoalsByStudent, updateLog, toggleLogDigest, digestSettings, digestSends } = useClassroom();
  const snap = useMemo(
    () =>
      buildDigestSnapshot({
        student,
        logs,
        skills: skillsByStudent[student.id],
        iepGoals: iepGoalsByStudent[student.id],
        sentIds: new Set(digestSends.flatMap((s) => s.entryIds)),
      }),
    [student, logs, skillsByStudent, iepGoalsByStudent, digestSends]
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const sends = digestSends.filter((s) => s.studentId === student.id).slice().reverse();

  return (
    <section data-testid="parent-digest-tab" className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center">
              <Mail className="w-4 h-4 text-teal-700" />
            </span>
            <div>
              <h3
                className="text-base font-bold text-slate-900"
                style={{ fontFamily: "Outfit" }}
                data-testid="parent-digest-title"
              >
                Parent Digest Queue
              </h3>
              <p className="text-[11px] text-slate-500">
                {student.parentDigestEnabled === false
                  ? "Parent Digest is turned off for this student"
                  : `Weekly email · ${scheduleLabel(digestSettings)} to ${student.guardianEmail || "no guardian email"}`}
              </p>
            </div>
          </div>
          <Button
            data-testid="preview-digest-btn"
            onClick={() => setPreviewOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold h-9"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Preview Digest Email
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1 text-emerald-700">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Wins</span>
            </div>
            <div
              className="text-lg font-extrabold text-emerald-800 mt-0.5"
              style={{ fontFamily: "Fredoka" }}
              data-testid="digest-summary-wins"
            >
              {snap.wins.length}
            </div>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1 text-indigo-700">
              <Trophy className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Mastered</span>
            </div>
            <div
              className="text-lg font-extrabold text-indigo-800 mt-0.5"
              style={{ fontFamily: "Fredoka" }}
              data-testid="digest-summary-mastered"
            >
              {snap.mastered.length}
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1 text-amber-700">
              <StickyNote className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Queued</span>
            </div>
            <div
              className="text-lg font-extrabold text-amber-800 mt-0.5"
              style={{ fontFamily: "Fredoka" }}
              data-testid="digest-summary-queued"
            >
              {snap.queued.length}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2" data-testid="digest-notes-list">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
          This week's entries · {weekLabel(snap.week)}
        </div>
        {snap.weekLogs.length === 0 ? (
          <div
            data-testid="digest-empty-state"
            className="text-center py-8 px-4 bg-white border border-dashed border-slate-300 rounded-2xl"
          >
            <Mail className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">
              No entries logged this week yet
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Entries logged Monday–Friday appear here. Switch on "Include in Digest" to share one with the family.
            </p>
          </div>
        ) : (
          snap.weekLogs.map((log) => (
            <DigestRow
              key={log.id}
              log={log}
              onEdit={(id, note) => updateLog(id, { note })}
              onToggle={toggleLogDigest}
            />
          ))
        )}
      </div>

      <DigestHistory sends={sends} />

      <DigestPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        student={student}
        snapshot={snap}
      />
    </section>
  );
};
