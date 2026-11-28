import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogIn, UserPlus, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

const GoogleMark = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
    />
    <path
      fill="#34A853"
      d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
    />
    <path
      fill="#FBBC05"
      d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.348 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"
    />
    <path
      fill="#EA4335"
      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
    />
  </svg>
);

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

  const handleForgotPassword = async () => {
    const email = signInEmail.trim().toLowerCase();
    if (!email) {
      toast.error("Enter your email, then choose Forgot password.");
      return;
    }
    if (!supabase) {
      toast.error("Password reset is not configured.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) {
        toast.error(error.message || "Could not send reset email.");
        return;
      }
      toast.success("Check your email for a link to set a new password.");
    } catch (err) {
      toast.error(err.message || "Could not send reset email.");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    if (!supabase) {
      toast.error("Sign in is not configured.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) {
        toast.error(error.message);
        setBusy(false);
      }
    } catch (err) {
      toast.error(err.message || "Google sign-in failed.");
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
    <div data-testid="login-page" className="min-h-screen grain-bg flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Brand */}
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
              For teachers who notice
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
              <div className="flex justify-end">
                <button
                  type="button"
                  data-testid="login-forgot-password-link"
                  onClick={handleForgotPassword}
                  disabled={busy}
                  className="text-xs font-semibold text-teal-700 hover:text-teal-800 disabled:opacity-60"
                >
                  Forgot password?
                </button>
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
            type="button"
            data-testid="google-signin-btn"
            onClick={handleGoogle}
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 font-semibold h-11 rounded-xl border border-slate-200 transition-colors disabled:opacity-60"
          >
            <GoogleMark />
            Continue with Google
          </button>

          <button
            data-testid="demo-signin-btn"
            onClick={handleDemo}
            disabled={busy}
            className="w-full mt-3 inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold h-11 rounded-xl transition-colors disabled:opacity-60"
          >
            <Sparkles className="w-4 h-4" />
            Continue as Demo Teacher
          </button>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          By continuing you agree to our{" "}
          <Link
            to="/terms"
            data-testid="login-terms-link"
            className="font-semibold text-teal-700 hover:text-teal-800"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            to="/privacy"
            data-testid="login-privacy-link"
            className="font-semibold text-teal-700 hover:text-teal-800"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
      </div>
      <footer className="px-4 pb-8 text-center">
        <nav className="flex items-center justify-center gap-4 text-xs">
          <Link
            to="/privacy"
            data-testid="login-footer-privacy-link"
            className="font-semibold text-teal-700 hover:text-teal-800"
          >
            Privacy
          </Link>
          <Link
            to="/terms"
            data-testid="login-footer-terms-link"
            className="font-semibold text-teal-700 hover:text-teal-800"
          >
            Terms
          </Link>
        </nav>
      </footer>
    </div>
  );
}
