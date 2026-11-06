import React, { useState } from "react";
import { CalendarRange, RotateCcw } from "lucide-react";
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
import { toast } from "sonner";
import { useClassroom } from "@/context/ClassroomContext";
import { cycleBounds, cycleRangeLabel, resetsInLabel } from "@/lib/pointCycle";

export const CycleHeader = () => {
  const { pointSettings, resetPoints, can } = useClassroom();
  const [open, setOpen] = useState(false);
  const b = cycleBounds(pointSettings);

  const confirm = () => {
    resetPoints();
    toast.success("Point balances reset", {
      description: "Active balances are now 0. Logs, charts and reports are unchanged.",
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="cycle-header">
      <span
        data-testid="active-cycle-badge"
        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-full px-3 py-1.5"
      >
        <CalendarRange className="w-3.5 h-3.5" />
        Active Cycle: {cycleRangeLabel(b)} ({resetsInLabel(b)})
      </span>
      {can("reset_points") && (
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-8 text-xs font-semibold border-rose-200 text-rose-700 hover:bg-rose-50"
        data-testid="reset-points-btn"
      >
        <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset Points Now
      </Button>
      )}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent data-testid="reset-points-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all point balances?</AlertDialogTitle>
            <AlertDialogDescription>
              Every student's active point balance goes back to 0 for reward redemptions. Behavior
              logs, trend charts, lifetime totals and PDF reports stay exactly as they are.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="reset-points-cancel-btn">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirm}
              className="bg-rose-600 hover:bg-rose-700"
              data-testid="reset-points-confirm-btn"
            >
              Reset Points
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
