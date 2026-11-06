import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GraduationCap, LogIn, UserPlus, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp, signInDemo, completeSignIn } = useAuth();
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPass, setSignInPass] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPass, setSignUpPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [busy, setBusy] = useState(false);
  const from = location.state?.from?.pathname || "/";

  const handleSignIn = async () => {
    if (!signInEmail.trim() || !signInPass.trim()) {
      toast.error("Enter email and password.");
      return;
    }
    setBusy(true);
    try {
      if (!supabase) {
        toast.error("Sign in is not configured.");
        return;
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInEmail.trim().toLowerCase(),
        password: signInPass,
      });
      if (error === null && data?.session && data?.user) {
        const u = await completeSignIn(data.user);
        toast.success(`Welcome back, ${u.name || "Teacher"}!`);
        navigate(u.profileComplete ? from : "/setup-profile", { replace: true });
      } else {
        toast.error(error?.message || "Incorrect email or password.");
      }
    } catch (err) {
      toast.error(err.message || "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  const handleSignUp = async () => {
    if (!signUpEmail.trim()) {
      toast.error("Email is required.");
      return;
    }
    if (signUpPass.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (signUpPass !== confirmPass) {
      toast.error("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const u = await signUp({ email: signUpEmail, password: signUpPass });
      toast.success("Account created — let's set up your classroom.");
      navigate(u.profileComplete ? from : "/setup-profile", { replace: true });
    } catch (err) {
      toast.error(err.message || "Sign up failed");
    } finally {
      setBusy(false);
    }
  };

  const handleDemo = async () => {
    setBusy(true);
    try {
      await signInDemo();
      toast.success("Signed in as Demo Teacher");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err.message || "Demo sign in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      data-testid="login-page"
      className="min-h-screen grain-bg flex items-center justify-center px-4 py-10"
    >
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md">
            <GraduationCap className="w-6 h-6 text-white" strokeWidth={2.4} />
          </div>
          <div>
            <div className="text-lg font-extrabold text-slate-900" style={{ fontFamily: "Outfit" }}>
              Classroom Pulse
            </div>
            <div className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">
              Behavior & Skill Tracking
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-5">
              <TabsTrigger value="signin" data-testid="tab-signin">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" data-testid="tab-signup">
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <div>
                <Label htmlFor="signin-email" className="text-xs font-semibold">
                  Email
                </Label>
                <Input
                  id="signin-email"
                  data-testid="signin-email-input"
                  type="email"
                  placeholder="you@school.edu"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="signin-pass" className="text-xs font-semibold">
                  Password
                </Label>
                <Input
                  id="signin-pass"
                  data-testid="signin-password-input"
                  type="password"
                  value={signInPass}
                  onChange={(e) => setSignInPass(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                />
              </div>
              <Button
                data-testid="signin-submit-btn"
                onClick={handleSignIn}
                disabled={busy}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold h-11"
              >
                <LogIn className="w-4 h-4 mr-1.5" />
                Sign In
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <div>
                <Label htmlFor="signup-email" className="text-xs font-semibold">
                  School Email
                </Label>
                <Input
                  id="signup-email"
                  data-testid="signup-email-input"
                  type="email"
                  placeholder="you@school.edu"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="signup-pass" className="text-xs font-semibold">
                  Password (min 6)
                </Label>
                <Input
                  id="signup-pass"
                  data-testid="signup-password-input"
                  type="password"
                  value={signUpPass}
                  onChange={(e) => setSignUpPass(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="signup-confirm" className="text-xs font-semibold">
                  Confirm Password
                </Label>
                <Input
                  id="signup-confirm"
                  data-testid="signup-confirm-input"
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
                />
              </div>
              <Button
                data-testid="signup-submit-btn"
                onClick={handleSignUp}
                disabled={busy}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold h-11"
              >
                <UserPlus className="w-4 h-4 mr-1.5" />
                Create Account
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </TabsContent>
          </Tabs>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">
              or
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <button
            data-testid="demo-signin-btn"
            onClick={handleDemo}
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold h-11 rounded-xl transition-colors disabled:opacity-60"
          >
            <Sparkles className="w-4 h-4" />
            Continue as Demo Teacher
          </button>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          By continuing you agree to our teacher-first privacy policy. No student data is shared.
        </p>
      </div>
    </div>
  );
}
