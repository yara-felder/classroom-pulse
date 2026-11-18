import React, { useState, useMemo } from "react";
import {
  Plus,
  Target,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  CalendarDays,
  LineChart as LineChartIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import { useClassroom } from "@/context/ClassroomContext";
import { AddIepGoalDialog } from "@/components/dialogs/AddIepGoalDialog";
import { TrialPanel, summarizeTrials } from "@/components/goals/TrialPanel";
import { DEFAULT_MASTERY } from "@/components/goals/mastery";
import { dayWord } from "@/components/goals/MasteryCriteria";
import { generateGoalReportPDF } from "@/lib/goalReportPdf";
import { PdfReportButton, chartElFor } from "@/components/goals/PdfReportButton";
import { iepSummaryLines, pdfFilename, deriveIepStatus } from "@/lib/goalSummaries";

const shortDate = (iso) => (iso ? format(new Date(iso), "MMM d, yyyy") : "—");

const CHOICE_LABEL = { independent: "Ind", prompted: "Pmt", refused: "N/A" };

const statusMeta = {
  Mastered: {
    badge: "bg-emerald-500 text-white border-emerald-500",
    icon: CheckCircle2,
    trend: "#10B981",
  },
  "In Progress": {
    badge: "bg-amber-50 text-amber-700 border-amber-300",
    icon: TrendingUp,
    trend: "#F59E0B",
  },
  "Needs Support": {
    badge: "bg-rose-50 text-rose-700 border-rose-300",
    icon: AlertTriangle,
    trend: "#EF4444",
  },
  "Not Started": {
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    icon: LineChartIcon,
    trend: "#94A3B8",
  },
};

const deriveGoalStatus = deriveIepStatus;

const IepGoalCard = ({ studentId, student, goal }) => {
  const { logIepTrial, setIepMastery, logs } = useClassroom();
  const status = useMemo(() => deriveGoalStatus(goal), [goal]);
  const meta = statusMeta[status] || statusMeta["In Progress"];
  const StatusIcon = meta.icon;

  const { todayScore } = summarizeTrials(goal.trials);
  const lastPrompt = useMemo(() => {
    for (let i = (goal.trials || []).length - 1; i >= 0; i--) {
      const t = goal.trials[i];
      if (t) return CHOICE_LABEL[t];
    }
    return null;
  }, [goal.trials]);

  const handleExportPdf = async () => {
    const filename = pdfFilename(student?.name, `${goal.planType || "IEP"}_${goal.description}`);
    await generateGoalReportPDF({
      reportTitle: `${goal.planType || "IEP"} Goal Progress Report`,
      goalName: goal.description,
      student,
      summaryLines: iepSummaryLines(goal),
      history: goal.history,
      logs: logs.filter((l) => l.studentId === studentId),
      chartEl: chartElFor(`iep-goal-${goal.id}`),
      filename,
    });
    return filename;
  };

  const handleTrialSelect = (idx, level) => {
    logIepTrial(studentId, goal.id, idx, level);
    if (level) {
      toast.success(`Trial ${idx + 1} · ${CHOICE_LABEL[level]} — ${goal.description.slice(0, 40)}${goal.description.length > 40 ? "…" : ""}`, {
        duration: 1600,
      });
    }
  };

  return (
    <div
      data-testid={`iep-goal-card-${goal.id}`}
      className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
            <Target className="w-4 h-4 text-indigo-700" />
          </span>
          <div className="min-w-0">
            <h4
              className="text-sm font-bold text-slate-900 truncate"
              style={{ fontFamily: "Outfit" }}
              data-testid={`iep-goal-name-${goal.id}`}
            >
              {goal.description}
            </h4>
            <span className="text-[11px] text-slate-500 font-medium">
              Last trial: {lastPrompt || "—"}
            </span>
          </div>
        </div>
        <Badge
          data-testid={`iep-goal-status-${goal.id}`}
          variant="outline"
          className={`${meta.badge} font-semibold shrink-0`}
        >
          <span className="flex items-center gap-1">
            <StatusIcon className="w-3 h-3" /> {status}
          </span>
        </Badge>
      </div>

      {/* Plan / Domain tag row */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge
          variant="outline"
          className="bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold text-[10px]"
        >
          {goal.planType || "IEP"} · {goal.domain}
        </Badge>
        {goal.reviewDate && (
          <span className="text-[10px] font-medium text-slate-500 inline-flex items-center gap-1">
            <CalendarDays className="w-3 h-3" />
            Review {shortDate(goal.reviewDate)}
          </span>
        )}
      </div>

      {/* Accommodations */}
      {goal.accommodations?.length > 0 && (
        <div className="mt-2">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
            Accommodations
          </div>
          <div className="flex flex-wrap gap-1" data-testid={`iep-goal-accommodations-${goal.id}`}>
            {goal.accommodations.map((a) => (
              <span
                key={a}
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Shared identical Today's Score / T1–T5 / Baseline+Target / Chart */}
      <TrialPanel
        testidPrefix={`iep-goal-${goal.id}`}
        trials={goal.trials}
        onSlotSelect={handleTrialSelect}
        history={goal.history}
        baseline={goal.baseline ?? 0}
        targetPercent={goal.targetPercent ?? 100}
        targetDate={goal.targetDate}
        color={meta.trend}
        extraHeader={
          <PdfReportButton testid={`download-pdf-btn-iep-${goal.id}`} onExport={handleExportPdf} />
        }
        mastery={goal.mastery || DEFAULT_MASTERY}
        onSaveMastery={(m) => {
          setIepMastery(studentId, goal.id, m);
          toast.success(`Mastery target set: ${m.percent}% over ${dayWord(m.days)}`);
        }}
      />
    </div>
  );
};

export const IepGoalsSection = ({ student }) => {
  const { iepGoalsByStudent, can } = useClassroom();
  const [addOpen, setAddOpen] = useState(false);
  const goals = iepGoalsByStudent[student.id] || [];
  const primaryPlanType = student.iep ? "IEP" : "504";

  return (
    <section
      data-testid="iep-goals-section"
      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
    >
      <header className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3
            className="text-lg font-bold text-slate-900 flex items-center gap-2"
            style={{ fontFamily: "Outfit" }}
            data-testid="iep-goals-title"
          >
            <span className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Target className="w-4 h-4 text-indigo-700" />
            </span>
            IEP &amp; 504 Goals
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Log every trial in one tap. Today&apos;s score updates live — mastery is calculated only from this goal&apos;s trials.
          </p>
        </div>
        {can("edit_goals") && (
        <button
          data-testid="add-iep-goal-btn"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-3 py-2 transition-colors shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" strokeWidth={2.6} />
          <span className="hidden sm:inline">Add IEP/504 Goal</span>
          <span className="sm:hidden">New Goal</span>
        </button>
        )}
      </header>

      <div className="space-y-3">
        {goals.length === 0 && (
          <p className="text-sm text-slate-400 italic text-center py-6">
            No plan goals yet. Add one to start logging trials directly.
          </p>
        )}
        {goals.map((goal) => (
          <IepGoalCard key={goal.id} studentId={student.id} student={student} goal={goal} />
        ))}
      </div>

      <AddIepGoalDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        student={student}
        planType={primaryPlanType}
      />
    </section>
  );
};
