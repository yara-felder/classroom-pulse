import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Plus,
  Target,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  } from "lucide-react";
import confetti from "canvas-confetti";
import { generateGoalReportPDF } from "@/lib/goalReportPdf";
import { PdfReportButton, chartElFor } from "@/components/goals/PdfReportButton";
import { skillSummaryLines, pdfFilename } from "@/lib/goalSummaries";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useClassroom } from "@/context/ClassroomContext";
import { TrialPanel } from "@/components/goals/TrialPanel";
import { DEFAULT_MASTERY } from "@/components/goals/mastery";
import { dayWord } from "@/components/goals/MasteryCriteria";

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
};

const formatShortDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const fireCelebration = () => {
  const shoot = (opts) =>
    confetti({
      particleCount: 55,
      spread: 70,
      startVelocity: 45,
      ticks: 220,
      zIndex: 9999,
      ...opts,
    });
  shoot({ origin: { x: 0.2, y: 0.6 } });
  shoot({ origin: { x: 0.8, y: 0.6 } });
  setTimeout(() => shoot({ origin: { x: 0.5, y: 0.4 } }), 200);
};

const BaselineTargetDialog = ({ open, onOpenChange, skill, studentId }) => {
  const { setSkillTarget } = useClassroom();
  const [baseline, setBaseline] = useState(skill.baseline ?? 0);
  const [targetPercent, setTargetPercent] = useState(skill.targetPercent ?? 100);
  const [targetDate, setTargetDate] = useState(skill.targetDate || "");

  useEffect(() => {
    setBaseline(skill.baseline ?? 0);
    setTargetPercent(skill.targetPercent ?? 100);
    setTargetDate(skill.targetDate || "");
  }, [skill.baseline, skill.targetPercent, skill.targetDate, open]);

  const handleSave = () => {
    setSkillTarget(studentId, skill.id, { baseline, targetPercent, targetDate });
    toast.success("Baseline & target updated", { description: skill.name });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid={`modal-baseline-target-${skill.id}`} className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "Outfit" }}>Baseline & Target · {skill.name}</DialogTitle>
          <DialogDescription>
            Set the starting baseline and the target mastery goal.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor={`baseline-${skill.id}`} className="text-xs font-semibold">
              Baseline (% Independent at start)
            </Label>
            <Input
              id={`baseline-${skill.id}`}
              data-testid={`baseline-input-${skill.id}`}
              type="number"
              min="0"
              max="100"
              value={baseline}
              onChange={(e) => setBaseline(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor={`target-pct-${skill.id}`} className="text-xs font-semibold">
              Target percent
            </Label>
            <Input
              id={`target-pct-${skill.id}`}
              data-testid={`target-percent-input-${skill.id}`}
              type="number"
              min="0"
              max="100"
              value={targetPercent}
              onChange={(e) => setTargetPercent(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor={`target-${skill.id}`} className="text-xs font-semibold">
              Target date
            </Label>
            <Input
              id={`target-${skill.id}`}
              data-testid={`target-date-input-${skill.id}`}
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            data-testid={`save-target-btn-${skill.id}`}
            onClick={handleSave}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const SkillRow = ({ skill, studentId, student, onMastery }) => {
  const { logTrial, setSkillMastery, logs, can } = useClassroom();
  const [targetOpen, setTargetOpen] = useState(false);
  const prevStatus = useRef(skill.status);
  const prevMastery = useRef(skill.mastery);

  useEffect(() => {
    const masteryEdited = prevMastery.current !== skill.mastery;
    if (!masteryEdited && prevStatus.current !== "Mastered" && skill.status === "Mastered") {
      onMastery(skill);
    }
    prevStatus.current = skill.status;
    prevMastery.current = skill.mastery;
  }, [skill.status, skill, onMastery]);

  const meta = statusMeta[skill.status] || statusMeta["In Progress"];
  const StatusIcon = meta.icon;

  const attempted = (skill.trials || []).filter((t) => t !== null);
  const indCount = attempted.filter((t) => t === "independent").length;
  const todayScore =
    attempted.length > 0 ? Math.round((indCount / attempted.length) * 100) : null;

  const monthlyAvg = useMemo(() => {
    const arr = (skill.history || []).map((h) => h.percent).filter((v) => Number.isFinite(v));
    if (arr.length === 0) return 0;
    return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  }, [skill.history]);

  const lastPrompt = useMemo(() => {
    for (let i = (skill.trials || []).length - 1; i >= 0; i--) {
      const t = skill.trials[i];
      if (t) return CHOICE_LABEL[t];
    }
    return skill.lastPrompt || null;
  }, [skill.trials, skill.lastPrompt]);

  const handleTrialSelect = (idx, level) => {
    logTrial(studentId, skill.id, idx, level);
    if (level) {
      toast.success(`Trial ${idx + 1} · ${CHOICE_LABEL[level]} — ${skill.name}`, { duration: 1600 });
    }
  };

  const handleExportPdf = async () => {
    const filename = pdfFilename(student?.name, skill.name);
    await generateGoalReportPDF({
      reportTitle: "Skill Acquisition Report",
      goalName: skill.name,
      student,
      summaryLines: skillSummaryLines(skill),
      history: skill.history,
      logs: logs.filter((l) => l.studentId === studentId),
      chartEl: chartElFor(`skill-${skill.id}`),
      filename,
    });
    return filename;
  };

  const pdfButton = (
    <PdfReportButton testid={`download-pdf-btn-${skill.id}`} onExport={handleExportPdf} />
  );

  return (
    <div
      data-testid={`skill-row-${skill.id}`}
      className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
            <Target className="w-4 h-4 text-teal-700" />
          </span>
          <div className="min-w-0">
            <h4
              className="text-sm font-bold text-slate-900 truncate"
              style={{ fontFamily: "Outfit" }}
              data-testid={`skill-name-${skill.id}`}
            >
              {skill.name}
            </h4>
            <span className="text-[11px] text-slate-500 font-medium">
              Last trial: {lastPrompt || "—"}
            </span>
          </div>
        </div>
        <Badge
          data-testid={`skill-status-${skill.id}`}
          variant="outline"
          className={`${meta.badge} font-semibold`}
        >
          <span className="flex items-center gap-1">
            <StatusIcon className="w-3 h-3" /> {skill.status}
          </span>
        </Badge>
      </div>

      {/* Shared identical Today's Score / T1–T5 / Baseline+Target / Chart */}
      <TrialPanel
        testidPrefix={`skill-${skill.id}`}
        trials={skill.trials}
        onSlotSelect={handleTrialSelect}
        history={skill.history}
        baseline={skill.baseline ?? 0}
        targetPercent={skill.targetPercent ?? 100}
        targetDate={skill.targetDate}
        onEditTarget={can("edit_goals") ? () => setTargetOpen(true) : undefined}
        color={meta.trend}
        extraHeader={pdfButton}
        mastery={skill.mastery || DEFAULT_MASTERY}
        onSaveMastery={(m) => {
          setSkillMastery(studentId, skill.id, m);
          toast.success(`Mastery target set: ${m.percent}% over ${dayWord(m.days)}`);
        }}
      />

      <BaselineTargetDialog
        open={targetOpen}
        onOpenChange={setTargetOpen}
        skill={skill}
        studentId={studentId}
      />
    </div>
  );
};

export const SkillAcquisitionCard = ({ studentId }) => {
  const { skillsByStudent, addSkill, students, can } = useClassroom();
  const skills = skillsByStudent[studentId] || [];
  const student = students.find((s) => s.id === studentId);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");

  const handleAdd = () => {
    if (!name.trim()) {
      toast.error("Give the skill a short name.");
      return;
    }
    addSkill(studentId, name.trim());
    toast.success(`Skill goal added — ${name.trim()}`);
    setName("");
    setAddOpen(false);
  };

  const handleMastery = (skill) => {
    fireCelebration();
    toast.success(`🎉 Mastered — ${skill.name}`, {
      description: `Parent digest note queued for ${student?.name || "family"}.`,
      duration: 5000,
    });
  };

  return (
    <section
      data-testid="skill-acquisition-card"
      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
    >
      <header className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3
            className="text-lg font-bold text-slate-900 flex items-center gap-2"
            style={{ fontFamily: "Outfit" }}
            data-testid="skill-card-title"
          >
            <span className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
              <Target className="w-4 h-4 text-teal-700" />
            </span>
            Active Skill Goals
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Log every trial in one tap. Today&apos;s score updates live.
          </p>
        </div>
        {can("edit_goals") && (
        <button
          data-testid="add-new-skill-btn"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-3 py-2 transition-colors shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" strokeWidth={2.6} />
          <span className="hidden sm:inline">Add New Skill</span>
          <span className="sm:hidden">New</span>
        </button>
        )}
      </header>

      <div className="space-y-3">
        {skills.length === 0 && (
          <p className="text-sm text-slate-400 italic text-center py-6">
            No active skill goals yet. Add one to get started.
          </p>
        )}
        {skills.map((s) => (
          <SkillRow
            key={s.id}
            skill={s}
            studentId={studentId}
            student={student}
            onMastery={handleMastery}
          />
        ))}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent data-testid="modal-add-skill-dialog" className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Outfit" }}>Add a new skill goal</DialogTitle>
            <DialogDescription>
              Enter the replacement skill you want to track (e.g., &quot;Ask for help&quot;).
            </DialogDescription>
          </DialogHeader>
          <Input
            data-testid="new-skill-name-input"
            placeholder="Skill name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              data-testid="submit-new-skill-btn"
              onClick={handleAdd}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              Add skill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};
