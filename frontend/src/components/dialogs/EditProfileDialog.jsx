import React, { useState, useEffect } from "react";
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
import { UserCog, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const ROLES = [
  "Special Education Teacher",
  "BCBA",
  "Gen-Ed Teacher",
  "Paraprofessional",
];

export const EditProfileDialog = ({ open, onOpenChange }) => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [role, setRole] = useState(user?.role || "");
  const [schoolName, setSchoolName] = useState(user?.schoolName || "");

  useEffect(() => {
    if (!open) return;
    setName(user?.name || "");
    setRole(user?.role || "");
    setSchoolName(user?.schoolName || "");
  }, [open, user]);

  const handleSave = () => {
    if (!name.trim() || !role || !schoolName.trim()) {
      toast.error("Name, Role, and School are required.");
      return;
    }
    updateProfile({ name: name.trim(), role, schoolName: schoolName.trim() });
    toast.success("Profile updated");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="modal-edit-profile-dialog" className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ fontFamily: "Outfit" }}>
            <span className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
              <UserCog className="w-4 h-4 text-teal-700" />
            </span>
            Edit Profile
          </DialogTitle>
          <DialogDescription>Update your teacher profile.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="ep-name" className="text-xs font-semibold">
              Full Name
            </Label>
            <Input
              id="ep-name"
              data-testid="edit-profile-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs font-semibold">Role / Title</Label>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  data-testid={`edit-profile-role-${r.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                  onClick={() => setRole(r)}
                  className={`text-xs font-semibold rounded-lg border px-3 py-2 text-left transition-all ${
                    role === r
                      ? "bg-teal-500 text-white border-teal-500 shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:border-teal-300"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="ep-school" className="text-xs font-semibold">
              School Name
            </Label>
            <Input
              id="ep-school"
              data-testid="edit-profile-school-input"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            data-testid="save-edit-profile-btn"
            onClick={handleSave}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Save className="w-4 h-4 mr-1.5" />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
