import React, { useState, useEffect, useRef } from "react";
import { UserCog, Save, Trash2, AlertTriangle, Plus, Check, X, Layers, Target, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useClassroom } from "@/context/ClassroomContext";
import { useAuth } from "@/context/AuthContext";
import { SKILL_CATEGORIES, ALL_PRESET_SKILLS } from "@/data/skillPresets";
import { GuardianFields, isValidEmail } from "@/components/dialogs/GuardianFields";

const CATEGORY_HEADER_STYLES = {
  indigo: {
    active: "bg-indigo-500 text-white border-indigo-500",
    idle: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100",
  },
  teal: {
    active: "bg-teal-500 text-white border-teal-500",
    idle: "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100",
  },
  amber: {
    active: "bg-amber-500 text-white border-amber-500",
    idle: "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100",
  },
  emerald: {
    active: "bg-emerald-500 text-white border-emerald-500",
    idle: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  },
};

const splitName = (full) => {
  const parts = (full || "").trim().split(/\s+/);
  return { first: parts[0] || "", last: parts.slice(1).join(" ") || "" };
};

const initialPeriodIds = (student, fallback) => {
  if (Array.isArray(student?.periodIds) && student.periodIds.length > 0) return [...student.periodIds];
  if (student?.periodId) return [student.periodId];
  return [fallback];
};

export const EditStudentDialog = ({ open, onOpenChange, student }) => {
  const { updateStudent, deleteStudent, skillsByStudent, addSkill, classSection } = useClassroom();
  const { user } = useAuth();
  const periods = user?.periods || [];

  const { first, last } = splitName(student?.name);
  const [firstName, setFirstName] = useState(first);
  const [lastName, setLastName] = useState(last);
  const [iep, setIep] = useState(!!student?.iep);
  const [plan504, setPlan504] = useState(!!student?.plan504);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [periodIds, setPeriodIds] = useState(initialPeriodIds(student, classSection));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [guardianName, setGuardianName] = useState(student?.guardianName || "");
  const [guardianEmail, setGuardianEmail] = useState(student?.guardianEmail || "");
  const [parentDigestEnabled, setParentDigestEnabled] = useState(student?.parentDigestEnabled !== false);
  const [customSkills, setCustomSkills] = useState([]);
  const [customSkillDraft, setCustomSkillDraft] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [openCategories, setOpenCategories] = useState(() =>
    Object.fromEntries(SKILL_CATEGORIES.map((c) => [c.id, false]))
  );
  const customInputRef = useRef(null);

  useEffect(() => {
    if (!open || !student) return;
    const { first: f, last: l } = splitName(student.name);
    setFirstName(f);
    setLastName(l);
    setIep(!!student.iep);
    setPlan504(!!student.plan504);
    setPeriodIds(initialPeriodIds(student, classSection));
    setGuardianName(student.guardianName || "");
    setGuardianEmail(student.guardianEmail || "");
    setParentDigestEnabled(student.parentDigestEnabled !== false);
    const currentSkills = (skillsByStudent[student.id] || []).map((sk) => sk.name);
    setSelectedSkills(currentSkills);
    // Any current-skill name not in the preset library becomes an inline custom row
    const extras = currentSkills.filter(
      (n) => !ALL_PRESET_SKILLS.some((p) => p.toLowerCase() === n.toLowerCase())
    );
    setCustomSkills(extras);
    setShowCustomInput(false);
    setCustomSkillDraft("");
    setOpenCategories(Object.fromEntries(SKILL_CATEGORIES.map((c) => [c.id, false])));
  }, [open, student, skillsByStudent, classSection]);

  const togglePeriod = (id) => {
    setPeriodIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleSkill = (name) => {
    setSelectedSkills((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const commitCustomSkill = () => {
    const name = customSkillDraft.trim();
    if (!name) {
      setShowCustomInput(false);
      return;
    }
    if (
      ALL_PRESET_SKILLS.some((p) => p.toLowerCase() === name.toLowerCase()) ||
      customSkills.some((p) => p.toLowerCase() === name.toLowerCase())
    ) {
      toast.error("That skill is already in the list.");
      return;
    }
    setCustomSkills((prev) => [...prev, name]);
    setSelectedSkills((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setCustomSkillDraft("");
    setShowCustomInput(false);
  };

  const handleSave = () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First and Last name are required.");
      return;
    }
    if (periodIds.length === 0) {
      toast.error("Assign at least one class period.");
      return;
    }
    if (!isValidEmail(guardianEmail)) {
      toast.error("Enter a valid guardian email.");
      return;
    }
    updateStudent(student.id, {
      guardianName: guardianName.trim(),
      guardianEmail: guardianEmail.trim(),
      parentDigestEnabled,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      iep,
      plan504,
      periodIds,
    });
    const existing = (skillsByStudent[student.id] || []).map((sk) => sk.name);
    selectedSkills.forEach((n) => {
      if (!existing.includes(n)) addSkill(student.id, n);
    });
    toast.success("Profile updated", {
      description: `${firstName.trim()} ${lastName.trim()} · saved`,
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    const name = student.name;
    deleteStudent(student.id);
    setConfirmDelete(false);
    onOpenChange(false);
    toast.success(`${name} removed from roster`, {
      description: "All associated logs and goals were deleted.",
    });
  };

  if (!student) return null;

  const toggleCategory = (id) =>
    setOpenCategories((prev) => ({ ...prev, [id]: !prev[id] }));

  const renderSkillChip = (name) => {
    const active = selectedSkills.includes(name);
    return (
      <button
        key={name}
        type="button"
        data-testid={`edit-preset-skill-${name.toLowerCase().replace(/\s+/g, "-")}`}
        onClick={() => toggleSkill(name)}
        aria-pressed={active}
        className={`relative text-xs font-semibold rounded-full border px-3 py-1.5 text-left leading-snug transition-colors ${
          active
            ? "bg-teal-500 text-white border-teal-500 shadow-sm"
            : "bg-white text-slate-700 border-slate-200 hover:border-teal-300 hover:bg-teal-50"
        }`}
      >
        {active && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white text-teal-600 flex items-center justify-center">
            <Check className="w-3 h-3" strokeWidth={3} />
          </span>
        )}
        <span className="pr-4">{name}</span>
      </button>
    );
  };

  // Custom skills that don't fit in a preset category (kept from the student's saved list)
  const orphanCustomSkills = customSkills.filter(
    (n) => !ALL_PRESET_SKILLS.some((p) => p.toLowerCase() === n.toLowerCase())
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          data-testid="modal-edit-student-dialog"
          className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: "Outfit" }}>
              <span className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                <UserCog className="w-4 h-4 text-teal-700" />
              </span>
              Edit Student
            </DialogTitle>
            <DialogDescription>
              Updates apply instantly across the roster, dashboard, and analytics.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-first-name" className="text-xs font-semibold">
                  First Name
                </Label>
                <Input
                  id="edit-first-name"
                  data-testid="edit-first-name-input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-last-name" className="text-xs font-semibold">
                  Last Name
                </Label>
                <Input
                  id="edit-last-name"
                  data-testid="edit-last-name-input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            {/* Assigned Class Period(s) — multi-select chips */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  Assigned Class Period(s)
                </Label>
                <span className="text-[10px] text-slate-500 font-medium" data-testid="edit-assigned-periods-count">
                  {periodIds.length} selected
                </span>
              </div>
              <div
                className="grid grid-cols-2 sm:grid-cols-3 gap-1.5"
                data-testid="edit-assigned-periods-grid"
              >
                {periods.length === 0 ? (
                  <div className="col-span-full text-[11px] text-slate-500 italic px-1 py-2">
                    No periods configured. Manage periods from the profile menu.
                  </div>
                ) : (
                  periods.map((p) => {
                    const active = periodIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        data-testid={`edit-assigned-period-chip-${p.id}`}
                        onClick={() => togglePeriod(p.id)}
                        aria-pressed={active}
                        className={`relative text-xs font-semibold rounded-lg border px-3 py-2 text-left transition-all ${
                          active
                            ? "bg-indigo-500 text-white border-indigo-500 shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"
                        }`}
                      >
                        {active && (
                          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white text-indigo-600 flex items-center justify-center">
                            <Check className="w-3 h-3" strokeWidth={3} />
                          </span>
                        )}
                        <span className="pr-4">{p.name}</span>
                      </button>
                    );
                  })
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5">
                Appears on every selected period's roster with one unified profile for IEP and analytics.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-800">IEP Active</span>
                  <span className="text-[10px] text-slate-500 font-medium">Individualized plan</span>
                </div>
                <Switch
                  data-testid="edit-iep-toggle"
                  checked={iep}
                  onCheckedChange={setIep}
                  className="data-[state=checked]:bg-indigo-600"
                />
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-800">504 Active</span>
                  <span className="text-[10px] text-slate-500 font-medium">Accommodations plan</span>
                </div>
                <Switch
                  data-testid="edit-plan504-toggle"
                  checked={plan504}
                  onCheckedChange={setPlan504}
                  className="data-[state=checked]:bg-teal-600"
                />
              </div>
            </div>

            <GuardianFields
              prefix="edit-"
              name={guardianName}
              setName={setGuardianName}
              email={guardianEmail}
              setEmail={setGuardianEmail}
              enabled={parentDigestEnabled}
              setEnabled={setParentDigestEnabled}
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-teal-600" />
                  Assigned Skill Goals
                </Label>
                <span className="text-[10px] text-slate-500 font-medium">
                  {selectedSkills.length} selected
                </span>
              </div>
              <div className="space-y-2.5" data-testid="edit-preset-skills-grid">
                {SKILL_CATEGORIES.map((cat) => {
                  const open = !!openCategories[cat.id];
                  const stylePair = CATEGORY_HEADER_STYLES[cat.color];
                  const selectedInCat = cat.skills.filter((s) => selectedSkills.includes(s)).length;
                  return (
                    <div key={cat.id} data-testid={`edit-skill-category-${cat.id}`}>
                      <button
                        type="button"
                        data-testid={`edit-skill-category-toggle-${cat.id}`}
                        onClick={() => toggleCategory(cat.id)}
                        aria-expanded={open}
                        className={`w-full inline-flex items-center justify-between gap-2 text-xs font-bold rounded-full border px-3 py-1.5 transition-all ${
                          selectedInCat > 0 ? stylePair.active : stylePair.idle
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {cat.label}
                          {selectedInCat > 0 && (
                            <span className="text-[10px] bg-white/25 rounded-full px-1.5 py-0.5">
                              {selectedInCat}
                            </span>
                          )}
                        </span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
                        />
                      </button>
                      {open && (
                        <div
                          className="flex flex-wrap gap-1.5 mt-1.5 max-h-56 overflow-y-auto pr-1 overscroll-contain"
                          data-testid={`edit-skill-category-chips-${cat.id}`}
                        >
                          {cat.skills.map(renderSkillChip)}
                        </div>
                      )}
                    </div>
                  );
                })}

                {orphanCustomSkills.length > 0 && (
                  <div data-testid="edit-skill-category-custom">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Custom
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {orphanCustomSkills.map(renderSkillChip)}
                    </div>
                  </div>
                )}

                {!showCustomInput && (
                  <button
                    type="button"
                    data-testid="edit-add-custom-skill-btn"
                    onClick={() => {
                      setShowCustomInput(true);
                      setTimeout(() => customInputRef.current?.focus(), 30);
                    }}
                    className="w-full text-xs font-semibold rounded-lg border border-dashed border-slate-300 text-slate-600 hover:border-teal-400 hover:text-teal-700 hover:bg-teal-50 px-3 py-2 text-left transition-colors inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" strokeWidth={2.6} />
                    Add Custom Skill
                  </button>
                )}
              </div>

              {showCustomInput && (
                <div
                  data-testid="edit-custom-skill-input-row"
                  className="mt-2 flex items-center gap-2"
                >
                  <Input
                    ref={customInputRef}
                    data-testid="edit-custom-skill-input"
                    placeholder="e.g. Raise Hand Before Speaking"
                    value={customSkillDraft}
                    onChange={(e) => setCustomSkillDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitCustomSkill();
                      } else if (e.key === "Escape") {
                        setShowCustomInput(false);
                        setCustomSkillDraft("");
                      }
                    }}
                    className="h-9"
                  />
                  <Button
                    type="button"
                    data-testid="edit-save-custom-skill-btn"
                    onClick={commitCustomSkill}
                    className="h-9 bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" strokeWidth={3} /> Add
                  </Button>
                  <button
                    type="button"
                    aria-label="Cancel custom skill"
                    data-testid="edit-cancel-custom-skill-btn"
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomSkillDraft("");
                    }}
                    className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-rose-500 hover:border-rose-300 flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <p className="text-[10px] text-slate-500 mt-1.5">
                Currently assigned skills are pre-checked. Removing here does not delete existing trial history.
              </p>
            </div>
          </div>

          <DialogFooter className="mt-4 flex-col sm:flex-row gap-2 sm:justify-between">
            <Button
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
              data-testid="delete-student-btn"
              className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600 text-white font-semibold shadow-sm"
            >
              <Trash2 className="w-4 h-4 mr-1.5" strokeWidth={2.6} />
              Delete Student
            </Button>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="cancel-edit-student-btn"
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                data-testid="save-edit-student-btn"
                onClick={handleSave}
                className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-sm"
              >
                <Save className="w-4 h-4 mr-1.5" strokeWidth={2.6} />
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent data-testid="modal-confirm-delete-student">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2" style={{ fontFamily: "Outfit" }}>
              <span className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </span>
              Delete student?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <b>{student.name}</b>? This action cannot be undone.
              All their skill goals, IEP/504 plans, trials, and behavior logs will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete-student-btn">Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-testid="confirm-delete-student-btn"
              onClick={handleDelete}
              className="bg-rose-500 hover:bg-rose-600 text-white"
            >
              <Trash2 className="w-4 h-4 mr-1.5" strokeWidth={2.6} />
              Yes, delete student
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
