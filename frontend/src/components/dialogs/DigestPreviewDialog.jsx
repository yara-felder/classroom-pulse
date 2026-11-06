import React, { useEffect, useMemo, useState } from "react";
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
import { Mail, Sparkles, Trophy, StickyNote, Send, RotateCcw, Save, PenLine, Lightbulb, ListChecks } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { toast } from "sonner";
import { useClassroom } from "@/context/ClassroomContext";
import { scheduleLabel, sentLabel } from "@/lib/digestSchedule";
import { FERPA_NOTICE } from "@/lib/ferpa";
import { DEFAULT_FOOTER, buildOriginalDraft, compileDigestHtml, diffOverrides, firstNameOf, isDraftEdited, mergeDraft, salutationFor } from "@/lib/digestDraft";

export const weekLabel = (week) => `${format(week.start, "EEE MMM d")} – ${format(week.end, "EEE MMM d")}`;

export const EditedBadge = ({ testid }) => (
  <span data-testid={testid} className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50 border border-violet-200 rounded-full px-2 py-0.5">
    <PenLine className="w-3 h-3" /> Edited by Teacher
  </span>
);

const Field = ({ icon: Icon, tone, title, value, onChange, testid, placeholder, className = "" }) => (
  <section data-testid={`${testid}-section`} className={className}>
    <div className="flex items-center gap-2 mb-1.5">
      {Icon && <Icon className={`w-4 h-4 ${tone}`} />}
      <h3 className="text-sm font-bold text-slate-900" style={{ fontFamily: "Outfit" }}>{title}</h3>
    </div>
    <Textarea
      data-testid={testid}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      rows={Math.max(2, value.split("\n").length + 1)}
      className="text-[13px] leading-relaxed text-slate-700 bg-white border-dashed border-slate-300 focus-visible:border-solid resize-y"
    />
  </section>
);

export const useDigestSend = () => {
  const { sendDigest, digestDrafts, digestSettings, persistLive } = useClassroom();
  return async (student, snapshot, fields) => {
    if (!student.guardianEmail) {
      toast.error("Add a guardian email first", { description: "Edit the student to add one." });
      return false;
    }
    if (snapshot.queued.length === 0) {
      toast.error("Nothing queued to send this week");
      return false;
    }
    const original = buildOriginalDraft(student, snapshot, digestSettings);
    const draft = fields || mergeDraft(original, digestDrafts[student.id]);
    const html = compileDigestHtml({ student, draft, footer: digestSettings.footer || DEFAULT_FOOTER, ferpa: FERPA_NOTICE });
    try {
      await sendDigest(student.id, snapshot.queued.map((l) => l.id), "manual", html, isDraftEdited(draft, original));
      toast.success(`Digest sent to ${student.guardianEmail}`, {
        description: persistLive
          ? `${snapshot.wins.length} win(s), ${snapshot.supportNotes.length} note(s), ${snapshot.mastered.length} mastered`
          : `${snapshot.wins.length} win(s), ${snapshot.supportNotes.length} note(s), ${snapshot.mastered.length} mastered · demo mode, no real email sent`,
      });
      return true;
    } catch (err) {
      toast.error(err.message || "Couldn't send digest");
      return false;
    }
  };
};

const EmailMeta = ({ student, firstName }) => (
  <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 space-y-0.5">
    <div>
      <span className="font-bold text-slate-500">From:</span>{" "}
      {process.env.REACT_APP_DIGEST_FROM_EMAIL || "Classroom Pulse"}
    </div>
    <div data-testid="digest-preview-to">
      <span className="font-bold text-slate-500">To:</span>{" "}
      {student.guardianEmail ? (
        <>{student.guardianName || "Guardian"} &lt;{student.guardianEmail}&gt;</>
      ) : (
        <span className="text-rose-600 font-semibold">No guardian email on file</span>
      )}
    </div>
    <div><span className="font-bold text-slate-500">Subject:</span> This week with {firstName}: celebrations & notes</div>
  </div>
);

const WeekEntries = ({ logs, onToggle }) => (
  <section data-testid="digest-week-entries" className="mx-6 mb-4 border border-slate-200 rounded-2xl p-4 bg-slate-50">
    <div className="flex items-center gap-2 mb-2">
      <ListChecks className="w-4 h-4 text-teal-600" />
      <h3 className="text-sm font-bold text-slate-900" style={{ fontFamily: "Outfit" }}>This week's log entries</h3>
      <span className="text-[10px] text-slate-500">Only checked items go to the family</span>
    </div>
    {logs.length === 0 ? (
      <p className="text-[12px] text-slate-500" data-testid="digest-week-entries-empty">No entries logged Monday–Friday yet.</p>
    ) : (
      <ul className="space-y-1.5 max-h-48 overflow-y-auto">
        {logs.map((l) => (
          <li key={l.id} className="flex items-start gap-2 text-[12px] text-slate-700">
            <Checkbox id={`inc-${l.id}`} data-testid={`digest-include-${l.id}`} checked={l.includeInDigest === true} onCheckedChange={() => onToggle(l.id)} className="mt-0.5" />
            <label htmlFor={`inc-${l.id}`} className="min-w-0 break-words cursor-pointer">
              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mr-1 ${l.type === "positive" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{l.type}</span>
              <b>{format(new Date(l.timestamp), "EEE")}</b> · {l.tag}
              {l.notePrivate ? <span className="italic text-slate-400"> · private reflection (never sent)</span> : l.note ? ` · ${l.note}` : ""}
            </label>
          </li>
        ))}
      </ul>
    )}
  </section>
);

export const DigestPreviewDialog = ({ open, onOpenChange, student, snapshot }) => {
  const { digestSettings, digestSends, digestDrafts, saveDigestDraft, clearDigestDraft, markChecklist, toggleLogDigest } = useClassroom();
  const send = useDigestSend();
  const original = useMemo(
    () => (student && snapshot ? buildOriginalDraft(student, snapshot, digestSettings) : null),
    [student, snapshot, digestSettings]
  );
  const [overrides, setOverrides] = useState({});

  useEffect(() => {
    if (open && student) {
      markChecklist("digest");
      setOverrides(digestDrafts[student.id]?.overrides || {});
    }
  }, [open, student?.id]); // eslint-disable-line react-hooks/exhaustive-deps -- load saved overrides only when the modal opens for a student

  if (!student || !snapshot || !original) return null;
  const fields = { ...original, ...overrides };
  const persist = (next) => {
    setOverrides(next);
    if (Object.keys(next).length) saveDigestDraft(student.id, next, snapshot.week.start.toISOString());
    else clearDigestDraft(student.id);
  };
  const set = (k) => (v) => persist(diffOverrides({ ...fields, [k]: v }, original));
  const edited = isDraftEdited(fields, original);
  const firstName = firstNameOf(student);
  const lastSend = [...digestSends].reverse().find((s) => s.studentId === student.id);
  const review = digestSettings.approvalMode === "review";
  const disabled = student.parentDigestEnabled === false;
  const empty = snapshot.queued.length === 0;

  const reset = () => {
    persist({});
    toast.success("Restored the original draft");
  };
  const save = () => {
    persist(diffOverrides(fields, original));
    toast.success(edited ? "Edits saved" : "No edits to save", { description: edited ? `Kept for ${firstName}'s digest as new entries come in this week.` : undefined });
  };
  const handleSend = async () => {
    if (await send(student, snapshot, fields)) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="modal-digest-preview" className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="flex items-center gap-2 flex-wrap" style={{ fontFamily: "Outfit" }}>
            <span className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
              <Mail className="w-4 h-4 text-teal-700" />
            </span>
            Email Preview
            {edited && <EditedBadge testid="digest-preview-edited-badge" />}
          </DialogTitle>
          <DialogDescription data-testid="digest-preview-schedule">
            Week of {weekLabel(snapshot.week)} · Scheduled for {scheduleLabel(digestSettings)} · {review ? "needs your approval" : "sends automatically"}
            {lastSend ? ` · last sent ${sentLabel(lastSend.sentAt)}` : ""}. Click any text below to edit it.
          </DialogDescription>
        </DialogHeader>

        <div className="h-4" />
        <WeekEntries logs={snapshot.weekLogs} onToggle={toggleLogDigest} />
        <div className="mx-6 my-4 border border-slate-200 rounded-2xl overflow-hidden bg-white">
          <EmailMeta student={student} firstName={firstName} />
          <div className="p-5 space-y-4">
            <Field icon={PenLine} tone="text-violet-600" title="Teacher Personal Note" value={fields.personalNote} onChange={set("personalNote")}
              testid="digest-edit-personal-note" placeholder="Add a personal message for this family (optional, left out of the email if empty)" className="rounded-xl bg-violet-50/50 p-3 -mx-1" />
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 mb-1.5" style={{ fontFamily: "Outfit" }} data-testid="digest-preview-salutation">
                {salutationFor(student)}
              </h2>
              <Textarea data-testid="digest-edit-intro" value={fields.intro} onChange={(e) => set("intro")(e.target.value)} rows={3}
                className="text-sm leading-relaxed text-slate-700 border-dashed border-slate-300 focus-visible:border-solid resize-y" />
            </div>
            <Field icon={Sparkles} tone="text-emerald-600" title="Celebrations" value={fields.celebrations} onChange={set("celebrations")} testid="digest-edit-celebrations" />
            <Field icon={Trophy} tone="text-indigo-600" title="Mastered skill highlights" value={fields.mastered} onChange={set("mastered")} testid="digest-edit-mastered" />
            <Field icon={StickyNote} tone="text-amber-600" title="Support notes" value={fields.support} onChange={set("support")} testid="digest-edit-support" />
            <Field icon={Lightbulb} tone="text-amber-600" title="Parent Connection" value={fields.homeConnection} onChange={set("homeConnection")}
              testid="digest-edit-home-connection" className="rounded-xl bg-amber-50 border border-amber-200 p-3" />
            <div data-testid="digest-preview-footer" className="pt-2 border-t border-slate-100 text-[12px] text-slate-500 leading-relaxed space-y-1">
              {(digestSettings.footer || DEFAULT_FOOTER).split(/\n+/).map((p, i) => <p key={`${i}-${p}`}>{p}</p>)}
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed" data-testid="digest-preview-ferpa">{FERPA_NOTICE}</p>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 gap-2 flex-wrap sm:justify-between">
          <Button variant="ghost" onClick={reset} disabled={!edited} data-testid="digest-reset-draft-btn" className="text-slate-600">
            <RotateCcw className="w-4 h-4 mr-1.5" /> Reset to Original Draft
          </Button>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={save} data-testid="digest-save-edits-btn">
              <Save className="w-4 h-4 mr-1.5" /> Save Edits
            </Button>
            <Button data-testid="digest-preview-send-btn" onClick={handleSend} disabled={disabled || empty} className="bg-teal-600 hover:bg-teal-700 text-white">
              <Send className="w-4 h-4 mr-1.5" />
              {disabled ? "Digest turned off" : empty ? "Nothing queued" : review ? "Approve & Send Now" : "Send Now"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
