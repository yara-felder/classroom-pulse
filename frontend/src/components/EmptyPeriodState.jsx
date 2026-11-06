import React from "react";
import { UserPlus, Users } from "lucide-react";

export const EmptyPeriodState = ({ periodName, onAdd, testid = "empty-period-state" }) => (
  <div
    data-testid={testid}
    className="col-span-full flex flex-col items-center justify-center text-center py-14 px-6 bg-white border border-dashed border-slate-300 rounded-2xl"
  >
    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center mb-4 shadow-sm">
      <Users className="w-7 h-7 text-teal-700" strokeWidth={2.2} />
    </div>
    <h3
      className="text-lg font-extrabold text-slate-900"
      style={{ fontFamily: "Outfit" }}
      data-testid={`${testid}-title`}
    >
      No students in this period yet
    </h3>
    <p className="text-sm text-slate-500 mt-1 max-w-sm">
      Add your first student to <b>{periodName || "this period"}</b> to start tracking
      celebrations, support moments, and skill goals.
    </p>
    {onAdd && (
    <button
      data-testid={`${testid}-add-btn`}
      onClick={onAdd}
      className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-4 py-2.5 shadow-sm active:scale-95 transition-all"
    >
      <UserPlus className="w-4 h-4" strokeWidth={2.8} />
      Add Student to {periodName || "Period"}
    </button>
    )}
  </div>
);
