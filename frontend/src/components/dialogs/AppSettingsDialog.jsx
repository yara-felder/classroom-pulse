import React, { useEffect, useState } from "react";
import { Settings, Mail, Zap, ShieldCheck, Coins, Lock, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useClassroom } from "@/context/ClassroomContext";
import { WEEK_DAYS, scheduleLabel } from "@/lib/digestSchedule";
import { PointSystemSettings } from "@/components/dialogs/PointSystemSettings";
import { PrivacySettings } from "@/components/dialogs/PrivacySettings";
import { SchoolAccessPanel } from "@/components/dialogs/SchoolAccessPanel";

const MODES = [
  { id: "auto", label: "Automatic Send", hint: "Digests go out on schedule", icon: Zap },
  { id: "review", label: "Require Teacher Approval", hint: "Review each digest, then send", icon: ShieldCheck },
];

const ModePicker = ({ value, onChange }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup">
    {MODES.map(({ id, label, hint, icon: Icon }) => (
      <button
        key={id}
        type="button"
        role="radio"
        aria-checked={value === id}
        data-testid={`digest-mode-${id}`}
        onClick={() => onChange(id)}
        className={`text-left rounded-xl border px-3 py-2.5 transition-colors ${
          value === id ? "border-teal-500 bg-teal-50" : "border-slate-200 bg-white hover:border-slate-300"
        }`}
      >
        <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          <Icon className={`w-4 h-4 ${value === id ? "text-teal-600" : "text-slate-400"}`} />
          {label}
        </span>
        <span className="text-[11px] text-slate-500">{hint}</span>
      </button>
    ))}
  </div>
);

export const AppSettingsDialog = ({ open, onOpenChange, initialTab = "digest", focusSection = "", initialStudentId = "" }) => {
  const { digestSettings, updateDigestSettings, pointSettings, updatePointSettings, privacySettings, updatePrivacySettings, role, students } = useClassroom();
  const [draft, setDraft] = useState(digestSettings);
  const [pointDraft, setPointDraft] = useState(pointSettings);
  const [privacyDraft, setPrivacyDraft] = useState(privacySettings);

  useEffect(() => {
    if (open) {
      setDraft(digestSettings);
      setPointDraft(pointSettings);
      setPrivacyDraft(privacySettings);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps -- reset the draft only when the dialog opens

  const set = (k) => (v) => setDraft((d) => ({ ...d, [k]: v }));
  const setPoint = (k) => (v) => setPointDraft((d) => ({ ...d, [k]: v }));

  const isAdmin = role === "admin";
  const activeTab = isAdmin ? "school" : initialTab;

  const save = () => {
    if (isAdmin) {
      onOpenChange(false);
      return;
    }
    if (!draft.time) {
      toast.error("Choose a dispatch time.");
      return;
    }
    const customTarget = Math.round(Number(pointDraft.customTarget));
    if (pointDraft.goalMode === "custom" && !(customTarget >= 1)) {
      toast.error("Enter a custom class target of at least 1.");
      return;
    }
    updateDigestSettings({ day: draft.day, time: draft.time, approvalMode: draft.approvalMode, header: draft.header, footer: draft.footer });
    updatePrivacySettings(privacyDraft);
    updatePointSettings({
      cadence: pointDraft.cadence,
      goalMode: pointDraft.goalMode,
      baselineWeeks: pointDraft.baselineWeeks,
      stretch: pointDraft.stretch,
      customTarget: customTarget || pointSettings.customTarget,
      ...(pointDraft.cadence !== pointSettings.cadence ? { cycleStartSeen: null } : {}),
    });
    toast.success("Settings saved", { description: `Weekly digest: ${scheduleLabel(draft)}` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="modal-app-settings" className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ fontFamily: "Outfit" }}>
            <Settings className="w-5 h-5 text-teal-600" /> App Settings
          </DialogTitle>
          <DialogDescription>
            {isAdmin
              ? focusSection === "caseload"
                ? "Assign this student to a case manager."
                : "Invite teachers and case managers into your school."
              : "Configure how Classroom Pulse works for your classes."}
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue={activeTab}>
          <TabsList className={isAdmin ? "w-fit" : "w-full grid grid-cols-4"}>
            {!isAdmin && (
              <TabsTrigger value="digest" data-testid="settings-tab-digest">
                <Mail className="w-4 h-4 mr-1.5" /> Digest
              </TabsTrigger>
            )}
            {!isAdmin && (
              <TabsTrigger value="points" data-testid="settings-tab-points">
                <Coins className="w-4 h-4 mr-1.5" /> Points
              </TabsTrigger>
            )}
            {!isAdmin && (
              <TabsTrigger value="privacy" data-testid="settings-tab-privacy">
                <Lock className="w-4 h-4 mr-1.5" /> Privacy
              </TabsTrigger>
            )}
            <TabsTrigger value="school" data-testid="settings-tab-school">
              <Building2 className="w-4 h-4 mr-1.5" /> School
            </TabsTrigger>
          </TabsList>
          {!isAdmin && (
            <TabsContent value="privacy" className="mt-4">
              <PrivacySettings />
            </TabsContent>
          )}
          <TabsContent value="school" className="mt-4">
            <SchoolAccessPanel
              role={role}
              students={students}
              focusSection={open ? focusSection : ""}
              initialStudentId={open ? initialStudentId : ""}
            />
          </TabsContent>
          {!isAdmin && (
          <TabsContent value="points" className="mt-4">
            <PointSystemSettings draft={pointDraft} set={setPoint} />
          </TabsContent>
          )}
          {!isAdmin && (
          <TabsContent value="digest" className="space-y-5 mt-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Weekly Delivery Schedule</Label>
              <div className="flex gap-2">
                <Select value={String(draft.day)} onValueChange={(v) => set("day")(Number(v))}>
                  <SelectTrigger className="flex-1" data-testid="digest-day-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEK_DAYS.map((d, i) => (
                      <SelectItem key={d} value={String(i)} data-testid={`digest-day-option-${i}`}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="time"
                  value={draft.time}
                  onChange={(e) => set("time")(e.target.value)}
                  className="w-36"
                  data-testid="digest-time-input"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Approval Mode</Label>
              <ModePicker value={draft.approvalMode} onChange={set("approvalMode")} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Custom Greeting (optional)</Label>
              <Textarea
                data-testid="digest-header-input"
                placeholder="e.g. Happy Friday! Here's what we celebrated this week…"
                value={draft.header}
                onChange={(e) => set("header")(e.target.value)}
                className="min-h-[70px] text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Custom Sign-off (optional)</Label>
              <Textarea
                data-testid="digest-footer-input"
                placeholder="e.g. Warmly, Ms. Rivera · Room 12"
                value={draft.footer}
                onChange={(e) => set("footer")(e.target.value)}
                className="min-h-[60px] text-sm"
              />
            </div>
          </TabsContent>
          )}
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="settings-cancel-btn">
            {isAdmin ? "Close" : "Cancel"}
          </Button>
          {!isAdmin && (
            <Button onClick={save} className="bg-teal-600 hover:bg-teal-700 text-white" data-testid="settings-save-btn">
              Save Settings
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
