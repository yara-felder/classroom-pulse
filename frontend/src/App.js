import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { ClassroomProvider } from "@/context/ClassroomContext";
import { AuthProvider } from "@/context/AuthContext";
import { RequireAuth, RedirectIfAuthed, HomeGate } from "@/components/RouteGuards";
import HomePage from "@/pages/HomePage";
import LandingPage from "@/pages/LandingPage";
import RosterPage from "@/pages/RosterPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import ResourcesPage from "@/pages/ResourcesPage";
import DigestQueuePage from "@/pages/DigestQueuePage";
import LoginPage from "@/pages/LoginPage";
import PrivacyPage from "@/pages/PrivacyPage";
import TermsPage from "@/pages/TermsPage";
import UpdatePasswordPage from "@/pages/UpdatePasswordPage";
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
      <BrowserRouter>
        <AuthProvider>
          <ClassroomProvider>
            <Routes>
              <Route
                path="/login"
                element={
                  <RedirectIfAuthed>
                    <LoginPage />
                  </RedirectIfAuthed>
                }
              />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/update-password" element={<UpdatePasswordPage />} />
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
                  <HomeGate
                    landing={<LandingPage />}
                    app={
                      <AuthedShell>
                        <HomePage />
                      </AuthedShell>
                    }
                  />
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
          </ClassroomProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
