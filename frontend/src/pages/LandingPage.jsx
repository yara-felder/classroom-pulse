import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const POINTS = [
  {
    title: "Classroom Teachers",
    body: "Quickly track daily behavior, positive points, and student progress in seconds.",
  },
  {
    title: "Case Managers & Specialists",
    body: "Monitor IEP goals, spot trends across classes, and keep student notes organized.",
  },
  {
    title: "School Administrators & Families",
    body: "View school-wide trends, support teachers, and share clear updates with families.",
  },
];

export default function LandingPage() {
  return (
    <div data-testid="landing-page" className="min-h-screen grain-bg flex flex-col">
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-10 flex items-center">
        <div className="w-full bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-10">
          <div className="flex items-center gap-4">
            <img
              src={`${process.env.PUBLIC_URL}/logo-mark.png`}
              alt="WrenRoom"
              className="w-16 h-16 shrink-0 object-contain"
            />
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900" style={{ fontFamily: "Outfit" }}>
              WrenRoom
            </h1>
          </div>
          <p className="mt-4 text-base text-slate-600 leading-relaxed" data-testid="landing-overview">
            WrenRoom helps teachers, case managers, and school administrators connect with
            students, track classroom behavior, monitor progress, and keep parents informed.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {POINTS.map((point) => (
              <div key={point.title} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <h2 className="text-sm font-bold text-slate-900" style={{ fontFamily: "Outfit" }}>
                  {point.title}
                </h2>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">{point.body}</p>
              </div>
            ))}
          </div>

          <Link
            to="/login"
            data-testid="landing-signin-link"
            className="mt-8 inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold h-12 px-6 rounded-xl transition-colors"
          >
            Sign in / Get started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <footer className="px-4 pb-8 text-center">
        <nav className="flex items-center justify-center gap-5 text-sm">
          <Link
            to="/privacy"
            data-testid="landing-privacy-link"
            className="font-semibold text-teal-700 hover:text-teal-800"
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms"
            data-testid="landing-terms-link"
            className="font-semibold text-teal-700 hover:text-teal-800"
          >
            Terms of Service
          </Link>
        </nav>
      </footer>
    </div>
  );
}
