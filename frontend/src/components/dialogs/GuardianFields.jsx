import React from "react";
import { Mail, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const isValidEmail = (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export const GuardianFields = ({ prefix, name, setName, email, setEmail, enabled, setEnabled }) => (
  <div className="space-y-2" data-testid={`${prefix}guardian-section`}>
    <Label className="text-xs font-semibold flex items-center gap-1">
      <UserRound className="w-3.5 h-3.5 text-teal-600" />
      Guardian Information
    </Label>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <Input
        data-testid={`${prefix}guardian-name-input`}
        placeholder="Guardian name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="relative">
        <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          data-testid={`${prefix}guardian-email-input`}
          type="email"
          placeholder="guardian@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`pl-8 ${isValidEmail(email) ? "" : "border-rose-400 focus-visible:ring-rose-300"}`}
        />
      </div>
    </div>
    <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-slate-800">Parent Digest</span>
        <span className="text-[10px] text-slate-500 font-medium">
          Include this student in the weekly guardian email
        </span>
      </div>
      <Switch
        data-testid={`${prefix}parent-digest-toggle`}
        checked={enabled}
        onCheckedChange={setEnabled}
        className="data-[state=checked]:bg-teal-600"
      />
    </div>
  </div>
);
