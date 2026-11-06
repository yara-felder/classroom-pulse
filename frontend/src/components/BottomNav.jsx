import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Users, BarChart3, BookMarked, Mail } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: Home, testid: "nav-home", end: true },
  { to: "/roster", label: "Roster", icon: Users, testid: "nav-roster" },
  { to: "/analytics", label: "Analytics", icon: BarChart3, testid: "nav-analytics" },
  { to: "/digest", label: "Digest", icon: Mail, testid: "nav-digest" },
  { to: "/resources", label: "Resources", icon: BookMarked, testid: "nav-resources" },
];

export const BottomNav = () => {
  return (
    <nav
      data-testid="bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
    >
      <div className="max-w-2xl mx-auto flex items-center justify-around px-1 sm:px-2 py-2 gap-0.5">
        {items.map(({ to, label, icon: Icon, testid, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            data-testid={testid}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-xl transition-all ${
                isActive
                  ? "text-teal-700 bg-teal-50/70"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.4 : 2} />
                <span className="text-[11px] font-semibold tracking-wide">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
