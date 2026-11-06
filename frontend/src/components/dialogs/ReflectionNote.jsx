import React from "react";
import { Lock } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export const PrivateToggle = ({ prefix, checked, onChange }) => (
  <label className="flex items-center justify-between gap-2 text-xs text-slate-600 font-medium px-1" htmlFor={`${prefix}-private-note`}>
    <span className="flex items-center gap-1.5">
      <Lock className="w-3.5 h-3.5 text-slate-500" />
      Private reflection
      <span className="text-[10px] text-slate-400 font-normal">(only you; never in the digest)</span>
    </span>
    <Switch id={`${prefix}-private-note`} checked={checked} onCheckedChange={onChange} data-testid={`${prefix}-private-note-toggle`} />
  </label>
);

export const ReflectionNote = ({ prefix, note, setNote, isPrivate, setPrivate, placeholder }) => (
  <div className="space-y-1.5">
    <Textarea
      data-testid={`${prefix}-note-textarea`}
      placeholder={placeholder}
      value={note}
      onChange={(e) => setNote(e.target.value)}
      className="min-h-[64px] resize-none"
    />
    <PrivateToggle prefix={prefix} checked={isPrivate} onChange={setPrivate} />
  </div>
);
