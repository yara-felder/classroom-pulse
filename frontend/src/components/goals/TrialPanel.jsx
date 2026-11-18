import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { LineChart as LineChartIcon, Pencil } from "lucide-react";
import { format } from "date-fns";
import { MasteryCriteria } from "@/components/goals/MasteryCriteria";
import { DEFAULT_MASTERY } from "@/components/goals/mastery";
import { useClassroom } from "@/context/ClassroomContext";
import { toast } from "sonner";

const CHOICES = [
  { id: "independent", short: "Ind", tone: "emerald" },
  { id: "prompted", short: "Pmt", tone: "amber" },
  { id: "refused", short: "N/A", tone: "rose" },
];

const choiceActive = {
  emerald: "bg-emerald-500 text-white shadow-sm",
  amber: "bg-amber-500 text-white shadow-sm",
  rose: "bg-rose-500 text-white shadow-sm",
};

const shortDate = (iso) => (iso ? format(new Date(iso), "MMM d, yyyy") : "—");
const monthDayLabel = (iso) => {
  if (!iso) return "";
  const parts = iso.split("-");
  return `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`;
};

const TrialSlot = ({ idx, state, onSelect, testidPrefix }) => (
  <div className="flex flex-col items-center gap-1" data-testid={`${testidPrefix}-slot-${idx + 1}`}>
    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
      T{idx + 1}
    </span>
    <div
      role="radiogroup"
      aria-label={`Trial ${idx + 1}`}
      className="grid grid-cols-3 gap-0.5 w-full bg-slate-100 p-0.5 rounded-lg"
    >
      {CHOICES.map((c) => {
        const active = state === c.id;
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={active}
            data-testid={`${testidPrefix}-slot-${idx + 1}-${c.id}`}
            onClick={() => onSelect(c.id === state ? null : c.id)}
            className={`text-[10px] font-semibold py-1 rounded-md transition-all active:scale-95 ${
              active
                ? choiceActive[c.tone]
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
          >
            {c.short}
          </button>
        );
      })}
    </div>
  </div>
);

const buildChartData = (history) =>
  (history || [])
    .filter((h) => h && Number.isFinite(h.percent))
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((h) => ({ dateLabel: monthDayLabel(h.date), percent: h.percent, date: h.date }));

const TrendChart = ({ data, color, monthlyAvg, masteryPercent, testid }) => (
  <div className="h-32 w-full" data-testid={testid}>
    <ResponsiveContainer width="100%" height="100%" minHeight={100}>
      <LineChart data={data} margin={{ top: 8, right: 20, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="dateLabel"
          tick={{ fontSize: 10, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={12}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
          width={30}
        />
        <Tooltip
          contentStyle={{
            background: "white",
            border: "1px solid #E2E8F0",
            borderRadius: 8,
            fontSize: 11,
            padding: "4px 8px",
          }}
          labelFormatter={(l) => String(l ?? "")}
          formatter={(v) => [`${v}%`, "% Independent"]}
        />
        <ReferenceLine
          y={monthlyAvg}
          stroke="#94A3B8"
          strokeDasharray="4 4"
          strokeWidth={1.5}
          ifOverflow="extendDomain"
        />
        <ReferenceLine
          y={masteryPercent}
          stroke="#059669"
          strokeDasharray="6 3"
          strokeWidth={1.5}
          label={{ value: `Mastery ${masteryPercent}%`, position: "insideTopLeft", fontSize: 9, fill: "#059669" }}
        />
        <Line
          type="monotone"
          dataKey="percent"
          stroke={color}
          strokeWidth={2.6}
          dot={{ r: 3, fill: color }}
          activeDot={{ r: 5 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

const computeMonthlyAvg = (data) => {
  if (!data || data.length === 0) return 0;
  return Math.round(data.reduce((a, b) => a + b.percent, 0) / data.length);
};

export const summarizeTrials = (trials) => {
  const attempted = (trials || []).filter((t) => t !== null);
  const indCount = attempted.filter((t) => t === "independent").length;
  const todayScore =
    attempted.length > 0 ? Math.round((indCount / attempted.length) * 100) : null;
  return { attempted: attempted.length, indCount, todayScore };
};

export const TrialPanel = ({
  testidPrefix,
  trials,
  onSlotSelect,
  history,
  baseline = 0,
  targetPercent = 100,
  targetDate,
  onEditTarget,
  color = "#0d9488",
  extraHeader = null,
  mastery = DEFAULT_MASTERY,
  onSaveMastery,
}) => {
  const { can } = useClassroom();
  const readOnly = !can("log_trials");
  const { attempted, indCount, todayScore } = summarizeTrials(trials);
  const chartData = buildChartData(history);
  const monthlyAvg = computeMonthlyAvg(chartData);
  const scoreText =
    todayScore == null
      ? "Today's Score: —% (0 Trials)"
      : `Today's Score: ${todayScore}% (${indCount}/${attempted} Trials)`;

  return (
    <>
      {/* Today's Score */}
      <div
        className="mt-3 flex items-baseline gap-2"
        data-testid={`${testidPrefix}-today-score`}
      >
        <span
          className="text-xl font-extrabold text-slate-900"
          style={{ fontFamily: "Fredoka" }}
          data-testid={`${testidPrefix}-today-score-value`}
        >
          {scoreText}
        </span>
      </div>

      {/* Daily Trials T1–T5 */}
      <div className="mt-4" data-testid={`${testidPrefix}-trial-row`}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Daily Trials
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Tap to log</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <TrialSlot
              key={i}
              idx={i}
              state={(trials || [])[i] ?? null}
              onSelect={(lvl) => (readOnly ? toast.error("View-only access: your role can't log trials.") : onSlotSelect(i, lvl))}
              testidPrefix={testidPrefix}
            />
          ))}
        </div>
      </div>

      {/* Baseline / Target */}
      <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-slate-500 font-medium">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span data-testid={`${testidPrefix}-baseline-label`}>
            Baseline: <span className="text-slate-700 font-semibold">{baseline}%</span>
          </span>
          <span data-testid={`${testidPrefix}-target-label`}>
            Target:{" "}
            <span className="text-slate-700 font-semibold">
              {targetPercent}% by {shortDate(targetDate)}
            </span>
          </span>
        </div>
        {onEditTarget && (
          <button
            data-testid={`${testidPrefix}-edit-target-btn`}
            onClick={onEditTarget}
            className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-800 font-semibold shrink-0"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
        )}
      </div>

      <MasteryCriteria
        mastery={mastery}
        history={history}
        onSave={onSaveMastery}
        testidPrefix={testidPrefix}
      />

      {/* Chart section */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2 gap-2">
          <div className="flex flex-col leading-tight">
            <span
              className="text-[11px] font-bold uppercase tracking-wider text-slate-500"
              data-testid={`${testidPrefix}-trend-label`}
            >
              Trend · % Independent over time
            </span>
            <span
              className="text-[13px] font-bold text-slate-800 mt-0.5"
              data-testid={`${testidPrefix}-monthly-average`}
            >
              Monthly Average:{" "}
              <span className="text-teal-700" style={{ fontFamily: "Fredoka" }}>
                {monthlyAvg}%
              </span>
            </span>
          </div>
          {extraHeader}
        </div>
        {chartData.length === 0 ? (
          <div
            data-testid={`${testidPrefix}-chart-empty`}
            className="flex flex-col items-center justify-center text-center py-6 px-4 rounded-xl border border-dashed border-slate-300 bg-slate-50"
          >
            <LineChartIcon className="w-5 h-5 text-slate-400 mb-1.5" />
            <p className="text-xs font-semibold text-slate-600">
              No trial data recorded yet.
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Log trials above to generate trend line.
            </p>
          </div>
        ) : (
          <TrendChart
            data={chartData}
            color={color}
            monthlyAvg={monthlyAvg}
            masteryPercent={mastery.percent}
            testid={`${testidPrefix}-trend-chart`}
          />
        )}
      </div>
    </>
  );
};
