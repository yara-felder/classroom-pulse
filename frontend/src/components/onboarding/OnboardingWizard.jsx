import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { School, Users, Target, Mail, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useClassroom } from "@/context/ClassroomContext";
import { StepClass, StepDigest } from "@/components/onboarding/StepSettings";
import { StepRoster } from "@/components/onboarding/StepRoster";
import { StepSkills, DEFAULT_ONBOARDING_SKILLS } from "@/components/onboarding/StepSkills";

const STEPS = [
  { id: "class", title: "Class & Points", hint: "Name your class and pick when points reset.", icon: School },
  { id: "roster", title: "Roster Setup", hint: "Paste names or import a CSV.", icon: Users },
  { id: "skills", title: "Skill Presets", hint: "Choose starting skill goals for your students.", icon: Target },
  { id: "digest", title: "Parent Digest & Goal", hint: "Set weekly review defaults and your class goal.", icon: Mail },
];

const Progress = ({ step }) => (
  <div className="flex items-center gap-1.5" data-testid="onboarding-progress">
    {STEPS.map((s, i) => (
      <div
        key={s.id}
        className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-teal-500" : "bg-slate-200"}`}
        data-testid={`onboarding-progress-${i}`}
      />
    ))}
  </div>
);

export const OnboardingWizard = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const { classSection, setClassSection, addStudent, updatePointSettings, updateDigestSettings, pointSettings, digestSettings } = useClassroom();
  const periods = user?.periods || [];
  const period = periods.find((p) => p.id === classSection) || periods[0];
  const [step, setStep] = useState(0);
  const [roster, setRoster] = useState([]);
  const [skills, setSkills] = useState(DEFAULT_ONBOARDING_SKILLS);
  const [form, setForm] = useState({
    className: period?.name || "",
    cadence: "weekly",
    day: 5,
    time: "15:00",
    approvalMode: "review",
    goalMode: "auto",
    customTarget: pointSettings.customTarget,
  });
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const meta = STEPS[step];
  const Icon = meta.icon;

  const finish = () => {
    if (!form.className.trim()) {
      setStep(0);
      toast.error("Give your class a name.");
      return;
    }
    const target = Math.round(Number(form.customTarget));
    if (form.goalMode === "custom" && !(target >= 1)) {
      toast.error("Enter a custom class goal of at least 1.");
      return;
    }
    const periodId = period?.id || `cls-${Date.now().toString(36)}`;
    const nextPeriods = period
      ? periods.map((p) => (p.id === periodId ? { ...p, name: form.className.trim() } : p))
      : [{ id: periodId, name: form.className.trim() }];
    updateProfile({ periods: nextPeriods, onboardingComplete: true }).catch((err) =>
      toast.error(err.message || "Couldn't save profile")
    );
    setClassSection(periodId);
    updatePointSettings({ cadence: form.cadence, goalMode: form.goalMode, customTarget: target || pointSettings.customTarget, cycleStartSeen: null });
    updateDigestSettings({ ...digestSettings, day: form.day, time: form.time, approvalMode: form.approvalMode });
    roster.forEach((r) => addStudent({ ...r, initialSkills: skills, periodIds: [periodId] }));
    toast.success("Your classroom is ready!", {
      description: `${roster.length} student${roster.length === 1 ? "" : "s"} added to ${form.className.trim()}`,
    });
    navigate("/", { replace: true });
  };

  const close = () => {
    updateProfile({ onboardingComplete: true });
    navigate("/", { replace: true });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && close()}>
      <DialogContent data-testid="onboarding-wizard" className="w-[calc(100%-1.5rem)] sm:max-w-[560px] max-h-[92vh] overflow-y-auto overflow-x-hidden rounded-2xl">
        <DialogHeader className="space-y-3">
          <Progress step={step} />
          <DialogTitle className="flex items-center gap-2" style={{ fontFamily: "Outfit" }}>
            <span className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
              <Icon className="w-4 h-4 text-teal-700" />
            </span>
            <span data-testid="onboarding-step-title">
              Step {step + 1} of 4 · {meta.title}
            </span>
          </DialogTitle>
          <DialogDescription>{meta.hint}</DialogDescription>
        </DialogHeader>

        {step === 0 && <StepClass form={form} set={set} />}
        {step === 1 && <StepRoster roster={roster} setRoster={setRoster} />}
        {step === 2 && <StepSkills selected={skills} setSelected={setSkills} />}
        {step === 3 && <StepDigest form={form} set={set} />}

        <div className="flex flex-wrap-reverse items-center justify-between gap-2 pt-2">
          <Button variant="ghost" onClick={close} className="text-xs text-slate-500" data-testid="onboarding-skip-all-btn">
            Skip setup
          </Button>
          <div className="flex flex-wrap justify-end gap-2 ml-auto">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)} data-testid="onboarding-back-btn">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
            {step < 3 ? (
              <>
                {step > 0 && (
                  <Button variant="ghost" onClick={() => setStep((s) => s + 1)} className="text-xs" data-testid="onboarding-skip-step-btn">
                    Skip step
                  </Button>
                )}
                <Button
                  onClick={() => {
                    if (step === 0 && !form.className.trim()) {
                      toast.error("Give your class a name.");
                      return;
                    }
                    setStep((s) => s + 1);
                  }}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                  data-testid="onboarding-next-btn"
                >
                  Next <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </>
            ) : (
              <Button onClick={finish} className="bg-teal-600 hover:bg-teal-700 text-white" data-testid="onboarding-finish-btn">
                <Check className="w-4 h-4 mr-1" /> Finish setup
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
