import React from "react";

const buttonClass = "h-8 px-2.5 rounded-lg border text-xs font-semibold transition-colors";

export const WeekNavigator = ({ weekOffset, onChange }) => (
  <div className="flex items-center gap-1" data-testid="week-navigator">
    <button
      type="button"
      onClick={() => onChange(weekOffset - 1)}
      className={`${buttonClass} border-slate-200 bg-white text-slate-700 hover:border-slate-300`}
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
      className={`${buttonClass} border-slate-200 bg-white text-slate-700 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed`}
      data-testid="week-next"
    >
      Next &gt;
    </button>
  </div>
);
