import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GraduationCap, Mail, Pencil, Target, Mail as MailIcon } from "lucide-react";
import { SkillAcquisitionCard } from "@/components/SkillAcquisitionCard";
import { IepGoalsSection } from "@/components/IepGoalsSection";
import { ParentDigestTab } from "@/components/ParentDigestTab";
import { EditStudentDialog } from "@/components/dialogs/EditStudentDialog";
import { FullReportButton } from "@/components/FullReportButton";
import { useClassroom } from "@/context/ClassroomContext";
import { useAuth } from "@/context/AuthContext";
import { canEditStudentRecord } from "@/lib/rbac";
import { StudentAvatar } from "@/components/StudentAvatar";

export const StudentProfileSheet = ({ open, onOpenChange, student: studentProp }) => {
  const { students, can, role } = useClassroom();
  const { user } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [tab, setTab] = useState("overview");

  const student = studentProp
    ? students.find((s) => s.id === studentProp.id) || studentProp
    : null;

  if (!student) return null;

  const hasPlan = !!(student.iep || student.plan504);

  const ensureOverview = async () => {
    if (tab === "overview") return;
    setTab("overview");
    await new Promise((r) => setTimeout(r, 500));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        data-testid={`student-profile-sheet-${student.id}`}
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto bg-[#FAFAF7]"
      >
        <SheetHeader className="pb-4 border-b border-slate-200">
          <div className="flex items-start gap-3">
            <StudentAvatar name={student.name} id={student.id} size="lg" className="ring-2 ring-white" />
            <div className="flex-1 min-w-0">
              <SheetTitle style={{ fontFamily: "Outfit" }} className="text-xl">
                {student.name}
              </SheetTitle>
              <SheetDescription className="mt-0.5">Student profile</SheetDescription>
              <div className="flex items-center gap-2 mt-0.5 text-sm text-slate-600 flex-wrap">
                {student.grade ? (
                  <>
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>{student.grade}</span>
                  </>
                ) : null}
                {student.iep && (
                  <Badge
                    data-testid={`profile-iep-badge-${student.id}`}
                    className="bg-indigo-100 text-indigo-700 border-indigo-200 text-[10px] font-bold ml-1"
                  >
                    IEP
                  </Badge>
                )}
                {student.plan504 && (
                  <Badge
                    data-testid={`profile-504-badge-${student.id}`}
                    className="bg-teal-100 text-teal-700 border-teal-200 text-[10px] font-bold ml-1"
                  >
                    504
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs font-semibold" data-testid={`profile-points-${student.id}`}>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5" data-testid={`profile-active-points-${student.id}`}>
                  Active: {student.points} pts
                </span>
                <span className="text-slate-500" data-testid={`profile-lifetime-points-${student.id}`}>
                  Lifetime: {student.lifetimePoints ?? student.points} pts
                </span>
              </div>
              <a
                href={`mailto:${student.guardianEmail}`}
                className="flex items-center gap-1.5 text-xs text-teal-700 mt-1 font-medium"
              >
                <Mail className="w-3.5 h-3.5" />
                {student.guardianEmail
                  ? `${student.guardianName ? `${student.guardianName} · ` : ""}${student.guardianEmail}`
                  : "No guardian email"}
              </a>
            </div>
            <div className="shrink-0 flex flex-col sm:flex-row items-end sm:items-center gap-1.5">
            <FullReportButton student={student} ensureOverview={ensureOverview} />
            {canEditStudentRecord(role, student, user?.id) && (
            <button
              onClick={() => setEditOpen(true)}
              data-testid={`edit-profile-btn-${student.id}`}
              aria-label="Edit profile"
              title="Edit profile"
              className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-sm transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
            )}
            </div>
          </div>
        </SheetHeader>

        <Tabs value={tab} onValueChange={setTab} className="mt-4">
          <TabsList className={`grid ${can("digest") ? "grid-cols-2" : "grid-cols-1"} w-full`} data-testid="profile-tabs">
            <TabsTrigger value="overview" data-testid="tab-overview">
              <Target className="w-3.5 h-3.5 mr-1.5" />
              Overview
            </TabsTrigger>
            {can("digest") && (
            <TabsTrigger value="digest" data-testid="tab-parent-digest">
              <MailIcon className="w-3.5 h-3.5 mr-1.5" />
              Parent Digest
            </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {hasPlan && <IepGoalsSection student={student} />}
            <SkillAcquisitionCard studentId={student.id} />
          </TabsContent>

          <TabsContent value="digest" className="mt-4">
            <ParentDigestTab student={student} />
          </TabsContent>
        </Tabs>

        <EditStudentDialog open={editOpen} onOpenChange={setEditOpen} student={student} />
      </SheetContent>
    </Sheet>
  );
};
