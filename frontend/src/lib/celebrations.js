import { deriveIepStatus } from "@/lib/goalSummaries";
import { DEFAULT_MASTERY, computeMasteryStreak } from "@/components/goals/mastery";
import { sumRange } from "@/lib/pointCycle";

export const STATUS_GROUPS = [
  { id: "thriving", label: "Thriving & Growing", hint: "Demonstrating consistent positive skills and independence", tone: "emerald" },
  { id: "building", label: "Building Momentum", hint: "Actively practicing new skills and working toward goals", tone: "sky" },
  { id: "focus", label: "Focus & Strategy Needed", hint: "Requires environmental tweaks or targeted skill instruction", tone: "amber" },
];

const H48 = 48 * 60 * 60 * 1000;

// Stable = mastered, or not needing support and the last 5 days are not trending below the 5 before.
const goalStable = (item, status) => {
  if (status === "Mastered") return true;
  if (status === "Needs Support") return false;
  const h = (item.history || []).slice().sort((a, b) => a.date.localeCompare(b.date));
  if (h.length < 10) return true;
  const avg = (arr) => arr.reduce((s, x) => s + x.percent, 0) / arr.length;
  return avg(h.slice(-5)) >= avg(h.slice(-10, -5)) - 5;
};

export const studentStatusGroup = (student, skills, iepGoals, logs, bounds, now = Date.now()) => {
  const hasPlan = !!(student.iep || student.plan504);
  const goals = hasPlan ? iepGoals || [] : [];
  const recentSupport = logs.filter(
    (l) => l.studentId === student.id && l.type === "support" && now - new Date(l.timestamp).getTime() <= H48
  ).length;
  const iepNeedsStrategy = goals.some((g) => deriveIepStatus(g) === "Needs Support");
  if (recentSupport >= 3 || iepNeedsStrategy) return "focus";
  const { positive, support } = sumRange([student], logs, bounds.start, bounds.end);
  const ratio = positive + support === 0 ? 0 : positive / (positive + support);
  const stable =
    (skills || []).every((sk) => goalStable(sk, sk.status)) &&
    goals.every((g) => goalStable(g, deriveIepStatus(g)));
  return ratio >= 0.8 && stable ? "thriving" : "building";
};

const consecutiveGrowth = (history) => {
  const h = (history || []).slice().sort((a, b) => a.date.localeCompare(b.date));
  let n = 0;
  for (let i = h.length - 1; i > 0; i--) {
    if (h[i].percent > h[i - 1].percent) n += 1;
    else break;
  }
  return { n, date: h[h.length - 1]?.date };
};

const goalItems = (student, item, name) => {
  const out = [];
  const hist = (item.history || []).slice().sort((a, b) => a.date.localeCompare(b.date));
  const latest = hist[hist.length - 1];
  const m = item.mastery || DEFAULT_MASTERY;
  if (computeMasteryStreak(hist, m).met) {
    out.push({ kind: "mastered", text: `Mastered ${m.percent}% independence on ${name}`, date: latest?.date });
  }
  const g = consecutiveGrowth(hist);
  if (g.n >= 3) out.push({ kind: "streak", text: `${g.n} consecutive days of growth on ${name}`, date: g.date });
  if (latest && hist.length > 5) {
    const best = Math.max(...hist.slice(0, -1).map((x) => x.percent));
    if (latest.percent > best) out.push({ kind: "best", text: `New personal best: ${latest.percent}% independent on ${name}`, date: latest.date });
  }
  const recent = hist.slice(-5);
  if (recent.length === 5) {
    const avg = Math.round(recent.reduce((a, b) => a + b.percent, 0) / 5);
    const gain = avg - (item.baseline ?? 0);
    if (gain >= 20) out.push({ kind: "growth", text: `+${gain}% above baseline on ${name} (5-day avg)`, date: latest.date });
  }
  return out.map((o) => ({ ...o, student }));
};

export const buildCelebrations = (students, skillsByStudent, iepGoalsByStudent, limit = 8) => {
  const items = students.flatMap((s) => {
    const hasPlan = !!(s.iep || s.plan504);
    return [
      ...(skillsByStudent[s.id] || []).flatMap((sk) => goalItems(s, sk, sk.name)),
      ...(hasPlan ? iepGoalsByStudent[s.id] || [] : []).flatMap((g) => goalItems(s, g, g.description)),
    ];
  });
  const rank = { mastered: 0, best: 1, streak: 2, growth: 3 };
  const seen = new Set();
  const unique = items
    .sort((a, b) => rank[a.kind] - rank[b.kind] || (b.date || "").localeCompare(a.date || ""))
    .filter((c) => {
      const key = `${c.student.id}|${c.kind}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  // Round-robin across kinds so the feed mixes milestone types.
  const buckets = Object.keys(rank).map((k) => unique.filter((c) => c.kind === k));
  const mixed = [];
  while (mixed.length < limit && buckets.some((b) => b.length)) {
    buckets.forEach((b) => {
      if (b.length && mixed.length < limit) mixed.push(b.shift());
    });
  }
  return mixed;
};
