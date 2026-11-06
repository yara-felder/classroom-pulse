import React, { useState } from "react";
import { FileText, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PrivateToggle } from "@/components/dialogs/ReflectionNote";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useClassroom } from "@/context/ClassroomContext";

const QUICK_TAGS = ["Observation", "Assignment", "Attendance", "Family Note", "Health"];

export const QuickLogDialog = ({ open, onOpenChange, student }) => {
  const [note, setNote] = useState("");
  const [notePrivate, setNotePrivate] = useState(false);
  const [tag, setTag] = useState(QUICK_TAGS[0]);
  const [notifyParent, setNotifyParent] = useState(false);
  const { addQuickLog } = useClassroom();

  const handleSubmit = () => {
    if (!note.trim()) {
      toast.error("Add a short note before logging.");
      return;
    }
    addQuickLog(student.id, note.trim(), tag, notifyParent, notePrivate);
    setNotePrivate(false);
    toast.success(`Log saved — ${student.name}`, {
      description: notifyParent
        ? "Parent notification queued for end-of-day digest."
        : `${tag} note captured with timestamp.`,
    });
    setNote("");
    setNotifyParent(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="modal-quick-log-dialog" className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ fontFamily: "Outfit" }}>
            <span className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <FileText className="w-4 h-4 text-indigo-600" />
            </span>
            Quick Log · {student.name}
          </DialogTitle>
          <DialogDescription>
            Timestamped note. Optionally include in the family digest.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Category
            </span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {QUICK_TAGS.map((t) => (
                <button
                  key={t}
                  data-testid={`quick-tag-${t.toLowerCase().replace(/\s/g, "-")}`}
                  onClick={() => setTag(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    tag === t
                      ? "bg-indigo-500 text-white border-indigo-500"
                      : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <Textarea
            data-testid="quick-log-textarea"
            placeholder="Short note about what happened..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[96px] resize-none"
          />
          <PrivateToggle prefix="quick-log" checked={notePrivate} onChange={setNotePrivate} />

          <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <Checkbox
              id="notify-parent"
              checked={notifyParent}
              onCheckedChange={setNotifyParent}
              data-testid="notify-parent-checkbox"
            />
            <label
              htmlFor="notify-parent"
              className="text-sm text-slate-700 font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              Include in Digest
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="cancel-quick-log-btn">
            Cancel
          </Button>
          <Button
            data-testid="submit-quick-log-btn"
            onClick={handleSubmit}
            className="bg-indigo-500 hover:bg-indigo-600 text-white"
          >
            Save log
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
