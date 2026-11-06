import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CADENCES } from "@/lib/pointCycle";
import { WEEK_DAYS } from "@/lib/digestSchedule";

const Opt = ({ active, onClick, title, hint, testid }) => (
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

export const StepClass = ({ form, set }) => (
  <div className="space-y-4" data-testid="onboarding-step-class">
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold">Class Name</Label>
      <Input
        data-testid="onboarding-class-name-input"
        value={form.className}
        onChange={(e) => set("className")(e.target.value)}
        placeholder="e.g., 3rd Grade · Period 2 Math"
      />
    </div>
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold">Point Reset Cadence</Label>
      <Select value={form.cadence} onValueChange={set("cadence")}>
        <SelectTrigger data-testid="onboarding-cadence-select"><SelectValue /></SelectTrigger>
        <SelectContent>
          {CADENCES.map((c) => (
            <SelectItem key={c.id} value={c.id} data-testid={`onboarding-cadence-${c.id}`}>{c.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>
);

export const StepDigest = ({ form, set }) => (
  <div className="space-y-4" data-testid="onboarding-step-digest">
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold">Parent Digest review schedule</Label>
      <div className="flex gap-2">
        <Select value={String(form.day)} onValueChange={(v) => set("day")(Number(v))}>
          <SelectTrigger className="flex-1" data-testid="onboarding-digest-day-select"><SelectValue /></SelectTrigger>
          <SelectContent>
            {WEEK_DAYS.map((d, i) => (
              <SelectItem key={d} value={String(i)} data-testid={`onboarding-digest-day-${i}`}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="time" value={form.time} onChange={(e) => set("time")(e.target.value)} className="w-36" data-testid="onboarding-digest-time-input" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1" role="radiogroup">
        <Opt active={form.approvalMode === "review"} onClick={() => set("approvalMode")("review")} title="Require Teacher Approval" hint="Review each digest before it sends" testid="onboarding-digest-mode-review" />
        <Opt active={form.approvalMode === "auto"} onClick={() => set("approvalMode")("auto")} title="Automatic Send" hint="Digests go out on schedule" testid="onboarding-digest-mode-auto" />
      </div>
    </div>
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold">Class Goal</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup">
        <Opt active={form.goalMode === "auto"} onClick={() => set("goalMode")("auto")} title="Auto-Calculate from Baseline" hint="Adapts to your class over time" testid="onboarding-goal-auto" />
        <Opt active={form.goalMode === "custom"} onClick={() => set("goalMode")("custom")} title="Custom Target" hint="Set a fixed number" testid="onboarding-goal-custom" />
      </div>
      {form.goalMode === "custom" && (
        <Input
          type="number"
          min={1}
          value={form.customTarget}
          onChange={(e) => set("customTarget")(e.target.value)}
          className="w-40"
          data-testid="onboarding-goal-custom-input"
        />
      )}
    </div>
  </div>
);
