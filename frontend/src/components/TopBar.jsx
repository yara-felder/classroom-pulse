import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  UserCog,
  Layers,
  LogOut,
  Settings,
  Wand2,
  Rocket,
  Check,
} from "lucide-react";
import { ACCESS_ROLES, roleLabel } from "@/lib/rbac";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useClassroom } from "@/context/ClassroomContext";
import { useAuth } from "@/context/AuthContext";
import { CLASS_SECTIONS } from "@/data/mockData";
import { EditProfileDialog } from "@/components/dialogs/EditProfileDialog";
import { ManagePeriodsDialog } from "@/components/dialogs/ManagePeriodsDialog";
import { AppSettingsDialog } from "@/components/dialogs/AppSettingsDialog";

export const TopBar = () => {
  const { classSection, setClassSection, detailedMode, setDetailedMode, checklist, updateChecklist, can, role, setViewAsRole } = useClassroom();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [periodsOpen, setPeriodsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState("digest");

  const savedPeriods =
    user?.periods && user.periods.length > 0
      ? user.periods
      : user && !user.isDemo
        ? []
        : CLASS_SECTIONS.map((cs) => ({ id: cs.id, name: cs.label }));
  const periods =
    classSection && !savedPeriods.some((p) => p.id === classSection)
      ? [...savedPeriods, { id: classSection, name: savedPeriods.length ? "Saved class" : "Your class" }]
      : savedPeriods.length
        ? savedPeriods
        : [{ id: classSection || "class", name: "Your class" }];
  const periodsKey = periods.map((p) => p.id).join("|");

  // Only fill an empty selection. Switching away from a class that isn't in
  // the profile list hides students who still belong to that class.
  useEffect(() => {
    if (!classSection && periods[0]) setClassSection(periods[0].id);
  }, [periodsKey, classSection, setClassSection]); // eslint-disable-line react-hooks/exhaustive-deps -- periodsKey stands in for the periods array

  // Show the switcher whenever there is more than one period, regardless of school type,
  // so newly-added periods are always reachable from the header.
  const showSwitcher = periods.length > 1;
  const activePeriod = periods.find((p) => p.id === classSection) || periods[0];

  const handleSignOut = () => {
    signOut();
    toast.success("Signed out");
    navigate("/login", { replace: true });
  };

  return (
    <header
      data-testid="app-topbar"
      className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80"
    >
      <div className="max-w-7xl mx-auto flex items-center gap-4 px-4 sm:px-8 py-3.5">
        <div data-testid="school-logo-brand" className="flex items-center gap-2.5 shrink-0">
          <img
            src={`${process.env.PUBLIC_URL}/logo-mark.png`}
            alt=""
            className="w-10 h-10 rounded-xl object-cover shadow-sm"
          />
          <div className="hidden sm:flex flex-col leading-tight">
            <span
              className="text-[15px] font-bold text-slate-900"
              style={{ fontFamily: "Outfit" }}
              data-testid="school-name-label"
            >
              {user?.schoolName || "Oakridge Elementary"}
            </span>
            <span className="text-[11px] text-slate-500 font-medium tracking-wide uppercase">
              Classroom Pulse
            </span>
          </div>
        </div>

        {role === "admin" ? (
          <div className="flex-1" />
        ) : showSwitcher ? (
          <div className="flex-1 flex justify-center">
            <Select key={periodsKey} value={activePeriod?.id} onValueChange={setClassSection}>
              <SelectTrigger
                data-testid="class-section-select"
                className="w-[240px] sm:w-[280px] h-10 bg-slate-50 border-slate-200 hover:bg-slate-100 rounded-xl font-medium text-slate-800"
              >
                <SelectValue placeholder="Select period">
                  {activePeriod ? `Viewing: ${activePeriod.name}` : "Select period"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p.id} value={p.id} data-testid={`class-option-${p.id}`}>
                    Viewing: {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="flex-1 flex justify-center">
            <div
              key={periodsKey}
              data-testid="single-classroom-label"
              className="hidden sm:inline-flex items-center gap-2 px-3 h-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700"
            >
              {periods[0]?.name || "Classroom"}
            </div>
          </div>
        )}

        {role !== "admin" && (
        <div
          data-testid="view-mode-toggle"
          className="hidden md:flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
        >
          <Label
            htmlFor="detailed-mode"
            data-testid="view-mode-simple"
            className={`text-xs font-semibold cursor-pointer ${!detailedMode ? "text-teal-700" : "text-slate-400"}`}
          >
            Simple
          </Label>
          <Switch
            id="detailed-mode"
            data-testid="view-mode-switch"
            checked={detailedMode}
            onCheckedChange={setDetailedMode}
            className="data-[state=checked]:bg-teal-600"
          />
          <Label
            htmlFor="detailed-mode"
            data-testid="view-mode-detailed"
            className={`text-xs font-semibold cursor-pointer ${detailedMode ? "text-teal-700" : "text-slate-400"}`}
          >
            Detailed
          </Label>
        </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              data-testid="teacher-profile-button"
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {user?.initials || "U"}
              </div>
              <div className="hidden lg:flex flex-col items-start leading-tight">
                <span
                  className="text-[13px] font-semibold text-slate-800"
                  data-testid="teacher-name-label"
                >
                  {user?.name || "Teacher"}
                </span>
                <Badge
                  variant="outline"
                  className="mt-0.5 text-[9px] font-semibold bg-teal-50 text-teal-700 border-teal-200"
                  data-testid="teacher-role-badge"
                >
                  {role === "teacher" ? user?.role || "Teacher" : roleLabel(role)}
                </Badge>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden lg:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{user?.name || "Signed in"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              data-testid="menu-edit-profile"
              onSelect={() => setEditOpen(true)}
            >
              <UserCog className="w-4 h-4 mr-2" /> Edit Profile
            </DropdownMenuItem>
            {can("settings") && (
              <>
            <DropdownMenuItem
              data-testid="menu-manage-periods"
              onSelect={() => setPeriodsOpen(true)}
            >
              <Layers className="w-4 h-4 mr-2" /> Manage Periods
            </DropdownMenuItem>
            <DropdownMenuItem
              data-testid="menu-app-settings"
              onSelect={() => {
                setSettingsTab("digest");
                setSettingsOpen(true);
              }}
            >
              <Settings className="w-4 h-4 mr-2" /> App Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              data-testid="menu-run-setup-wizard"
              onSelect={() => navigate("/onboarding")}
            >
              <Wand2 className="w-4 h-4 mr-2" /> Run setup wizard
            </DropdownMenuItem>
            <DropdownMenuItem
              data-testid="menu-show-checklist"
              onSelect={() => {
                const allDone = ["positive", "support", "iep", "digest", "goal"].every((k) => checklist.done[k]);
                updateChecklist({ dismissed: false, collapsed: false, ...(allDone ? { done: {} } : {}) });
                navigate("/");
              }}
            >
              <Rocket className="w-4 h-4 mr-2" /> Getting started checklist
            </DropdownMenuItem>
              </>
            )}
            {role === "case_manager" && (
              <DropdownMenuItem
                data-testid="menu-manage-periods"
                onSelect={() => setPeriodsOpen(true)}
              >
                <Layers className="w-4 h-4 mr-2" /> Manage Periods
              </DropdownMenuItem>
            )}
            {(role === "admin" || role === "case_manager") && (
              <DropdownMenuItem
                data-testid="menu-school-access"
                onSelect={() => {
                  setSettingsTab("school");
                  setSettingsOpen(true);
                }}
              >
                <Settings className="w-4 h-4 mr-2" /> School access
              </DropdownMenuItem>
            )}
            {user?.isDemo && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-slate-500">View as (demo)</DropdownMenuLabel>
                {ACCESS_ROLES.map((r) => (
                  <DropdownMenuItem key={r.id} data-testid={`menu-view-as-${r.id}`} onSelect={() => setViewAsRole(r.id)}>
                    <Check className={`w-4 h-4 mr-2 ${role === r.id ? "text-teal-600" : "text-transparent"}`} /> {r.label}
                  </DropdownMenuItem>
                ))}
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              data-testid="menu-logout"
              onSelect={handleSignOut}
              className="text-rose-600 focus:text-rose-700 focus:bg-rose-50"
            >
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {role !== "admin" && (
      <div className="md:hidden flex justify-center pb-3 px-4">
        <div
          data-testid="view-mode-toggle-mobile"
          className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
        >
          <span
            className={`text-xs font-semibold ${!detailedMode ? "text-teal-700" : "text-slate-400"}`}
          >
            Simple
          </span>
          <Switch
            checked={detailedMode}
            onCheckedChange={setDetailedMode}
            className="data-[state=checked]:bg-teal-600"
            data-testid="view-mode-switch-mobile"
          />
          <span
            className={`text-xs font-semibold ${detailedMode ? "text-teal-700" : "text-slate-400"}`}
          >
            Detailed
          </span>
        </div>
      </div>
      )}

      <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} />
      <ManagePeriodsDialog open={periodsOpen} onOpenChange={setPeriodsOpen} />
      <AppSettingsDialog key={`${role}-${settingsTab}`} open={settingsOpen} onOpenChange={setSettingsOpen} initialTab={settingsTab} />
    </header>
  );
};
