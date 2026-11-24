import React, { useMemo, useState } from "react";
import { GraduationCap, Mail, Pencil, Plus, Search, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useClassroom } from "@/context/ClassroomContext";
import { AddStudentDialog } from "@/components/dialogs/AddStudentDialog";
import { EditStudentDialog } from "@/components/dialogs/EditStudentDialog";
import { StudentAnalyticsSheet } from "@/components/StudentAnalyticsSheet";
import { StudentAvatar } from "@/components/StudentAvatar";
import {
  assignedCaseloadStudents,
  decorateCaseloadStudent,
  isOwnStudent,
} from "@/lib/rbac";
import { planLabel } from "@/lib/adminRoster";
import { contextTags, formatLogTime } from "@/data/supportContext";
import { timeBlockLabel } from "@/lib/schoolAnalytics";

const OUTFIT = { fontFamily: "Outfit" };

const matches = (student, query) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    student.name.toLowerCase().includes(q)
    || (student.teacherName || "").toLowerCase().includes(q)
    || (student.grade || "").toLowerCase().includes(q)
  );
};

export const CaseManagerRoster = () => {
  const { user } = useAuth();
  const { students, logs, classSection, setPullout } = useClassroom();
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [trendsStudent, setTrendsStudent] = useState(null);

  const periodName = (user?.periods || []).find((period) => period.id === classSection)?.name || "this period";
  const periodNameOf = (id) => (user?.periods || []).find((period) => period.id === id)?.name || "";
  const roster = useMemo(() => students.map(decorateCaseloadStudent), [students]);
  const mine = roster.filter((student) => isOwnStudent(student, user?.id) && matches(student, query));
  const caseload = assignedCaseloadStudents(roster).filter((student) => matches(student, query));

  const togglePlacement = (student) => {
    if (!classSection) return;
    const placed = (student.pulloutPeriodIds || []).includes(classSection);
    setPullout(student.id, classSection, !placed);
  };

  const latestActivity = (studentId) => {
    const recent = logs
      .filter((log) => log.studentId === studentId && (log.type === "positive" || log.type === "support"))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    if (!recent) return null;
    return {
      time: formatLogTime(recent.timestamp),
      block: timeBlockLabel(recent.timestamp),
      tag: recent.tag || "Support",
      context: contextTags(recent.context),
    };
  };

  return (
    <div className="pt-6 pb-4 px-4 sm:px-8 max-w-7xl mx-auto" data-testid="case-manager-roster">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900" style={OUTFIT}>
            Roster
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your classroom, and review the caseload an administrator assigned to you.
          </p>
        </div>
        <button
          type="button"
          data-testid="add-student-btn"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-4 py-2.5 shadow-sm self-start"
        >
          <Plus className="w-4 h-4" /> Add student
        </button>
      </div>

      <div className="relative mt-5 mb-6 max-w-lg">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search students or teachers"
          aria-label="Search students or teachers"
          data-testid="roster-search-input"
          className="pl-9 h-11 bg-white border-slate-200 rounded-xl"
        />
      </div>

      <section className="mb-8" data-testid="assigned-caseload-roster">
        <h2 className="text-xl font-extrabold text-slate-900" style={OUTFIT}>Assigned caseload</h2>
        <p className="text-sm text-slate-500 mt-1 mb-4">
          IEP and 504 students assigned by the school administrator. Private notes stay with the classroom teacher.
        </p>
        {caseload.length === 0 ? (
          <p className="text-sm text-slate-500" data-testid="assigned-caseload-empty">No students are assigned to you yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {caseload.map((student) => {
              const placed = (student.pulloutPeriodIds || []).includes(classSection);
              const activity = latestActivity(student.id);
              return (
                <div key={student.id} data-testid={`caseload-card-${student.id}`} className="bg-white border border-slate-200 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <StudentAvatar name={student.name} id={student.id} size="lg" />
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-bold text-slate-900 truncate" style={OUTFIT}>{student.name}</h3>
                      {student.grade ? (
                        <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <GraduationCap className="w-3.5 h-3.5" /> {student.grade}
                        </p>
                      ) : null}
                      <p className="text-xs text-slate-600 mt-1" data-testid={`caseload-teacher-${student.id}`}>
                        {student.teacherName || "Classroom teacher"}
                      </p>
                      <Badge className="mt-2 bg-indigo-100 text-indigo-700 border-indigo-200 text-[10px] font-bold" data-testid={`caseload-plan-${student.id}`}>
                        {planLabel(student.iep, student.plan504)}
                      </Badge>
                      <div className="mt-2" data-testid={`caseload-activity-${student.id}`}>
                        {activity ? (
                          <>
                            <p className="text-xs font-semibold text-slate-700">
                              {activity.time} · {activity.block}
                            </p>
                            <p className="text-xs text-slate-600">{activity.tag}</p>
                            {activity.context.length > 0 && (
                              <p className="text-xs text-slate-500 mt-0.5">{activity.context.join(" · ")}</p>
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-slate-500">No behavior logged yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500 mt-3" data-testid={`digest-managed-note-${student.id}`}>
                    Managed by classroom teacher
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setTrendsStudent(student)}
                      data-testid={`caseload-trends-${student.id}`}
                      className="text-xs font-bold text-teal-700 hover:text-teal-800"
                    >
                      View trends
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePlacement(student)}
                      disabled={!classSection}
                      data-testid={`caseload-place-${student.id}`}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 disabled:opacity-40"
                    >
                      {placed ? `Remove from ${periodName}` : `Add to ${periodName}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section data-testid="my-classroom-roster">
        <h2 className="text-xl font-extrabold text-slate-900" style={OUTFIT}>My classroom and period students</h2>
        <p className="text-sm text-slate-500 mt-1 mb-4">
          Students you created. Edit a card to set periods, behavior goals, and Parent Digest contacts.
        </p>
        {mine.length === 0 ? (
          <p className="text-sm text-slate-500" data-testid="my-classroom-empty">You have not added students yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {mine.map((student) => {
              const periods = (student.periodIds || []).map(periodNameOf).filter(Boolean);
              return (
                <div
                  key={student.id}
                  data-testid={`roster-item-${student.id}`}
                  className="relative bg-white border border-slate-200 rounded-2xl p-4"
                >
                  <div className="flex items-start gap-3 pr-8">
                    <StudentAvatar name={student.name} id={student.id} size="lg" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[15px] font-bold text-slate-900 truncate" style={OUTFIT}>{student.name}</h3>
                        {student.iep && <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-[10px] font-bold">IEP</Badge>}
                        {student.plan504 && (
                          <Badge className="bg-teal-100 text-teal-700 border-teal-200 text-[10px] font-bold">
                            <Shield className="w-2.5 h-2.5 mr-0.5" /> 504
                          </Badge>
                        )}
                      </div>
                      {student.grade ? (
                        <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <GraduationCap className="w-3.5 h-3.5" /> {student.grade}
                        </p>
                      ) : null}
                      <p className="text-[11px] text-slate-500 mt-1">{periods.join(" · ") || "No period yet"}</p>
                      <p className="flex items-center gap-1.5 text-xs text-teal-700 mt-1.5 font-medium" data-testid={`roster-email-${student.id}`}>
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate">{student.guardianEmail || "No guardian email"}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    data-testid={`roster-edit-btn-${student.id}`}
                    onClick={() => setEditingStudent(student)}
                    aria-label={`Edit ${student.name}`}
                    className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-teal-700 hover:border-teal-300 flex items-center justify-center"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <AddStudentDialog open={addOpen} onOpenChange={setAddOpen} />
      <EditStudentDialog
        open={!!editingStudent}
        onOpenChange={(open) => !open && setEditingStudent(null)}
        student={editingStudent}
      />
      <StudentAnalyticsSheet
        open={!!trendsStudent}
        onOpenChange={(open) => !open && setTrendsStudent(null)}
        student={trendsStudent}
      />
    </div>
  );
};
