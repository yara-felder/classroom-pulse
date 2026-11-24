import React, { useEffect, useMemo } from "react";
import { schoolWeekOptions } from "@/lib/pointCycle";

const buttonClass = "h-8 px-2.5 rounded-lg border text-xs font-semibold transition-colors";
const idleButton = `${buttonClass} border-slate-200 bg-white text-slate-700 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed`;

export const WeekNavigator = ({ weekOffset, minWeekOffset = 0, onChange }) => {
  const floor = Math.min(0, minWeekOffset);
  const options = useMemo(() => schoolWeekOptions(floor), [floor]);
  const selected = options.find((option) => option.offset === weekOffset) || options[0];

  useEffect(() => {
    const next = Math.min(0, Math.max(floor, weekOffset));
    if (next !== weekOffset) onChange(next);
  }, [weekOffset, floor, onChange]);

  return (
    <div className="flex flex-wrap items-center gap-1" data-testid="week-navigator">
      <select
        aria-label={selected ? `School week, ${selected.label}` : "School week"}
        value={String(weekOffset)}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-8 max-w-full rounded-lg border border-slate-200 bg-white pl-2.5 pr-2 text-xs font-semibold text-slate-700"
        data-testid="week-select"
      >
        {options.map((option) => (
          <option key={option.offset} value={String(option.offset)}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => onChange(Math.max(floor, weekOffset - 1))}
        disabled={weekOffset <= floor}
        className={idleButton}
        data-testid="week-previous"
      >
        &lt; Previous
      </button>
      {weekOffset < 0 && (
        <button
          type="button"
          onClick={() => onChange(0)}
          className={`${buttonClass} border-teal-200 bg-teal-50 text-teal-800 hover:border-teal-300`}
          data-testid="week-current"
        >
          This Week
        </button>
      )}
      <button
        type="button"
        onClick={() => onChange(Math.min(0, weekOffset + 1))}
        disabled={weekOffset === 0}
        className={idleButton}
        data-testid="week-next"
      >
        Next &gt;
      </button>
    </div>
  );
};
