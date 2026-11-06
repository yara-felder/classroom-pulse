import React, { useState } from "react";
import { Award, Pencil } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { computeMasteryStreak } from "@/components/goals/mastery";
import { useClassroom } from "@/context/ClassroomContext";

export const dayWord = (n) => `${n} ${Number(n) === 1 ? "day" : "days"}`;

const clamp = (v, min, max) => Math.min(max, Math.max(min, Math.round(Number(v) || 0)));

const MasteryEditor = ({ mastery, onSave, testidPrefix, close }) => {
  const [percent, setPercent] = useState(mastery.percent);
  const [days, setDays] = useState(mastery.days);
  const save = () => {
    onSave({ percent: clamp(percent, 1, 100), days: clamp(days, 1, 30) });
    close();
  };
  return (
    <div className="space-y-3" data-testid={`${testidPrefix}-mastery-editor`}>
      <p className="text-xs font-bold text-slate-800">Mastery target</p>
      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
        <Input
          type="number"
          min={1}
          max={100}
          value={percent}
          onChange={(e) => setPercent(e.target.value)}
          className="h-8 w-16 text-xs"
          data-testid={`${testidPrefix}-mastery-percent-input`}
        />
        <span>% independent over</span>
        <Input
          type="number"
          min={1}
          max={30}
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className="h-8 w-14 text-xs"
          data-testid={`${testidPrefix}-mastery-days-input`}
        />
        <span>{Number(days) === 1 ? "day" : "days"}</span>
      </div>
      <p className="text-[10px] text-slate-500">
        Days must be consecutive. The streak resets on any logged day below the target.
      </p>
      <Button
        size="sm"
        onClick={save}
        className="w-full h-8 bg-teal-600 hover:bg-teal-700 text-white text-xs"
        data-testid={`${testidPrefix}-mastery-save-btn`}
      >
        Save target
      </Button>
    </div>
  );
};

export const MasteryCriteria = ({ mastery, history, onSave, testidPrefix }) => {
  const [open, setOpen] = useState(false);
  const { can } = useClassroom();
  const { streak, met } = computeMasteryStreak(history, mastery);
  const shown = Math.min(streak, mastery.days);
  return (
    <div
      className={`mt-3 flex items-center justify-between gap-2 rounded-lg border px-3 py-2 ${
        met ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"
      }`}
      data-testid={`${testidPrefix}-mastery`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Award className={`w-4 h-4 shrink-0 ${met ? "text-emerald-600" : "text-slate-400"}`} />
        <div className="leading-tight min-w-0">
          <p className="text-[11px] font-semibold text-slate-700" data-testid={`${testidPrefix}-mastery-label`}>
            Mastery: {mastery.percent}% independent over {dayWord(mastery.days)}
          </p>
          <p
            className={`text-[11px] font-bold ${met ? "text-emerald-700" : "text-slate-500"}`}
            data-testid={`${testidPrefix}-mastery-progress`}
          >
            {met ? "Target met · " : ""}
            {shown} of {dayWord(mastery.days)} at {mastery.percent}% or more
          </p>
        </div>
      </div>
      {can("edit_goals") && (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[11px] text-teal-700 hover:text-teal-800 font-semibold shrink-0"
            data-testid={`${testidPrefix}-mastery-edit-btn`}
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72">
          {open && (
            <MasteryEditor
              mastery={mastery}
              onSave={onSave}
              testidPrefix={testidPrefix}
              close={() => setOpen(false)}
            />
          )}
        </PopoverContent>
      </Popover>
      )}
    </div>
  );
};
