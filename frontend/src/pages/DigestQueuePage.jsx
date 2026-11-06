import React, { useMemo, useState } from "react";
import { Mail, Settings, CalendarClock, Eye, Send, Sparkles, StickyNote, Trophy, CheckCircle2, BellOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClassroom } from "@/context/ClassroomContext";
import { useAuth } from "@/context/AuthContext";
import { buildDigestSnapshot } from "@/lib/digest";
import { scheduleLabel, sentLabel, nextScheduledAt } from "@/lib/digestSchedule";
import { DigestPreviewDialog, useDigestSend, EditedBadge } from "@/components/dialogs/DigestPreviewDialog";
import { buildOriginalDraft, isDraftEdited, mergeDraft } from "@/lib/digestDraft";
import { AppSettingsDialog } from "@/components/dialogs/AppSettingsDialog";
import { format } from "date-fns";
import { RestrictedNotice } from "@/components/RestrictedNotice";

const Stat = ({ icon: Icon, tone, value, label }) => (
  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${tone}`}>
    <Icon className="w-3 h-3" /> {value} {label}
  </span>
);

const ScheduleBanner = ({ settings, totalQueued, onSettings }) => {
  const review = settings.approvalMode === "review";
  return (
    <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4" data-testid="digest-schedule-banner">
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center shrink-0">
          <CalendarClock className="w-5 h-5 text-teal-300" />
        </span>
        <div>
          <p className="text-lg font-bold" style={{ fontFamily: "Outfit" }} data-testid="digest-schedule-label">
            Scheduled for {scheduleLabel(settings)}
          </p>
          <p className="text-xs text-slate-300">
            Next send {format(nextScheduledAt(settings), "EEE, MMM d · h:mm a")} ·{" "}
            <span className="font-semibold text-teal-300" data-testid="digest-mode-label">
              {review ? "Require Teacher Approval" : "Automatic Send"}
            </span>{" "}
            · {totalQueued} entr{totalQueued === 1 ? "y" : "ies"} queued
          </p>
        </div>
      </div>
      <Button onClick={onSettings} variant="secondary" className="h-9 text-xs font-semibold" data-testid="digest-open-settings-btn">
        <Settings className="w-3.5 h-3.5 mr-1.5" /> Digest Settings
      </Button>
    </div>
  );
};

const StudentDigestCard = ({ student, snap, lastSend, review, onPreview }) => {
  const send = useDigestSend();
  const { digestDrafts, digestSettings } = useClassroom();
  const off = student.parentDigestEnabled === false;
  const draft = digestDrafts[student.id];
  const original = buildOriginalDraft(student, snap, digestSettings);
  const edited = draft && isDraftEdited(mergeDraft(original, draft), original);
  return (
    <div className={`bg-white border rounded-2xl p-4 ${off ? "border-slate-100 opacity-60" : "border-slate-200"}`} data-testid={`digest-queue-card-${student.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
          <div className="min-w-0">
            <p className="font-bold text-slate-900 truncate" style={{ fontFamily: "Outfit" }}>{student.name}</p>
            <p className="text-[11px] text-slate-500 truncate" data-testid={`digest-queue-guardian-${student.id}`}>
              {student.guardianEmail ? `${student.guardianName || "Guardian"} · ${student.guardianEmail}` : (
                <span className="text-rose-600 font-semibold inline-flex items-center gap-1"><AlertCircle className="w-3 h-3" /> No guardian email</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
        {off ? (
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 inline-flex items-center gap-1 shrink-0"><BellOff className="w-3 h-3" /> Digest off</span>
        ) : lastSend ? (
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 inline-flex items-center gap-1 shrink-0" data-testid={`digest-queue-sent-${student.id}`}>
            <CheckCircle2 className="w-3 h-3" /> {lastSend.mode === "auto" ? "Auto-sent" : "Sent"} {sentLabel(lastSend.sentAt)}
          </span>
        ) : null}
        {edited && <EditedBadge testid={`digest-queue-edited-${student.id}`} />}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">
        <Stat icon={Sparkles} tone="bg-emerald-50 text-emerald-700" value={snap.wins.length} label={snap.wins.length === 1 ? "win" : "wins"} />
        <Stat icon={StickyNote} tone="bg-amber-50 text-amber-700" value={snap.supportNotes.length} label={snap.supportNotes.length === 1 ? "note" : "notes"} />
        <Stat icon={Trophy} tone="bg-indigo-50 text-indigo-700" value={snap.mastered.length} label="mastered" />
      </div>
      {snap.queued.length > 0 && (
        <ul className="mt-3 space-y-1.5" data-testid={`digest-queue-entries-${student.id}`}>
          {snap.queued.map((l) => (
            <li key={l.id} className="text-[12px] text-slate-700 flex gap-2">
              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 h-fit ${l.type === "positive" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{l.type}</span>
              <span className="min-w-0 break-words"><b>{l.tag}</b>{l.note ? ` · ${l.note}` : ""}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2 mt-4">
        <Button variant="outline" onClick={onPreview} className="h-8 text-xs flex-1" data-testid={`digest-queue-preview-btn-${student.id}`}>
          <Eye className="w-3.5 h-3.5 mr-1.5" /> Email Preview
        </Button>
        <Button
          onClick={() => send(student, snap)}
          disabled={off || snap.queued.length === 0}
          className="h-8 text-xs flex-1 bg-teal-600 hover:bg-teal-700 text-white"
          data-testid={`digest-queue-send-btn-${student.id}`}
        >
          <Send className="w-3.5 h-3.5 mr-1.5" /> {review ? "Approve & Send" : "Send Now"}
        </Button>
      </div>
    </div>
  );
};

export default function DigestQueuePage() {
  const { students, logs, classSection, skillsByStudent, iepGoalsByStudent, digestSettings, digestSends, can, role } = useClassroom();
  const { user } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [previewId, setPreviewId] = useState(null);
  const periodName = (user?.periods || []).find((p) => p.id === classSection)?.name || "";

  const rows = useMemo(() => {
    const sentIds = new Set(digestSends.flatMap((s) => s.entryIds));
    return students
      .filter((s) => (s.periodIds || []).includes(classSection))
      .map((s) => ({
        student: s,
        snap: buildDigestSnapshot({ student: s, logs, skills: skillsByStudent[s.id], iepGoals: iepGoalsByStudent[s.id], sentIds }),
        lastSend: [...digestSends].reverse().find((d) => d.studentId === s.id),
      }))
      .sort((a, b) => b.snap.queued.length - a.snap.queued.length || a.student.name.localeCompare(b.student.name));
  }, [students, logs, classSection, skillsByStudent, iepGoalsByStudent, digestSends]);

  if (!can("digest")) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6" data-testid="digest-queue-page">
        <RestrictedNotice role={role} title="Parent Digest is managed by the classroom teacher" body="Family communications and queued notes aren't available for your role." testid="digest-restricted" />
      </div>
    );
  }
  const totalQueued = rows.reduce((n, r) => n + (r.student.parentDigestEnabled === false ? 0 : r.snap.queued.length), 0);
  const preview = rows.find((r) => r.student.id === previewId);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5" data-testid="digest-queue-page">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 flex items-center gap-2" style={{ fontFamily: "Outfit" }}>
          <Mail className="w-7 h-7 text-teal-600" /> Parent Digest Queue
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          This week's parent-tagged entries{periodName ? ` for ${periodName}` : ""}, grouped by student.
        </p>
      </div>
      <ScheduleBanner settings={digestSettings} totalQueued={totalQueued} onSettings={() => setSettingsOpen(true)} />
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-10" data-testid="digest-queue-empty">No students in this period yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="digest-queue-list">
          {rows.map((r) => (
            <StudentDigestCard
              key={r.student.id}
              {...r}
              review={digestSettings.approvalMode === "review"}
              onPreview={() => setPreviewId(r.student.id)}
            />
          ))}
        </div>
      )}
      <AppSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <DigestPreviewDialog
        open={!!preview}
        onOpenChange={(o) => !o && setPreviewId(null)}
        student={preview?.student}
        snapshot={preview?.snap}
      />
    </div>
  );
}
