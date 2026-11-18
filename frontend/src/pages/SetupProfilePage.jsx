import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  School,
  Users,
  Building2,
  ArrowRight,
  ArrowLeft,
  Check,
  Trash2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

import { ACCESS_ROLES } from "@/lib/rbac";

const TITLES_BY_ACCESS = {
  teacher: [
    "Special Education Teacher",
    "Gen-Ed Teacher",
    "Paraprofessional",
    "Instructional Aide",
  ],
  admin: [
    "Principal",
    "Assistant Principal",
    "Special Education Director",
    "Program Coordinator",
  ],
  case_manager: [
    "IEP Case Manager",
    "BCBA",
    "Speech-Language Pathologist (SLP)",
    "School Psychologist",
  ],
};

const titlesFor = (accessRole) => TITLES_BY_ACCESS[accessRole] || TITLES_BY_ACCESS.teacher;

const titleTestId = (title) => `role-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`;

const STEP_LABELS = ["Basic Info", "School Structure", "Classes & Periods"];

const makePeriods = (count) =>
  Array.from({ length: count }, (_, i) => ({
    id: `cls-${Date.now().toString(36)}-${i}`,
    name: `Period ${i + 1}`,
  }));

export default function SetupProfilePage() {
  const navigate = useNavigate();
  const { user, updateProfile, signOut } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(user?.name || "");
  const [accessRole, setAccessRole] = useState(user?.accessRole || "teacher");
  const startingTitles = titlesFor(user?.accessRole || "teacher");
  const startingRole = user?.role || "";
  const startingIsOther = startingRole.length > 0 && !startingTitles.includes(startingRole);
  const [role, setRole] = useState(startingRole);
  const [otherSelected, setOtherSelected] = useState(startingIsOther);
  const [otherTitle, setOtherTitle] = useState(startingIsOther ? startingRole : "");
  const [schoolName, setSchoolName] = useState(user?.schoolName || "");
  const [schoolType, setSchoolType] = useState(user?.schoolType || "");
  const savedPeriods = Array.isArray(user?.periods) ? user.periods.filter((p) => p?.id && p?.name) : [];
  const [classroomName, setClassroomName] = useState(
    user?.schoolType === "elementary" && savedPeriods[0]?.name ? savedPeriods[0].name : "Room 104 · 3rd Grade"
  );
  const [periodCount, setPeriodCount] = useState(savedPeriods.length || 6);
  const [periods, setPeriods] = useState(
    savedPeriods.length ? savedPeriods.map((p) => ({ id: p.id, name: p.name })) : makePeriods(6)
  );

  const titleOptions = titlesFor(accessRole);
  const selectedTitle = otherSelected ? otherTitle.trim() : role;
  const isAdminSetup = accessRole === "admin";
  const setupSteps = isAdminSetup ? ["School profile"] : STEP_LABELS;
  const canNextFromStep0 = name.trim().length > 1 && selectedTitle.length > 0 && schoolName.trim().length > 1;

  const selectAccessRole = (id) => {
    setAccessRole(id);
    if (id === "admin") setStep(0);
    if (otherSelected) return;
    if (!titlesFor(id).includes(role)) setRole("");
  };

  const selectPresetTitle = (title) => {
    setOtherSelected(false);
    setRole(title);
  };

  const selectOtherTitle = () => {
    setOtherSelected(true);
    setRole(otherTitle.trim());
  };
  const canNextFromStep1 = !!schoolType;
  const canFinish =
    schoolType === "elementary"
      ? classroomName.trim().length > 1
      : periods.length > 0 && periods.every((p) => p.name.trim().length > 0);

  const applyPeriodCount = (n) => {
    const count = Math.max(1, Math.min(8, Number(n) || 1));
    setPeriodCount(count);
    setPeriods((prev) => {
      if (prev.length === count) return prev;
      if (prev.length < count) {
        const extra = Array.from({ length: count - prev.length }, (_, i) => ({
          id: `cls-${Date.now().toString(36)}-${prev.length + i}`,
          name: `Period ${prev.length + i + 1}`,
        }));
        return [...prev, ...extra];
      }
      return prev.slice(0, count);
    });
  };

  const setPeriodLabel = (idx, label) => {
    setPeriods((prev) => prev.map((p, i) => (i === idx ? { ...p, name: label } : p)));
  };

  const removePeriod = (idx) => {
    setPeriods((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      setPeriodCount(next.length);
      return next;
    });
  };

  const addPeriod = () => {
    if (periods.length >= 8) return;
    setPeriods((prev) => {
      const next = [
        ...prev,
        {
          id: `cls-${Date.now().toString(36)}-${prev.length}`,
          name: `Period ${prev.length + 1}`,
        },
      ];
      setPeriodCount(next.length);
      return next;
    });
  };

  const finishAdmin = async () => {
    if (!canNextFromStep0) {
      toast.error("Fill Name, Role, and School Name.");
      return;
    }
    try {
      await updateProfile({
        name: name.trim(),
        role: selectedTitle,
        accessRole: "admin",
        schoolName: schoolName.trim(),
        schoolType: "",
        periods: [],
        profileComplete: true,
        onboardingComplete: true,
      });
    } catch (err) {
      toast.error(err.message || "Couldn't save your profile");
      return;
    }
    toast.success("School profile ready.");
    navigate("/", { replace: true });
  };

  const handleFinish = async () => {
    if (!canFinish) return;
    const finalPeriods =
      schoolType === "elementary"
        ? [{ id: savedPeriods[0]?.id || `cls-${Date.now().toString(36)}-0`, name: classroomName.trim() }]
        : periods.map((p) => ({ id: p.id, name: p.name.trim() }));
    try {
      await updateProfile({
        name: name.trim(),
        role: selectedTitle,
        accessRole,
        schoolName: schoolName.trim(),
        schoolType,
        periods: finalPeriods,
        profileComplete: true,
      });
    } catch (err) {
      toast.error(err.message || "Couldn't save your profile");
      return;
    }
    if (accessRole !== "teacher") {
      toast.success("Profile ready! Welcome to Classroom Pulse.");
      navigate("/", { replace: true });
      return;
    }
    toast.success("Profile ready! Let's set up your classroom.");
    navigate("/onboarding", { replace: true });
  };

  const goNext = () => {
    if (step === 0 && !canNextFromStep0) {
      toast.error("Fill Name, Role, and School Name.");
      return;
    }
    if (step === 1 && !canNextFromStep1) {
      toast.error("Pick a school structure.");
      return;
    }
    setStep((s) => Math.min(2, s + 1));
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const handleSignOut = async () => {
    try {
      if (supabase) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          toast.error(error.message);
          return;
        }
      }
      await signOut();
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(err.message || "Could not sign out.");
    }
  };

  return (
    <div data-testid="setup-profile-page" className="min-h-screen grain-bg py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Brand */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={`${process.env.PUBLIC_URL}/logo-mark.png`}
              alt=""
              className="w-10 h-10 rounded-xl object-cover shadow-sm"
            />
            <div className="min-w-0">
              <div
                className="text-base font-extrabold text-slate-900"
                style={{ fontFamily: "Outfit" }}
              >
                {isAdminSetup ? "Set up your school" : "Set up your classroom"}
              </div>
              <div className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">
                Step {step + 1} of {setupSteps.length} · {setupSteps[step]}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            data-testid="setup-sign-out"
            className="shrink-0 text-xs font-semibold text-slate-400 hover:text-slate-700"
          >
            Sign out
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-6" data-testid="setup-progress">
          {setupSteps.map((label, i) => (
            <div
              key={label}
              className={`h-1.5 flex-1 rounded-full ${
                i <= step ? "bg-teal-500" : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          {step === 0 && (
            <div className="space-y-4" data-testid="setup-step-basic">
              <h2
                className="text-xl font-bold text-slate-900"
                style={{ fontFamily: "Outfit" }}
              >
                Tell us about you
              </h2>
              <div>
                <Label htmlFor="setup-name" className="text-xs font-semibold">
                  Full Name
                </Label>
                <Input
                  id="setup-name"
                  data-testid="setup-name-input"
                  placeholder="Ms. Sarah Jenkins"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Access Level</Label>
                <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-3 gap-1.5" data-testid="setup-access-role-options">
                  {ACCESS_ROLES.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => selectAccessRole(r.id)}
                      data-testid={`access-role-${r.id}`}
                      className={`text-left rounded-xl border px-3 py-2 transition-colors ${accessRole === r.id ? "border-teal-500 bg-teal-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
                    >
                      <span className="block text-xs font-bold text-slate-800">{r.label}</span>
                      <span className="block text-[10px] text-slate-500 leading-snug">{r.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold">Role / Title</Label>
                <div
                  className="mt-1.5 grid grid-cols-2 gap-1.5"
                  data-testid="setup-role-options"
                >
                  {titleOptions.map((r) => (
                    <button
                      key={r}
                      type="button"
                      data-testid={titleTestId(r)}
                      onClick={() => selectPresetTitle(r)}
                      className={`text-sm font-semibold rounded-xl border px-3 py-2.5 text-left leading-snug transition-all ${
                        !otherSelected && role === r
                          ? "bg-teal-500 text-white border-teal-500 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:border-teal-300"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                  <button
                    type="button"
                    data-testid="role-other"
                    onClick={selectOtherTitle}
                    className={`text-sm font-semibold rounded-xl border px-3 py-2.5 text-left transition-all ${
                      otherSelected
                        ? "bg-teal-500 text-white border-teal-500 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:border-teal-300"
                    }`}
                  >
                    Other
                  </button>
                </div>
                {otherSelected && (
                  <Input
                    id="setup-role-other"
                    data-testid="setup-role-other-input"
                    className="mt-1.5 h-8 text-sm"
                    placeholder="Your title"
                    value={otherTitle}
                    onChange={(e) => {
                      setOtherTitle(e.target.value);
                      setRole(e.target.value.trim());
                    }}
                    aria-label="Other title"
                  />
                )}
              </div>
              <div>
                <Label htmlFor="setup-school" className="text-xs font-semibold">
                  School Name
                </Label>
                <Input
                  id="setup-school"
                  data-testid="setup-school-input"
                  placeholder="Oakridge Elementary"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                />
              </div>
            </div>
          )}

          {!isAdminSetup && step === 1 && (
            <div className="space-y-4" data-testid="setup-step-structure">
              <h2
                className="text-xl font-bold text-slate-900"
                style={{ fontFamily: "Outfit" }}
              >
                How is your classroom organized?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  data-testid="school-type-elementary"
                  onClick={() => setSchoolType("elementary")}
                  className={`text-left rounded-2xl border-2 p-4 transition-all ${
                    schoolType === "elementary"
                      ? "border-teal-500 bg-teal-50 shadow-sm"
                      : "border-slate-200 hover:border-teal-300 bg-white"
                  }`}
                >
                  <School className="w-6 h-6 text-teal-600 mb-2" />
                  <div className="font-bold text-slate-900" style={{ fontFamily: "Outfit" }}>
                    Elementary
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Single classroom</div>
                </button>
                <button
                  type="button"
                  data-testid="school-type-secondary"
                  onClick={() => setSchoolType("secondary")}
                  className={`text-left rounded-2xl border-2 p-4 transition-all ${
                    schoolType === "secondary"
                      ? "border-teal-500 bg-teal-50 shadow-sm"
                      : "border-slate-200 hover:border-teal-300 bg-white"
                  }`}
                >
                  <Building2 className="w-6 h-6 text-teal-600 mb-2" />
                  <div className="font-bold text-slate-900" style={{ fontFamily: "Outfit" }}>
                    Middle / High School
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Multiple periods</div>
                </button>
              </div>
            </div>
          )}

          {!isAdminSetup && step === 2 && (
            <div className="space-y-4" data-testid="setup-step-periods">
              {schoolType === "elementary" ? (
                <>
                  <h2
                    className="text-xl font-bold text-slate-900"
                    style={{ fontFamily: "Outfit" }}
                  >
                    Name your classroom
                  </h2>
                  <div>
                    <Label htmlFor="classroom-name" className="text-xs font-semibold">
                      Classroom Name
                    </Label>
                    <Input
                      id="classroom-name"
                      data-testid="classroom-name-input"
                      placeholder="Room 104 · 3rd Grade"
                      value={classroomName}
                      onChange={(e) => setClassroomName(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <h2
                    className="text-xl font-bold text-slate-900"
                    style={{ fontFamily: "Outfit" }}
                  >
                    Configure your periods
                  </h2>
                  <div className="flex items-center gap-3">
                    <Label className="text-xs font-semibold shrink-0">Total periods</Label>
                    <Input
                      data-testid="period-count-input"
                      type="number"
                      min="1"
                      max="8"
                      value={periodCount}
                      onChange={(e) => applyPeriodCount(e.target.value)}
                      className="w-24"
                    />
                    <span className="text-[11px] text-slate-500 font-medium">1 – 8</span>
                  </div>

                  <div
                    className="space-y-2 max-h-[360px] overflow-y-auto pr-1"
                    data-testid="periods-list"
                  >
                    {periods.map((p, i) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-2"
                        data-testid={`period-row-${i + 1}`}
                      >
                        <span className="w-6 shrink-0 text-xs font-bold text-slate-500 text-right">
                          P{i + 1}
                        </span>
                        <Input
                          data-testid={`period-input-${i + 1}`}
                          value={p.name}
                          placeholder={`Period ${i + 1} — Subject`}
                          onChange={(e) => setPeriodLabel(i, e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removePeriod(i)}
                          disabled={periods.length <= 1}
                          data-testid={`remove-period-${i + 1}`}
                          className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-rose-500 hover:bg-rose-50 hover:border-rose-300 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    data-testid="add-period-btn"
                    onClick={addPeriod}
                    disabled={periods.length >= 8}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold bg-white border border-dashed border-slate-300 hover:border-teal-400 hover:text-teal-700 text-slate-600 rounded-xl px-3 py-2 transition-colors disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                    Add another period
                  </button>
                </>
              )}
            </div>
          )}

          <div className="flex justify-between mt-6 gap-2">
            {step > 0 ? (
              <Button
                variant="outline"
                onClick={goBack}
                data-testid="setup-back-btn"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            ) : (
              <span />
            )}
            {isAdminSetup ? (
              <Button
                data-testid="setup-finish-btn"
                onClick={finishAdmin}
                disabled={!canNextFromStep0}
                className="bg-emerald-500 hover:bg-emerald-600 text-white disabled:bg-slate-200"
              >
                <Check className="w-4 h-4 mr-1" />
                Finish Setup
              </Button>
            ) : step < 2 ? (
              <Button
                data-testid="setup-next-btn"
                onClick={goNext}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                data-testid="setup-finish-btn"
                onClick={handleFinish}
                disabled={!canFinish}
                className="bg-emerald-500 hover:bg-emerald-600 text-white disabled:bg-slate-200"
              >
                <Check className="w-4 h-4 mr-1" />
                Finish Setup
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
