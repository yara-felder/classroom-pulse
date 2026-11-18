import React from "react";
import { Link } from "react-router-dom";

export const PublicFooter = ({ testIdPrefix = "public" }) => (
  <footer className="px-4 py-6 text-center text-xs text-slate-500">
    <nav className="flex items-center justify-center gap-4">
      <Link
        to="/privacy"
        data-testid={`${testIdPrefix}-privacy-link`}
        className="font-semibold text-teal-700 hover:text-teal-800"
      >
        Privacy
      </Link>
      <Link
        to="/terms"
        data-testid={`${testIdPrefix}-terms-link`}
        className="font-semibold text-teal-700 hover:text-teal-800"
      >
        Terms
      </Link>
      <Link to="/login" className="font-semibold text-slate-500 hover:text-slate-800">
        Sign in
      </Link>
    </nav>
  </footer>
);

export const PublicPage = ({ title, kicker, testId, children }) => (
  <div data-testid={testId} className="min-h-screen grain-bg flex flex-col">
    <div className="flex-1 w-full max-w-2xl mx-auto px-4 py-10">
      <Link to="/login" className="flex items-center gap-3 mb-6 w-fit">
        <img
          src={`${process.env.PUBLIC_URL}/logo-mark.png`}
          alt=""
          className="w-11 h-11 rounded-2xl object-cover shadow-md"
        />
        <div>
          <div className="text-lg font-extrabold text-slate-900" style={{ fontFamily: "Outfit" }}>
            Classroom Pulse
          </div>
          <div className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">
            Behavior & Skill Tracking
          </div>
        </div>
      </Link>

      <article className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8 space-y-6">
        <header>
          {kicker ? (
            <p className="text-[11px] uppercase tracking-widest text-teal-700 font-semibold">{kicker}</p>
          ) : null}
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1" style={{ fontFamily: "Outfit" }}>
            {title}
          </h1>
        </header>
        {children}
      </article>
    </div>
    <PublicFooter testIdPrefix={testId} />
  </div>
);

export const LegalSection = ({ title, children }) => (
  <section className="space-y-2">
    <h2 className="text-base font-bold text-slate-900" style={{ fontFamily: "Outfit" }}>
      {title}
    </h2>
    <div className="text-sm text-slate-600 leading-relaxed space-y-3">{children}</div>
  </section>
);
