import React, { useMemo } from "react";
import { Coins, Target, Calculator } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClassroom } from "@/context/ClassroomContext";
import { CADENCES, STRETCH, classGoal } from "@/lib/pointCycle";

const Card = ({ icon: Icon, title, children, testid }) => (
  <div className="border border-slate-200 rounded-xl p-4 space-y-3" data-testid={testid}>
    <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5" style={{ fontFamily: "Outfit" }}>
      <Icon className="w-4 h-4 text-teal-600" /> {title}
    </p>
    {children}
  </div>
);

const Choice = ({ active, onClick, testid, title, hint }) => (
  <button
    type="button"
    role="radio"
    aria-checked={active}
    onClick={onClick}
    data-testid={testid}
    className={`text-left rounded-xl border px-3 py-2.5 transition-colors ${active ? "border-teal-500 bg-teal-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
  >
    <span className="block text-sm font-semibold text-slate-800">{title}</span>
    <span className="block text-[11px] text-slate-500">{hint}</span>
  </button>
);

export const PointSystemSettings = ({ draft, set }) => {
  const { students, logs, classSection } = useClassroom();
  const roster = useMemo(() => students.filter((s) => (s.periodIds || []).includes(classSection)), [students, classSection]);
  const goal = classGoal(draft, roster, logs);
  const per = goal.base.perStudentWeekly.toFixed(1);

  return (
    <div className="space-y-4">
      <Card icon={Coins} title="Point System Settings" testid="point-system-card">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Point Reset Cadence</Label>
          <Select value={draft.cadence} onValueChange={set("cadence")}>
            <SelectTrigger data-testid="point-cadence-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CADENCES.map((c) => (
                <SelectItem key={c.id} value={c.id} data-testid={`point-cadence-option-${c.id}`}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-slate-500">Resets clear only the active balance used for rewards. Logs and reports are kept.</p>
        </div>
      </Card>

      <Card icon={Target} title="Class Goal Target" testid="class-goal-card">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup">
          <Choice active={draft.goalMode === "auto"} onClick={() => set("goalMode")("auto")} testid="goal-mode-auto" title="Auto-Calculate from Baseline" hint="Recommended · adapts to your class" />
          <Choice active={draft.goalMode === "custom"} onClick={() => set("goalMode")("custom")} testid="goal-mode-custom" title="Custom Target" hint="Set a fixed number for the cycle" />
        </div>

        {draft.goalMode === "auto" ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Baseline window</Label>
                <Select value={String(draft.baselineWeeks)} onValueChange={(v) => set("baselineWeeks")(Number(v))}>
                  <SelectTrigger data-testid="goal-baseline-weeks-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((w) => (
                      <SelectItem key={w} value={String(w)} data-testid={`goal-baseline-weeks-${w}`}>
                        Last {w} week{w === 1 ? "" : "s"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Target Adjustment</Label>
                <Select value={draft.stretch} onValueChange={set("stretch")}>
                  <SelectTrigger data-testid="goal-stretch-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STRETCH.map((s) => (
                      <SelectItem key={s.id} value={s.id} data-testid={`goal-stretch-${s.id}`}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 rounded-xl bg-slate-50 border border-slate-200 p-3" data-testid="goal-baseline-explainer">
              <Calculator className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-700 leading-relaxed">
                {goal.base.starter ? (
                  <>
                    No history yet for this class, so we're starting with <b>{per} positive moments per student per week</b>.
                    The target will adapt automatically as you log.{" "}
                  </>
                ) : (
                  <>
                    Based on your last {draft.baselineWeeks} week{draft.baselineWeeks === 1 ? "" : "s"}, your class averages{" "}
                    <b>{per} positive moments per student per week</b> ({goal.base.weeklyTotal} total for {roster.length} students).{" "}
                  </>
                )}
                Your current target is set to <b data-testid="goal-computed-target">{goal.target} positive moments</b>
                {draft.cadence === "monthly" ? " for this month" : " for this cycle"}.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Positive moments this cycle</Label>
            <Input
              type="number"
              min={1}
              value={draft.customTarget}
              onChange={(e) => set("customTarget")(e.target.value)}
              className="w-40"
              data-testid="goal-custom-target-input"
            />
          </div>
        )}
      </Card>
    </div>
  );
};
