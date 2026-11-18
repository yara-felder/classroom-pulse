import React from "react";
import { ChevronRight } from "lucide-react";
import { STATUS_GROUPS } from "@/lib/celebrations";
import { StudentAvatar } from "@/components/StudentAvatar";

const TONES = {
  emerald: { head: "bg-emerald-50 border-emerald-200 text-emerald-800", dot: "bg-emerald-500" },
  sky: { head: "bg-sky-50 border-sky-200 text-sky-800", dot: "bg-sky-500" },
  amber: { head: "bg-amber-50 border-amber-200 text-amber-800", dot: "bg-amber-500" },
};

export const ProgressDistribution = ({ groups, onOpenStudent, hideNames = false }) => {
  const total = STATUS_GROUPS.reduce((n, g) => n + (groups[g.id] || []).length, 0) || 1;
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 mt-5" data-testid="per-student-breakdown">
      <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: "Outfit" }}>
        Roster Progress Distribution
      </h3>
      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
        Grouped by growth stage this cycle. Tap a student to see their weekday performance and export a PDF history report.
      </p>
      <div className="flex h-2.5 rounded-full overflow-hidden mt-4 bg-slate-100" data-testid="distribution-bar">
        {STATUS_GROUPS.map((g) => (
          <div
            key={g.id}
            className={`${TONES[g.tone].dot} transition-[width] duration-700`}
            style={{ width: `${((groups[g.id] || []).length / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
        {STATUS_GROUPS.map((g) => {
          const list = groups[g.id] || [];
          return (
            <div key={g.id} className="border border-slate-200 rounded-xl overflow-hidden" data-testid={`status-group-${g.id}`}>
              <div className={`px-3 py-2.5 border-b min-h-[64px] ${TONES[g.tone].head}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold leading-tight" style={{ fontFamily: "Outfit" }} data-testid={`status-group-title-${g.id}`}>{g.label}</span>
                  <span className="text-xs font-extrabold" data-testid={`status-group-count-${g.id}`}>{list.length}</span>
                </div>
                <p className="text-[11px] font-medium leading-snug opacity-80 mt-0.5" data-testid={`status-group-subtitle-${g.id}`}>{g.hint}</p>
              </div>
              {list.length === 0 ? (
                <p className="text-xs text-slate-400 px-3 py-3">No students</p>
              ) : hideNames ? (
                <p className="text-xs text-slate-500 px-3 py-3" data-testid={`status-group-aggregate-${g.id}`}>
                  {list.length} student{list.length === 1 ? "" : "s"} (names hidden: aggregate-only access)
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {list.map((s) => (
                    <li key={s.id}>
                      <button
                        data-testid={`student-analytics-row-${s.id}`}
                        onClick={() => onOpenStudent(s)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                      >
                        <StudentAvatar name={s.name} id={s.id} size="sm" />
                        <span className="flex-1 min-w-0 text-sm font-semibold text-slate-800 truncate">{s.name}</span>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
