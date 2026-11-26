import React, { useState, useMemo, useEffect } from "react";
import { Sparkles, Plus, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useClassroom } from "@/context/ClassroomContext";
import { POSITIVE_SKILLS } from "@/data/mockData";
import { dateFromTimeInput, timeInputValue } from "@/data/supportContext";
import { ActionChip } from "@/components/dialogs/ActionChip";
import { ReflectionNote } from "@/components/dialogs/ReflectionNote";

const CustomSkillDialog = ({ open, onOpenChange, onCreated }) => {
  const { addCustomSkill } = useClassroom();
  const [name, setName] = useState("");
  const [action, setAction] = useState("");

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Give the skill a name.");
      return;
    }
    const created = addCustomSkill(name.trim(), action.trim());
    toast.success(`Custom skill added: ${created.label}`);
    setName("");
    setAction("");
    onCreated?.(created);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="modal-custom-skill-dialog" className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "Outfit" }}>Create custom skill</DialogTitle>
          <DialogDescription>
            Add a positive skill unique to your class. It appears in the selectable list right away.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="custom-skill-name" className="text-xs font-semibold">
              Skill Name
            </Label>
            <Input
              id="custom-skill-name"
              data-testid="custom-skill-name-input"
              placeholder="e.g., Line Leader"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="custom-skill-action" className="text-xs font-semibold">
              Observable Action (optional)
            </Label>
            <Input
              id="custom-skill-action"
              data-testid="custom-skill-action-input"
              placeholder="e.g., Led line calmly"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="cancel-custom-skill-btn">
            Cancel
          </Button>
          <Button
            data-testid="submit-custom-skill-btn"
            onClick={handleSave}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            Add skill
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const PositiveDialog = ({ open, onOpenChange, student, log = null }) => {
  const { addPositive, customSkills, updateLog } = useClassroom();
  const [selected, setSelected] = useState([]);
  const [customOpen, setCustomOpen] = useState(false);
  const [notifyParent, setNotifyParent] = useState(false);
  const [note, setNote] = useState("");
  const [notePrivate, setNotePrivate] = useState(false);
  const [logTime, setLogTime] = useState(() => timeInputValue());

  useEffect(() => {
    if (!open) return;
    const when = log?.timestamp ? new Date(log.timestamp) : new Date();
    setSelected(log?.tag ? [log.tag] : []);
    setNotifyParent(!!(log?.notifyParent || log?.includeInDigest));
    setNote(log?.note || "");
    setNotePrivate(!!log?.notePrivate);
    setLogTime(timeInputValue(Number.isNaN(when.getTime()) ? new Date() : when));
  }, [open, log]);

  const allSkills = useMemo(() => [...POSITIVE_SKILLS, ...customSkills], [customSkills]);
  const timeBase = (() => {
    if (!log?.timestamp) return new Date();
    const parsed = new Date(log.timestamp);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  })();

  const toggle = (label) => {
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    );
  };

  const handleSubmit = () => {
    if (selected.length === 0) {
      toast.error("Pick at least one skill to log.");
      return;
    }
    const when = dateFromTimeInput(logTime, timeBase);
    const payload = {
      notifyParent,
      note: note.trim(),
      notePrivate,
      timestamp: when.toISOString(),
    };
    if (log?.id) {
      updateLog(log.id, {
        tag: selected[0],
        note: payload.note,
        notePrivate: !!(payload.note && notePrivate),
        notifyParent: !!notifyParent,
        includeInDigest: !!notifyParent,
        timestamp: payload.timestamp,
        logDate: when.toLocaleDateString("en-CA"),
      });
      selected.slice(1).forEach((skill) => addPositive(student.id, skill, payload));
      toast.success(`Skill updated — ${student.name}`, {
        description: selected.join(", "),
        duration: 2600,
      });
    } else {
      selected.forEach((skill) => addPositive(student.id, skill, payload));
      toast.success(`+${selected.length} pts — ${student.name}`, {
        description:
          `Logged: ${selected.join(", ")}` + (notifyParent ? " · queued for parent digest" : ""),
        duration: 2600,
      });
    }
    setSelected([]);
    setNotifyParent(false);
    onOpenChange(false);
  };

  const handleOpenChange = (v) => {
    if (!v) setSelected([]);
    onOpenChange(v);
  };

  const count = selected.length;
  const skills = log?.tag && !allSkills.some((skill) => skill.label === log.tag)
    ? [{ id: "saved-skill", title: log.tag, action: "", label: log.tag }, ...allSkills]
    : allSkills;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent data-testid="modal-positive-skill-dialog" className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2" style={{ fontFamily: "Outfit" }}>
            <span className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </span>
            <span>Positive Skills · {student.name}</span>
            <input
              type="time"
              aria-label="Time this happened"
              data-testid="positive-log-time"
              value={logTime}
              onChange={(event) => setLogTime(event.target.value)}
              className="h-8 rounded-lg border border-emerald-200 bg-emerald-50 px-2 text-sm font-bold text-emerald-950"
            />
          </DialogTitle>
          <DialogDescription>
            Tap every skill you saw. Each one earns +1 point. Change the time if you are logging it after class.
          </DialogDescription>
        </DialogHeader>

        {/* Add Custom Skill trigger */}
        <button
          data-testid="add-custom-skill-btn"
          onClick={() => setCustomOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-600 hover:border-teal-400 hover:text-teal-700 hover:bg-teal-50 transition-all text-sm font-semibold"
        >
          <Plus className="w-4 h-4" strokeWidth={2.6} />
          Add Custom Skill
        </button>

        {/* Skill grid */}
        <div className="grid grid-cols-2 gap-2 mt-1 max-h-[320px] overflow-y-auto pr-1" data-testid="positive-skills-grid">
          {skills.map((skill) => (
            <ActionChip
              key={skill.id}
              item={skill}
              tone="emerald"
              active={selected.includes(skill.label)}
              onToggle={() => toggle(skill.label)}
              testid={`skill-option-${skill.id}`}
              checkTestid={`skill-check-${skill.id}`}
            />
          ))}
        </div>

        <ReflectionNote
          prefix="positive"
          note={note}
          setNote={setNote}
          isPrivate={notePrivate}
          setPrivate={setNotePrivate}
          placeholder="Optional note (e.g., 'helped a classmate open their lunch')..."
        />

        <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <Checkbox
            id="positive-notify-parent"
            checked={notifyParent}
            onCheckedChange={setNotifyParent}
            data-testid="positive-notify-parent-checkbox"
          />
          <label
            htmlFor="positive-notify-parent"
            className="text-sm text-slate-700 font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 text-slate-500" />
            Include in Digest
          </label>
        </div>

        <DialogFooter className="mt-2 flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            data-testid="cancel-skill-btn"
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            data-testid="submit-skill-btn"
            onClick={handleSubmit}
            disabled={count === 0}
            className="w-full sm:flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1" strokeWidth={2.8} />
            <span data-testid="submit-skill-btn-label">
              {count === 0
                ? "Select at least one skill"
                : log?.id
                ? "Save skill"
                : `Log ${count} Skill${count === 1 ? "" : "s"} (+${count} Pts)`}
            </span>
          </Button>
        </DialogFooter>

        <CustomSkillDialog open={customOpen} onOpenChange={setCustomOpen} />
      </DialogContent>
    </Dialog>
  );
};
