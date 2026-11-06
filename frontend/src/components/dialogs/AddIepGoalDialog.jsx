import React, { useState } from "react";
import { Plus, Target, Check } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useClassroom } from "@/context/ClassroomContext";

const DOMAINS = [
  "Communication",
  "Behavior / SEL",
  "Academic",
  "Social",
  "Executive Functioning",
  "Adaptive",
];

const ACCOMMODATION_OPTIONS = [
  "Preferential Seating",
  "Visual Timer",
  "Extended Time",
  "Movement Breaks",
  "Sensory Tools",
  "Chunked Directions",
  "Peer Support",
  "Reduced Distractions",
  "Visual Schedule",
  "Fidget Tool",
];

const isoIn = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export const AddIepGoalDialog = ({ open, onOpenChange, student, planType = "IEP" }) => {
  const { addIepGoal } = useClassroom();
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState(DOMAINS[1]);
  const [baseline, setBaseline] = useState(20);
  const [targetPercent, setTargetPercent] = useState(80);
  const [targetDate, setTargetDate] = useState(isoIn(60));
  const [reviewDate, setReviewDate] = useState(isoIn(30));
  const [accommodations, setAccommodations] = useState([]);

  const reset = () => {
    setDescription("");
    setDomain(DOMAINS[1]);
    setBaseline(20);
    setTargetPercent(80);
    setTargetDate(isoIn(60));
    setReviewDate(isoIn(30));
    setAccommodations([]);
  };

  const toggleAccom = (a) => {
    setAccommodations((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  };

  const handleSave = () => {
    if (!description.trim()) {
      toast.error("Enter a goal description.");
      return;
    }
    addIepGoal(student.id, {
      description: description.trim(),
      domain,
      baseline: Number(baseline) || 0,
      targetPercent: Number(targetPercent) || 100,
      targetDate,
      reviewDate,
      accommodations,
      planType,
    });
    toast.success(`${planType} goal added`, { description: student.name });
    reset();
    onOpenChange(false);
  };

  const handleOpenChange = (v) => {
    if (!v) reset();
    onOpenChange(v);
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-testid="modal-add-iep-goal-dialog"
        className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ fontFamily: "Outfit" }}>
            <span className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Target className="w-4 h-4 text-indigo-700" />
            </span>
            Add {planType} Goal · {student.name}
          </DialogTitle>
          <DialogDescription>
            Structured goal with its own standalone trial log — mastery is computed only from trials logged on this goal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="iep-desc" className="text-xs font-semibold">
              Goal Description
            </Label>
            <Textarea
              id="iep-desc"
              data-testid="iep-goal-description-input"
              placeholder="e.g., Initiates task independently within 2 minutes in 4 out of 5 opportunities"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[70px] resize-none"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">Domain</Label>
            <div className="mt-1.5 flex flex-wrap gap-1.5" data-testid="iep-goal-domains">
              {DOMAINS.map((d) => (
                <button
                  key={d}
                  type="button"
                  data-testid={`iep-domain-${d.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                  onClick={() => setDomain(d)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                    domain === d
                      ? "bg-indigo-500 text-white border-indigo-500 shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="iep-baseline" className="text-xs font-semibold">
                Baseline %
              </Label>
              <Input
                id="iep-baseline"
                data-testid="iep-goal-baseline-input"
                type="number"
                min="0"
                max="100"
                value={baseline}
                onChange={(e) => setBaseline(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="iep-target" className="text-xs font-semibold">
                Target %
              </Label>
              <Input
                id="iep-target"
                data-testid="iep-goal-target-percent-input"
                type="number"
                min="0"
                max="100"
                value={targetPercent}
                onChange={(e) => setTargetPercent(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="iep-target-date" className="text-xs font-semibold">
                Target Date
              </Label>
              <Input
                id="iep-target-date"
                data-testid="iep-goal-target-date-input"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="iep-review-date" className="text-xs font-semibold">
                Review Date
              </Label>
              <Input
                id="iep-review-date"
                data-testid="iep-goal-review-date-input"
                type="date"
                value={reviewDate}
                onChange={(e) => setReviewDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Accommodations</Label>
            <div
              className="mt-1.5 flex flex-wrap gap-1.5"
              data-testid="iep-goal-accommodations"
            >
              {ACCOMMODATION_OPTIONS.map((a) => {
                const active = accommodations.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    data-testid={`iep-accom-${a.toLowerCase().replace(/\s+/g, "-")}`}
                    onClick={() => toggleAccom(a)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-all inline-flex items-center gap-1 ${
                      active
                        ? "bg-teal-100 text-teal-700 border-teal-300"
                        : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"
                    }`}
                  >
                    {active && <Check className="w-3 h-3" />}
                    {a}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            data-testid="cancel-iep-goal-btn"
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            data-testid="save-iep-goal-btn"
            onClick={handleSave}
            className="w-full sm:flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" strokeWidth={2.6} />
            Add {planType} Goal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
