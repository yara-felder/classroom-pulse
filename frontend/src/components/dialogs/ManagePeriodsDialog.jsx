import React, { useState, useEffect, useRef } from "react";
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
import { Layers, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useClassroom } from "@/context/ClassroomContext";

export const ManagePeriodsDialog = ({ open, onOpenChange }) => {
  const { user, updateProfile } = useAuth();
  const { setClassSection } = useClassroom();
  const [periods, setPeriods] = useState(user?.periods || []);
  const newlyAddedIdsRef = useRef([]);

  useEffect(() => {
    if (open) {
      setPeriods(user?.periods || []);
      newlyAddedIdsRef.current = [];
    }
  }, [open, user]);

  const setLabel = (idx, label) =>
    setPeriods((prev) => prev.map((p, i) => (i === idx ? { ...p, name: label } : p)));

  const remove = (idx) =>
    setPeriods((prev) => {
      if (prev.length <= 1) return prev;
      const target = prev[idx];
      newlyAddedIdsRef.current = newlyAddedIdsRef.current.filter((id) => id !== target.id);
      return prev.filter((_, i) => i !== idx);
    });

  const add = () =>
    setPeriods((prev) => {
      if (prev.length >= 8) return prev;
      const id = `cls-${Date.now().toString(36)}-${prev.length}`;
      newlyAddedIdsRef.current = [...newlyAddedIdsRef.current, id];
      return [...prev, { id, name: `Period ${prev.length + 1}` }];
    });

  const handleSave = () => {
    if (periods.length === 0 || periods.some((p) => !p.name.trim())) {
      toast.error("Every period needs a name.");
      return;
    }
    const cleaned = periods.map((p) => ({ id: p.id, name: p.name.trim() }));
    updateProfile({ periods: cleaned });

    // Auto-switch to the last newly-added period, if any were added this session
    const addedIds = newlyAddedIdsRef.current;
    const lastNewId = [...addedIds].reverse().find((id) => cleaned.some((p) => p.id === id));
    if (lastNewId) {
      setClassSection(lastNewId);
      const newPeriod = cleaned.find((p) => p.id === lastNewId);
      toast.success(`Now viewing: ${newPeriod?.name || "new period"}`);
    } else {
      toast.success("Periods updated");
    }

    onOpenChange(false);

    // Scroll header switcher into view after save
    setTimeout(() => {
      const el = document.querySelector('[data-testid="class-section-select"]') ||
        document.querySelector('[data-testid="single-classroom-label"]');
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 50);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="modal-manage-periods-dialog"
        className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ fontFamily: "Outfit" }}>
            <span className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Layers className="w-4 h-4 text-indigo-700" />
            </span>
            Manage Periods
          </DialogTitle>
          <DialogDescription>
            Rename, add, or remove class periods. The header switcher updates instantly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2" data-testid="manage-periods-list">
          {periods.map((p, i) => (
            <div key={p.id} className="flex items-center gap-2">
              <span className="w-6 shrink-0 text-xs font-bold text-slate-500 text-right">
                P{i + 1}
              </span>
              <Input
                data-testid={`manage-period-input-${i + 1}`}
                value={p.name}
                onChange={(e) => setLabel(i, e.target.value)}
              />
              <button
                type="button"
                data-testid={`manage-remove-period-${i + 1}`}
                onClick={() => remove(i)}
                disabled={periods.length <= 1}
                className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-rose-500 hover:bg-rose-50 hover:border-rose-300 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          data-testid="manage-add-period-btn"
          onClick={add}
          disabled={periods.length >= 8}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold bg-white border border-dashed border-slate-300 hover:border-teal-400 hover:text-teal-700 text-slate-600 rounded-xl px-3 py-2 transition-colors disabled:opacity-40"
        >
          <Plus className="w-4 h-4" />
          Add period
        </button>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            data-testid="save-manage-periods-btn"
            onClick={handleSave}
            className="bg-indigo-500 hover:bg-indigo-600 text-white"
          >
            <Save className="w-4 h-4 mr-1.5" />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
