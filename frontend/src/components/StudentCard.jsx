import React, { useState } from "react";
import { Plus, AlertTriangle, FileText, Sparkles, CircleDot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useClassroom } from "@/context/ClassroomContext";
import { useAuth } from "@/context/AuthContext";
import { PositiveDialog } from "@/components/dialogs/PositiveDialog";
import { SupportDialog } from "@/components/dialogs/SupportDialog";
import { QuickLogDialog } from "@/components/dialogs/QuickLogDialog";
import { visibleNote } from "@/lib/rbac";
import { StudentProfileSheet } from "@/components/StudentProfileSheet";
import { StudentAvatar } from "@/components/StudentAvatar";

const statusStyles = {
  Thriving: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Connected: "bg-teal-50 text-teal-700 border-teal-200",
  "Needs Guidance": "bg-amber-50 text-amber-700 border-amber-200",
  Resetting: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

export const StudentCard = ({ student }) => {
  const { detailedMode, logs, can, role } = useClassroom();
  const { user } = useAuth();
  const [openPositive, setOpenPositive] = useState(false);
  const [openSupport, setOpenSupport] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [openQuickLog, setOpenQuickLog] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [pulse, setPulse] = useState(false);

  const recentLogs = logs
    .filter((l) => l.studentId === student.id && !(student.assigned && l.notePrivate))
    .slice(0, 3);

  const triggerPulse = () => {
    setPulse(true);
    setTimeout(() => setPulse(false), 500);
  };

  return (
    <>
      <div
        data-testid={`student-card-${student.id}`}
        className="bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden relative animate-rise"
      >
        {/* Top strip - status */}
        <div
          className={`h-1 w-full ${
            student.status === "Thriving"
              ? "bg-emerald-400"
              : student.status === "Connected"
              ? "bg-teal-400"
              : student.status === "Needs Guidance"
              ? "bg-amber-400"
              : "bg-indigo-400"
          }`}
        />

        <div className="p-5">
          <div className="flex items-start gap-3">
            <StudentAvatar name={student.name} id={student.id} size="lg" className="ring-2 ring-white" />
            <div className="flex-1 min-w-0">
              <button
                data-testid={`student-detail-trigger-${student.id}`}
                onClick={() => setOpenProfile(true)}
                className="text-left w-full"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <h3
                    className="text-[15px] font-bold text-slate-900 truncate hover:text-teal-700 transition-colors"
                    style={{ fontFamily: "Outfit" }}
                    data-testid={`student-name-${student.id}`}
                  >
                    {student.name}
                  </h3>
                  {student.iep && (
                    <Badge
                      data-testid={`iep-badge-${student.id}`}
                      className="shrink-0 bg-indigo-100 text-indigo-700 border-indigo-200 text-[10px] font-bold"
                    >
                      IEP
                    </Badge>
                  )}
                  {student.plan504 && (
                    <Badge
                      data-testid={`plan504-badge-${student.id}`}
                      className="shrink-0 bg-teal-100 text-teal-800 border-teal-200 text-[10px] font-bold"
                    >
                      504
                    </Badge>
                  )}
                </span>
              </button>
              {student.grade ? (
                <p className="text-xs text-slate-500 mt-0.5">{student.grade}</p>
              ) : null}
              {student.assigned && (
                <p className="text-xs text-slate-600" data-testid={`caseload-teacher-${student.id}`}>
                  {student.teacherName || "Classroom teacher"}
                </p>
              )}
              <Badge
                variant="outline"
                className={`mt-1 text-[10px] font-semibold ${statusStyles[student.status] || ""}`}
                data-testid={`student-status-${student.id}`}
              >
                <CircleDot className="w-2.5 h-2.5 mr-1" /> {student.status}
              </Badge>
            </div>
            {!student.assigned && (
            <div
              data-testid={`student-points-badge-${student.id}`}
              className={`flex flex-col items-center justify-center bg-emerald-50 border border-emerald-100 rounded-xl px-2.5 py-1.5 min-w-[52px] ${
                pulse ? "animate-pulse-once" : ""
              }`}
            >
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">
                Points
              </span>
              <span
                className="text-lg font-extrabold text-emerald-700 leading-none"
                style={{ fontFamily: "Fredoka" }}
              >
                {student.points}
              </span>
            </div>
            )}
          </div>

          {/* Recent tag */}
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-medium">Recent:</span>
            <span className="text-slate-700 truncate">{student.recentTag}</span>
          </div>

          {/* Detailed mode extra content */}
          {(detailedMode || student.assigned) && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Support flags:</span>
                <span className="font-bold text-amber-600">{student.supportCount}</span>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  Recent Activity
                </span>
                {recentLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No activity yet today.</p>
                ) : (
                  recentLogs.map((l) => (
                    <div key={l.id} className="flex items-start gap-2 text-xs">
                      <span
                        className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${
                          l.type === "positive"
                            ? "bg-emerald-500"
                            : l.type === "support"
                            ? "bg-amber-500"
                            : "bg-indigo-500"
                        }`}
                      />
                      <div className="flex-1">
                        <span className="text-slate-700 font-medium">{l.tag}</span>
                        {visibleNote(l, role, user?.id) && (
                          <span className="text-slate-500"> — {visibleNote(l, role, user?.id)}{l.notePrivate ? " (private)" : ""}</span>
                        )}
                      </div>
                      {l.type === "support" && can("log") && !(role === "case_manager" && student.assigned) && (
                        <button
                          type="button"
                          data-testid={`edit-support-${l.id}`}
                          onClick={() => {
                            setEditingLog(l);
                            setOpenSupport(true);
                          }}
                          className="shrink-0 text-[11px] font-bold text-amber-700 hover:text-amber-800"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          {can("log") && !(role === "case_manager" && student.assigned) && (
          <div className="mt-4 grid grid-cols-[1fr_1fr_auto] gap-2">
            <button
              data-testid={`positive-btn-${student.id}`}
              onClick={() => {
                triggerPulse();
                setOpenPositive(true);
              }}
              className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-1 py-2.5 shadow-sm hover:shadow-emerald-200"
              aria-label="Log positive skill"
            >
              <Plus className="w-4 h-4" strokeWidth={2.8} />
              <span className="text-xs">Positive</span>
            </button>
            <button
              data-testid={`needs-support-btn-${student.id}`}
              onClick={() => {
                setEditingLog(null);
                setOpenSupport(true);
              }}
              className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-1 py-2.5 shadow-sm hover:shadow-amber-200"
              aria-label="Log needs support"
            >
              <AlertTriangle className="w-4 h-4" strokeWidth={2.8} />
              <span className="text-xs">Support</span>
            </button>
            <button
              data-testid={`quick-log-btn-${student.id}`}
              onClick={() => setOpenQuickLog(true)}
              className="bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-medium rounded-xl transition-all border border-slate-300/80 flex items-center justify-center gap-1 py-2.5 px-3"
              aria-label="Quick log"
            >
              <FileText className="w-4 h-4" />
              <span className="text-xs">Log</span>
            </button>
          </div>
          )}
        </div>
      </div>

      <PositiveDialog
        open={openPositive}
        onOpenChange={setOpenPositive}
        student={student}
      />
      <SupportDialog
        open={openSupport}
        onOpenChange={(next) => {
          setOpenSupport(next);
          if (!next) setEditingLog(null);
        }}
        student={student}
        log={editingLog}
      />
      <QuickLogDialog
        open={openQuickLog}
        onOpenChange={setOpenQuickLog}
        student={student}
      />
      <StudentProfileSheet
        open={openProfile}
        onOpenChange={setOpenProfile}
        student={student}
      />
    </>
  );
};
