import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useClassroom } from "@/context/ClassroomContext";
import { PositiveDialog } from "@/components/dialogs/PositiveDialog";
import { SupportDialog } from "@/components/dialogs/SupportDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { contextTags, formatLogTime } from "@/data/supportContext";
import { localCalendarDate } from "@/lib/db";
import { logCalendarDate, weekdayBounds } from "@/lib/pointCycle";
import { isAssignedCaseload, visibleNote } from "@/lib/rbac";
import { timeBlockLabel } from "@/lib/schoolAnalytics";

const TYPE_FILTERS = [
  { id: "all", label: "All Logs" },
  { id: "positive", label: "Positive" },
  { id: "support", label: "Needs Support" },
];

const RANGE_FILTERS = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "all", label: "All Time" },
];

const pillClass = (active, tone) => {
  if (!active) return "bg-white text-slate-600 border-slate-200 hover:border-slate-300";
  if (tone === "emerald") return "bg-emerald-600 text-white border-emerald-600";
  if (tone === "amber") return "bg-amber-500 text-white border-amber-500";
  return "bg-slate-900 text-white border-slate-900";
};

const formatLogDate = (timestamp) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "EEE, MMM d, yyyy");
};

export const ActivityLog = ({ students }) => {
  const { logs, role, deleteLog } = useClassroom();
  const { user } = useAuth();
  const [typeFilter, setTypeFilter] = useState("all");
  const [rangeFilter, setRangeFilter] = useState("week");
  const [studentId, setStudentId] = useState("all");
  const [query, setQuery] = useState("");
  const [editingLog, setEditingLog] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const roster = useMemo(
    () => [...students].sort((a, b) => a.name.localeCompare(b.name)),
    [students]
  );
  const byId = useMemo(() => new Map(roster.map((student) => [student.id, student])), [roster]);
  const search = query.trim().toLowerCase();
  const studentOptions = roster.filter((student) => !search || student.name.toLowerCase().includes(search));

  const rows = useMemo(() => {
    const today = localCalendarDate();
    const week = weekdayBounds(0);
    return logs
      .filter((log) => log.type === "positive" || log.type === "support")
      .filter((log) => byId.has(log.studentId))
      .filter((log) => {
        const student = byId.get(log.studentId);
        if (role === "case_manager" && isAssignedCaseload(student) && log.notePrivate) return false;
        return true;
      })
      .filter((log) => typeFilter === "all" || log.type === typeFilter)
      .filter((log) => studentId === "all" || log.studentId === studentId)
      .filter((log) => {
        if (!search) return true;
        return (byId.get(log.studentId)?.name || "").toLowerCase().includes(search);
      })
      .filter((log) => {
        if (rangeFilter === "all") return true;
        const day = logCalendarDate(log);
        if (rangeFilter === "today") return day === today;
        return day >= week.startIso && day <= week.endIso;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [logs, byId, role, typeFilter, studentId, search, rangeFilter]);

  const editingStudent = editingLog ? byId.get(editingLog.studentId) : null;
  const ownsLog = (log, student) => {
    if (!user?.id || !log?.ownerId || log.ownerId !== user.id) return false;
    if (role === "case_manager" && isAssignedCaseload(student)) return false;
    return true;
  };

  return (
    <section className="mt-5 bg-white border border-slate-200 rounded-2xl p-5" data-testid="activity-log">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: "Outfit" }}>
          Activity Log
        </h3>
        <p className="text-[11px] text-slate-500 font-medium">
          Positive moments and support notes you can see. Edit and delete stay with the person who wrote the log.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5" data-testid="activity-log-type-filters">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              aria-pressed={typeFilter === filter.id}
              data-testid={`activity-log-type-${filter.id}`}
              onClick={() => setTypeFilter(filter.id)}
              className={`px-3 py-1.5 rounded-full border text-xs font-bold ${pillClass(typeFilter === filter.id)}`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="search"
            value={query}
            onChange={(event) => {
              const next = event.target.value;
              setQuery(next);
              const needle = next.trim().toLowerCase();
              if (studentId !== "all" && needle) {
                const chosen = roster.find((student) => student.id === studentId);
                if (chosen && !chosen.name.toLowerCase().includes(needle)) setStudentId("all");
              }
            }}
            placeholder="Search students"
            aria-label="Search students"
            data-testid="activity-log-search"
            className="h-9 sm:max-w-xs flex-1 rounded-xl border border-slate-200 px-3 text-sm text-slate-800 placeholder:text-slate-400"
          />
          <select
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            aria-label="Filter by student"
            data-testid="activity-log-student"
            className="h-9 sm:w-64 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
          >
            <option value="all">All students</option>
            {studentOptions.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-1.5" data-testid="activity-log-range-filters">
          {RANGE_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              aria-pressed={rangeFilter === filter.id}
              data-testid={`activity-log-range-${filter.id}`}
              onClick={() => setRangeFilter(filter.id)}
              className={`px-3 py-1.5 rounded-full border text-xs font-bold ${pillClass(rangeFilter === filter.id, "slate")}`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-2" data-testid="activity-log-list">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-400 italic" data-testid="activity-log-empty">
            No logs match these filters.
          </p>
        ) : (
          rows.map((log) => {
            const student = byId.get(log.studentId);
            const note = visibleNote(log, role, user?.id);
            const tags = contextTags(log.context);
            const mine = ownsLog(log, student);
            return (
              <article
                key={log.id}
                data-testid={`activity-log-card-${log.id}`}
                className="rounded-xl border border-slate-200 px-3 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-900">{student.name}</span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                          log.type === "positive" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {log.type === "positive" ? "Positive" : "Needs Support"}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {timeBlockLabel(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1" data-testid={`activity-log-when-${log.id}`}>
                      {formatLogDate(log.timestamp)} · {formatLogTime(log.timestamp)}
                    </p>
                    <p className="text-sm text-slate-800 mt-1">{log.tag}</p>
                    {tags.length > 0 && (
                      <p className="text-xs text-slate-500 mt-1" data-testid={`activity-log-context-${log.id}`}>
                        {tags.join(" · ")}
                      </p>
                    )}
                    {note && (
                      <p className="text-xs text-slate-500 mt-1" data-testid={`activity-log-note-${log.id}`}>
                        {note}{log.notePrivate ? " (private)" : ""}
                      </p>
                    )}
                  </div>
                  {mine && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        data-testid={`activity-log-edit-${log.id}`}
                        onClick={() => setEditingLog(log)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        data-testid={`activity-log-delete-${log.id}`}
                        onClick={() => setPendingDelete(log)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-400 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {editingStudent && editingLog?.type === "positive" && (
        <PositiveDialog
          open
          onOpenChange={(next) => {
            if (!next) setEditingLog(null);
          }}
          student={editingStudent}
          log={editingLog}
        />
      )}
      {editingStudent && editingLog?.type === "support" && (
        <SupportDialog
          open
          onOpenChange={(next) => {
            if (!next) setEditingLog(null);
          }}
          student={editingStudent}
          log={editingLog}
        />
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(next) => { if (!next) setPendingDelete(null); }}>
        <AlertDialogContent data-testid="activity-log-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this log?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `${byId.get(pendingDelete.studentId)?.name || "This student"}'s ${pendingDelete.type === "positive" ? "positive" : "support"} log will be removed, and the counts will update.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="activity-log-delete-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-testid="activity-log-delete-confirm"
              className="bg-rose-600 hover:bg-rose-700"
              onClick={() => {
                if (pendingDelete) deleteLog(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};
