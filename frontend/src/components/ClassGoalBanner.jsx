import React from "react";
import { Trophy, PartyPopper } from "lucide-react";
import { useClassroom } from "@/context/ClassroomContext";
import { classGoal, cycleRangeLabel } from "@/lib/pointCycle";

export const useClassGoal = (periodStudents) => {
  const { pointSettings, logs } = useClassroom();
  return classGoal(pointSettings, periodStudents, logs);
};

export const ClassGoalBanner = ({ periodStudents, progress, rangeLabel, testid = "class-goal-banner" }) => {
  const goal = useClassGoal(periodStudents);
  const completed = progress == null ? goal.progress : progress;
  const pct = Math.min(100, Math.round((completed / Math.max(1, goal.target)) * 100));
  const done = completed >= goal.target;
  const Icon = done ? PartyPopper : Trophy;
  return (
    <div
      data-testid={testid}
      className={`rounded-2xl border p-4 sm:p-5 ${done ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"}`}
    >
      <div className="flex items-start gap-3">
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${done ? "bg-emerald-500 text-white" : "bg-amber-100 text-amber-600"}`}>
          <Icon className="w-5 h-5" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <p className="text-sm sm:text-base font-bold text-slate-900" style={{ fontFamily: "Outfit" }} data-testid={`${testid}-copy`}>
              Class Goal: {completed} / {goal.target} Positive Moments Logged
              <span className="text-slate-500 font-semibold"> ({pct}% Complete{done ? "" : "!"})</span>
            </p>
            <span className="text-[11px] font-semibold text-slate-500">{rangeLabel || cycleRangeLabel(goal.bounds)}</span>
          </div>
          <div className="mt-2 h-3 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div
              data-testid={`${testid}-bar`}
              className={`h-full rounded-full transition-[width] duration-1000 ease-out ${done ? "bg-emerald-500" : "bg-gradient-to-r from-amber-400 to-emerald-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {done && (
            <p className="mt-2 text-xs font-bold text-emerald-700" data-testid={`${testid}-achieved`}>
              Class Goal Achieved! Time to celebrate together.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
