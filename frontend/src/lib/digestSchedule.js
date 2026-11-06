import { format } from "date-fns";

export const WEEK_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const DEFAULT_DIGEST_SETTINGS = {
  day: 5,
  time: "15:00",
  approvalMode: "auto",
  header: "",
  footer: "",
  lastAutoRunAt: null,
};

export const nextScheduledAt = ({ day, time }, now = new Date()) => {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  d.setDate(d.getDate() + ((day - d.getDay() + 7) % 7));
  if (d <= now) d.setDate(d.getDate() + 7);
  return d;
};

export const lastScheduledAt = (settings, now = new Date()) => {
  const d = nextScheduledAt(settings, now);
  d.setDate(d.getDate() - 7);
  return d;
};

export const formatTime12 = (time) => {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return format(d, "h:mm a");
};

export const scheduleLabel = (s) => `${WEEK_DAYS[s.day].slice(0, 3)} ${formatTime12(s.time)}`;

export const sentLabel = (iso) => format(new Date(iso), "MMM d, h:mm a");
