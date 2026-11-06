import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { ClassroomProvider } from "@/context/ClassroomContext";
import { AuthProvider } from "@/context/AuthContext";
import { RequireAuth, RedirectIfAuthed } from "@/components/RouteGuards";
import HomePage from "@/pages/HomePage";
import RosterPage from "@/pages/RosterPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import ResourcesPage from "@/pages/ResourcesPage";
import DigestQueuePage from "@/pages/DigestQueuePage";
import LoginPage from "@/pages/LoginPage";
import SetupProfilePage from "@/pages/SetupProfilePage";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { GuideSpotlight } from "@/components/GuideSpotlight";

const AuthedShell = ({ children }) => (
  <>
    <TopBar />
    <main className="pb-28">{children}</main>
    <BottomNav />
    <GuideSpotlight />
  </>
);

function App() {
  return (
    <div className="App min-h-screen grain-bg" data-testid="app-root">
      <AuthProvider>
        <ClassroomProvider>
          <BrowserRouter>
            <Routes>
              <Route
                path="/login"
                element={
                  <RedirectIfAuthed>
                    <LoginPage />
                  </RedirectIfAuthed>
                }
              />
              <Route
                path="/setup-profile"
                element={
                  <RequireAuth>
                    <SetupProfilePage />
                  </RequireAuth>
                }
              />
              <Route
                path="/"
                element={
                  <RequireAuth>
                    <AuthedShell>
                      <HomePage />
                    </AuthedShell>
                  </RequireAuth>
                }
              />
              <Route
                path="/roster"
                element={
                  <RequireAuth>
                    <AuthedShell>
                      <RosterPage />
                    </AuthedShell>
                  </RequireAuth>
                }
              />
              <Route
                path="/analytics"
                element={
                  <RequireAuth>
                    <AuthedShell>
                      <AnalyticsPage />
                    </AuthedShell>
                  </RequireAuth>
                }
              />
              <Route
                path="/resources"
                element={
                  <RequireAuth>
                    <AuthedShell>
                      <ResourcesPage />
                    </AuthedShell>
                  </RequireAuth>
                }
              />
              <Route
                path="/onboarding"
                element={
                  <RequireAuth>
                    <AuthedShell>
                      <HomePage />
                      <OnboardingWizard />
                    </AuthedShell>
                  </RequireAuth>
                }
              />
              <Route
                path="/digest"
                element={
                  <RequireAuth>
                    <AuthedShell>
                      <DigestQueuePage />
                    </AuthedShell>
                  </RequireAuth>
                }
              />
            </Routes>
            <Toaster position="top-right" richColors />
          </BrowserRouter>
        </ClassroomProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
