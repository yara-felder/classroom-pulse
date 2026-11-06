export const DEFAULT_MASTERY = { percent: 80, days: 5 };

// Counts consecutive most-recent logged days at or above the mastery percent.
export const computeMasteryStreak = (history, mastery = DEFAULT_MASTERY) => {
  const sorted = (history || [])
    .filter((h) => h && Number.isFinite(h.percent))
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
  let streak = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].percent >= mastery.percent) streak += 1;
    else break;
  }
  return { streak, met: streak >= mastery.days };
};
