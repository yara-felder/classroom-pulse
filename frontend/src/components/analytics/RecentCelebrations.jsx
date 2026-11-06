import React from "react";
import { Award, Flame, Star, TrendingUp, PartyPopper } from "lucide-react";
import { format } from "date-fns";

const KIND = {
  mastered: { icon: Award, tone: "bg-indigo-100 text-indigo-700" },
  best: { icon: Star, tone: "bg-amber-100 text-amber-700" },
  streak: { icon: Flame, tone: "bg-rose-100 text-rose-600" },
  growth: { icon: TrendingUp, tone: "bg-emerald-100 text-emerald-700" },
};

export const RecentCelebrations = ({ items, onOpenStudent }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-5" data-testid="recent-celebrations">
    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: "Outfit" }}>
      <PartyPopper className="w-4 h-4 text-amber-500" /> Recent Celebrations
    </h3>
    {items.length === 0 ? (
      <p className="text-sm text-slate-500 mt-4" data-testid="recent-celebrations-empty">
        Milestones will appear here as students grow.
      </p>
    ) : (
      <ul className="mt-4 space-y-3 max-h-[300px] overflow-y-auto pr-1">
        {items.map((c, i) => {
          const { icon: Icon, tone } = KIND[c.kind];
          return (
            <li key={`${c.student.id}-${c.kind}-${i}`}>
              <button
                type="button"
                onClick={() => onOpenStudent(c.student)}
                className="w-full flex items-start gap-3 text-left rounded-lg hover:bg-slate-50 px-1 -mx-1 py-1 transition-colors"
                data-testid={`celebration-item-${i}`}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tone}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-900" style={{ fontFamily: "Outfit" }}>
                    {c.student.name}
                  </span>
                  <span className="block text-xs text-slate-600 leading-snug">{c.text}</span>
                  {c.date && (
                    <span className="block text-[10px] text-slate-400 mt-0.5">{format(new Date(`${c.date}T12:00:00`), "MMM d")}</span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    )}
  </div>
);
