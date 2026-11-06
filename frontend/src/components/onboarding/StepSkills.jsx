import React from "react";
import { Check } from "lucide-react";
import { SKILL_CATEGORIES } from "@/data/skillPresets";

// Standard starting chips: the first two objective goals in each category.
export const DEFAULT_ONBOARDING_SKILLS = SKILL_CATEGORIES.flatMap((c) => c.skills.slice(0, 2));

export const StepSkills = ({ selected, setSelected }) => {
  const toggle = (s) => setSelected((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  return (
    <div className="space-y-3" data-testid="onboarding-step-skills">
      <p className="text-xs text-slate-500">
        Checked skills become starting goals for every student you added in Step 2.{" "}
        <b data-testid="onboarding-skills-count">{selected.length} selected</b>
      </p>
      <div className="max-h-[300px] overflow-y-auto pr-1 space-y-3">
        {SKILL_CATEGORIES.map((cat) => (
          <div key={cat.id} data-testid={`onboarding-skill-category-${cat.id}`}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">{cat.label}</p>
            <div className="flex flex-wrap gap-1.5">
              {cat.skills.map((s) => {
                const on = selected.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(s)}
                    data-testid={`onboarding-skill-${s.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                    className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full border px-3 py-1.5 transition-colors ${
                      on ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-700 border-slate-200 hover:border-teal-300"
                    }`}
                  >
                    {on && <Check className="w-3 h-3" strokeWidth={3} />}
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
