import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export default function UpdatePasswordPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (authUser?.email) setUserEmail(authUser.email);
    });
  }, []);

  const handleSubmit = async () => {
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!supabase) {
      toast.error("Password reset is not configured.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated.");
      const next = user?.profileComplete ? "/" : user ? "/setup-profile" : "/login";
      navigate(next, { replace: true });
    } catch (err) {
      toast.error(err.message || "Could not update password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      data-testid="update-password-page"
      className="min-h-screen grain-bg flex items-center justify-center px-4 py-10"
    >
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-6">
          <img
            src={`${process.env.PUBLIC_URL}/logo-mark.png`}
            alt="WrenRoom"
            className="w-12 h-12 object-contain"
          />
          <div>
            <div className="text-lg font-extrabold text-slate-900" style={{ fontFamily: "Outfit" }}>
              WrenRoom
            </div>
            <div className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">
              Behavior & Skill Tracking
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8 space-y-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900" style={{ fontFamily: "Outfit" }}>
              Set a new password
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Choose a new password {userEmail ? `for ${userEmail}.` : "for your account."}
            </p>
          </div>
          <div>
            <Label htmlFor="new-password" className="text-xs font-semibold">
              New password (min 6)
            </Label>
            <Input
              id="new-password"
              data-testid="new-password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label htmlFor="confirm-password" className="text-xs font-semibold">
              Confirm password
            </Label>
            <Input
              id="confirm-password"
              data-testid="confirm-password-input"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              autoComplete="new-password"
            />
          </div>
          <Button
            data-testid="update-password-submit-btn"
            onClick={handleSubmit}
            disabled={busy}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold h-11"
          >
            <KeyRound className="w-4 h-4 mr-1.5" />
            Update password
          </Button>
        </div>
      </div>
    </div>
  );
}
