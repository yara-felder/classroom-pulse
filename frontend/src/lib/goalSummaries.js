import { format } from "date-fns";
import { computeMasteryStreak, DEFAULT_MASTERY } from "@/components/goals/mastery";

const TRIAL_LABEL = { independent: "Independent", prompted: "Prompted", refused: "Refused" };

const longDate = (iso) => (iso ? format(new Date(iso), "MMM d, yyyy") : "—");
const dayWord = (n) => `${n} ${Number(n) === 1 ? "day" : "days"}`;

export const todayStats = (trials) => {
  const attempted = (trials || []).filter((t) => t !== null);
  const ind = attempted.filter((t) => t === "independent").length;
  return { attempted: attempted.length, ind, score: attempted.length ? Math.round((ind / attempted.length) * 100) : null };
};

export const monthlyAverage = (history) => {
  const pts = (history || []).map((h) => h.percent).filter((v) => Number.isFinite(v));
  return pts.length ? Math.round(pts.reduce((a, b) => a + b, 0) / pts.length) : 0;
};

export const lastTrialLabel = (trials) => {
  const last = [...(trials || [])].reverse().find(Boolean);
  return last ? TRIAL_LABEL[last] : null;
};

export const trialsLine = (trials) =>
  `Today's Trials: ${(trials || [null, null, null, null, null])
    .map((t, i) => `T${i + 1} ${t ? TRIAL_LABEL[t] : "—"}`)
    .join(" · ")}`;

export const pdfFilename = (studentName, label) =>
  `${(studentName || "student").replace(/\s+/g, "_")}-${label.slice(0, 40).replace(/[^a-zA-Z0-9]+/g, "_")}.pdf`;

export const masteryProgress = (item) => {
  const m = item.mastery || DEFAULT_MASTERY;
  const { streak } = computeMasteryStreak(item.history, m);
  return { m, shown: Math.min(streak, m.days) };
};

export const deriveIepStatus = (goal) => {
  const attempted = (goal.trials || []).filter((t) => t !== null);
  if (computeMasteryStreak(goal.history, goal.mastery || DEFAULT_MASTERY).met) return "Mastered";
  if (attempted.length === 0 && (goal.history || []).length === 0) return "Not Started";
  if (attempted.some((t) => t === "refused")) return "Needs Support";
  return "In Progress";
};

const scoreLine = (trials) => {
  const t = todayStats(trials);
  return t.score == null
    ? "Today's Score: —% (0 Trials)"
    : `Today's Score: ${t.score}% (${t.ind}/${t.attempted} Trials)`;
};

const masteryLine = (item) => {
  const { m, shown } = masteryProgress(item);
  return `Mastery: ${m.percent}% independent over ${dayWord(m.days)} (${shown} of ${m.days} met)`;
};

export const skillSummaryLines = (skill) => [
  scoreLine(skill.trials),
  `Monthly Average: ${monthlyAverage(skill.history)}%   ·   Baseline: ${skill.baseline ?? 0}%`,
  `Target: ${skill.targetPercent ?? 100}% by ${longDate(skill.targetDate)}`,
  masteryLine(skill),
  `Status: ${skill.status}   ·   Last trial: ${lastTrialLabel(skill.trials) || skill.lastPrompt || "—"}`,
  trialsLine(skill.trials),
];

export const iepSummaryLines = (goal) => [
  `Plan: ${goal.planType || "IEP"}   ·   Domain: ${goal.domain || "—"}`,
  scoreLine(goal.trials),
  `Monthly Average: ${monthlyAverage(goal.history)}%   ·   Baseline: ${goal.baseline ?? 0}%`,
  `Target: ${goal.targetPercent ?? 100}% by ${longDate(goal.targetDate)}`,
  masteryLine(goal),
  `Status: ${deriveIepStatus(goal)}   ·   Last trial: ${lastTrialLabel(goal.trials) || "—"}`,
  trialsLine(goal.trials),
];

export const overviewRow = (item, type, status) => {
  const t = todayStats(item.trials);
  const { m, shown } = masteryProgress(item);
  return {
    goal: type === "skill" ? item.name : item.description,
    type: type === "skill" ? "Skill" : item.planType || "IEP",
    status,
    today: t.score == null ? "—" : `${t.score}%`,
    avg: `${monthlyAverage(item.history)}%`,
    mastery: `${shown}/${m.days} @ ${m.percent}%`,
  };
};
