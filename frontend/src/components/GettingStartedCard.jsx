import React from "react";
import { useNavigate } from "react-router-dom";
import { Rocket, Check, ChevronDown, ChevronUp, X, Sparkles, AlertTriangle, ListChecks, Mail, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useClassroom } from "@/context/ClassroomContext";

const TRIAL_KEY = [
  { code: "Ind", meaning: "independently completed" },
  { code: "Pmt", meaning: "prompted to complete the trial or engage in the response" },
  { code: "N/A", meaning: "Elected not to opt in at this time" },
];

export const CHECKLIST_STEPS = [
  { id: "positive", label: "Log a positive skill", hint: "Celebrate a moment with the quick-log window", icon: Sparkles },
  { id: "support", label: "Log a support cue", hint: "Try the empathy-first support logger", icon: AlertTriangle },
  { id: "iep", label: "Log a skill trial", hint: "These marks work on a regular skill goal and on an IEP goal.", icon: ListChecks, trialKey: true },
  { id: "digest", label: "Preview a parent digest draft", hint: "See the weekly email a family would receive", icon: Mail },
  { id: "goal", label: "View class celebration progress", hint: "Find your class-wide milestone bar", icon: Trophy },
];

const StepRow = ({ step, done, onDo }) => {
  const Icon = step.icon;
  return (
    <li className={`flex gap-3 py-2.5 ${step.trialKey ? "items-start" : "items-center"}`} data-testid={`checklist-item-${step.id}`}>
      <span
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${step.trialKey ? "mt-0.5" : ""} ${done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"}`}
        data-testid={`checklist-status-${step.id}`}
        data-done={done ? "true" : "false"}
      >
        {done ? <Check className="w-4 h-4" strokeWidth={3} /> : <Icon className="w-3.5 h-3.5" />}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${done ? "text-slate-400 line-through" : "text-slate-800"}`}>{step.label}</p>
        <p className={`text-[11px] text-slate-500 ${step.trialKey ? "leading-snug" : "truncate"}`}>{step.hint}</p>
        {step.trialKey && (
          <ul className="mt-1.5 space-y-0.5" data-testid="checklist-trial-key">
            {TRIAL_KEY.map((item) => (
              <li key={item.code} className="text-[11px] text-slate-600 leading-snug">
                <span className="font-bold text-slate-800">{item.code}</span>
                <span className="text-slate-400"> — </span>
                {item.meaning}
              </li>
            ))}
          </ul>
        )}
      </div>
      {!done && (
        <button
          type="button"
          onClick={onDo}
          className={`text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg px-3 py-1.5 shrink-0 transition-colors ${step.trialKey ? "self-center" : ""}`}
          data-testid={`checklist-do-${step.id}`}
        >
          Show me
        </button>
      )}
    </li>
  );
};

export const GettingStartedCard = ({ periodStudents }) => {
  const navigate = useNavigate();
  const { checklist, updateChecklist, skillsByStudent, iepGoalsByStudent, setGuide } = useClassroom();
  const doneCount = CHECKLIST_STEPS.filter((s) => checklist.done[s.id]).length;

  if (checklist.dismissed || doneCount === CHECKLIST_STEPS.length) return null;

  const guideTo = (path, guide) => {
    if (path === "/" && periodStudents.length === 0) {
      toast("Add a student first", { description: "Use Run setup wizard or the Roster tab to add your class." });
      return;
    }
    navigate(path);
    setGuide({ ...guide, path, key: Date.now() });
  };

  const actions = {
    positive: () =>
      guideTo("/", { selector: '[data-testid^="positive-btn-"]', hint: "Tap here to log your first positive skill!" }),
    support: () =>
      guideTo("/", { selector: '[data-testid^="needs-support-btn-"]', hint: "Tap here when a student needs support." }),
    iep: () => {
      const withSkill = periodStudents.find((st) => (skillsByStudent[st.id] || []).length > 0);
      if (withSkill) {
        const skill = skillsByStudent[withSkill.id][0];
        guideTo("/", {
          pre: `[data-testid="student-detail-trigger-${withSkill.id}"]`,
          selector: `[data-testid="skill-${skill.id}-slot-1"]`,
          hint: "Tap Ind, Pmt, or Ref on this skill.",
        });
        return;
      }
      const withPlan = periodStudents.find((st) => (iepGoalsByStudent[st.id] || []).length > 0);
      if (withPlan) {
        const goal = iepGoalsByStudent[withPlan.id][0];
        guideTo("/", {
          pre: `[data-testid="student-detail-trigger-${withPlan.id}"]`,
          selector: `[data-testid="iep-goal-${goal.id}-slot-1"]`,
          hint: "Tap Ind, Pmt, or Ref on this goal.",
        });
        return;
      }
      toast("Add a skill goal first", {
        description: "Open a student profile and add a skill. The same marks work on an IEP goal too.",
      });
    },
    digest: () =>
      guideTo("/digest", { selector: '[data-testid^="digest-queue-preview-btn-"]', hint: "Tap Email Preview to see this week's draft!" }),
    goal: () =>
      guideTo("/analytics", { selector: '[data-testid="analytics-class-goal"]', hint: "Your class-wide celebration goal lives here!", placement: "below" }),
  };

  const pct = Math.round((doneCount / CHECKLIST_STEPS.length) * 100);

  return (
    <div className="bg-white border border-teal-200 rounded-2xl mb-4 overflow-hidden" data-testid="getting-started-card">
      <div className="flex items-center gap-3 px-4 py-3 bg-teal-50/60">
        <span className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
          <Rocket className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900" style={{ fontFamily: "Outfit" }}>Welcome to WrenRoom</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-1.5 w-28 rounded-full bg-teal-100 overflow-hidden">
              <div className="h-full bg-teal-500 transition-[width] duration-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[11px] font-semibold text-slate-600" data-testid="checklist-progress">{doneCount} of 5 done</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => updateChecklist({ collapsed: !checklist.collapsed })}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-white"
          aria-label={checklist.collapsed ? "Expand checklist" : "Collapse checklist"}
          data-testid="checklist-toggle-btn"
        >
          {checklist.collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={() => updateChecklist({ dismissed: true })}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-white"
          aria-label="Close checklist"
          data-testid="checklist-close-btn"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {!checklist.collapsed && (
        <ul className="px-4 divide-y divide-slate-100" data-testid="checklist-items">
          {CHECKLIST_STEPS.map((s) => (
            <StepRow key={s.id} step={s} done={!!checklist.done[s.id]} onDo={actions[s.id]} />
          ))}
        </ul>
      )}
    </div>
  );
};
