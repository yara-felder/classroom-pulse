import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { fetchProfile, upsertProfile } from "@/lib/db";

const AuthContext = createContext(null);
const DEMO_KEY = "classroom_pulse_demo_user";
const STORAGE_KEY = "classroom_pulse_user";
const USERS_KEY = "classroom_pulse_users";

const DEMO_USER = {
  id: "demo-user",
  email: "sarah@oakridge.edu",
  name: "Ms. Sarah Jenkins",
  initials: "SJ",
  role: "Special Education Teacher",
  schoolName: "Oakridge Elementary",
  schoolType: "elementary",
  periods: [{ id: "3g-p2-math", name: "3rd Grade · Period 2 Math" }],
  profileComplete: true,
  onboardingComplete: true,
  isDemo: true,
  accessRole: "teacher",
};

const readJson = (key) => {
  try {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
};

const readUsers = () => readJson(USERS_KEY) || {};

const writeUsers = (registry) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(registry));
};

const initialsOf = (name) =>
  (name || "")
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

const readDemo = () => {
  const u = readJson(DEMO_KEY);
  return u?.isDemo ? u : null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const persistActive = (u) => {
    if (u?.isDemo) localStorage.setItem(DEMO_KEY, JSON.stringify(u));
    else localStorage.removeItem(DEMO_KEY);
    setUser(u);
  };

  const upsertRegistry = (u) => {
    if (!u?.email || isSupabaseConfigured) return;
    const registry = readUsers();
    registry[u.email] = u;
    writeUsers(registry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  };

  const loadFromSession = async (session) => {
    if (!session?.user) {
      persistActive(readDemo());
      return;
    }
    localStorage.removeItem(DEMO_KEY);
    const profile = await fetchProfile(session.user.id, session.user.email);
    persistActive(profile);
  };

  useEffect(() => {
    let unsub = () => {};
    const boot = async () => {
      try {
        if (!isSupabaseConfigured) {
          persistActive(readJson(STORAGE_KEY) || readDemo());
          return;
        }
        const { data } = await supabase.auth.getSession();
        if (data.session) await loadFromSession(data.session);
        else persistActive(readDemo());
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
          loadFromSession(session).catch((err) => console.error(err));
        });
        unsub = () => listener.subscription.unsubscribe();
      } catch (err) {
        console.error(err);
        persistActive(readDemo());
      } finally {
        setReady(true);
      }
    };
    boot();
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- boot once
  }, []);

  const signUp = async ({ email, password }) => {
    const clean = email.trim().toLowerCase();
    if (!isSupabaseConfigured) {
      const u = {
        id: `user-${Date.now().toString(36)}`,
        email: clean,
        name: "",
        initials: "U",
        role: "",
        schoolName: "",
        schoolType: null,
        periods: [],
        profileComplete: false,
        onboardingComplete: false,
        isDemo: false,
        accessRole: "teacher",
      };
      upsertRegistry(u);
      persistActive(u);
      return u;
    }
    const { data, error } = await supabase.auth.signUp({ email: clean, password });
    if (error) throw error;
    if (!data.session) {
      throw new Error("Check your email to confirm your account, then sign in.");
    }
    const profile = await fetchProfile(data.user.id, data.user.email);
    persistActive(profile);
    return profile;
  };

  const completeSignIn = async (authUser) => {
    if (!authUser?.id) {
      throw new Error("Sign in failed.");
    }
    const profile = await fetchProfile(authUser.id, authUser.email);
    persistActive(profile);
    return profile;
  };

  const signIn = async ({ email, password }) => {
    const clean = email.trim().toLowerCase();
    if (!isSupabaseConfigured || !supabase) {
      return { user: null, error: { message: "Sign in is not configured." } };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email: clean, password });
    if (error || !data?.session || !data?.user) {
      return { user: null, error: error || { message: "Sign in failed." } };
    }
    const profile = await completeSignIn(data.user);
    return { user: profile, error: null };
  };

  const signInDemo = async () => {
    persistActive(DEMO_USER);
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    persistActive(DEMO_USER);
    return DEMO_USER;
  };

  const signOut = async () => {
    localStorage.removeItem(DEMO_KEY);
    localStorage.removeItem(STORAGE_KEY);
    if (isSupabaseConfigured) await supabase.auth.signOut();
    persistActive(null);
  };

  const updateProfile = async (updates) => {
    const next = { ...(user || {}), ...updates };
    if (updates.name != null) next.initials = initialsOf(updates.name);
    if (updates.periods) next.periods = [...updates.periods];
    persistActive(next);
    if (next.isDemo || !isSupabaseConfigured) {
      upsertRegistry(next);
      return next;
    }
    await upsertProfile(next);
    return next;
  };

  const value = useMemo(
    () => ({
      user,
      ready,
      signUp,
      signIn,
      completeSignIn,
      signInDemo,
      signOut,
      updateProfile,
      isDemo: !!user?.isDemo,
    }),
    [user, ready] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
