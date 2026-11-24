export const SUPPORT_CONTEXT_GROUPS = [
  {
    id: "activity",
    label: "During what activity?",
    options: ["Whole Class", "Independent Work", "Switching Activities", "Small Group", "Lunch / Recess"],
    allowOther: true,
    otherPlaceholder: "Type custom activity...",
  },
  {
    id: "before",
    label: "What happened right before?",
    options: ["Asked to Start Work", "Transition / Stop", "Told \"No\" / Wait", "Peer Issue", "Loud / Busy Room", "Downtime / Waiting"],
    allowOther: true,
    otherPlaceholder: "Type what happened...",
  },
  {
    id: "helped",
    label: "What helped?",
    options: ["Reminder / Visual Cue", "Short Break / Calm Tool", "Broke Task Into Steps", "1-on-1 Check-In", "Gave Space"],
    allowOther: true,
    otherPlaceholder: "Type what helped...",
  },
  {
    id: "duration",
    label: "How long did it last?",
    options: ["Less than 1 min", "1–5 min", "5–15 min", "15+ min"],
  },
];

export const emptySupportContext = () =>
  Object.fromEntries(SUPPORT_CONTEXT_GROUPS.map((group) => [group.id, ""]));

export const cleanSupportContext = (context) => {
  const next = {};
  SUPPORT_CONTEXT_GROUPS.forEach((group) => {
    const value = (context?.[group.id] || "").trim();
    if (value) next[group.id] = value;
  });
  return next;
};

export const contextTags = (context) =>
  SUPPORT_CONTEXT_GROUPS.map((group) => context?.[group.id]).filter(Boolean);

export const contextStateFromLog = (log) => {
  const context = emptySupportContext();
  const otherOpen = {};
  SUPPORT_CONTEXT_GROUPS.forEach((group) => {
    const value = (log?.context?.[group.id] || "").trim();
    context[group.id] = value;
    if (group.allowOther && value && !group.options.includes(value)) otherOpen[group.id] = true;
  });
  return { context, otherOpen };
};

export const timeInputValue = (date = new Date()) => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

export const dateFromTimeInput = (value, base = new Date()) => {
  const match = /^(\d{2}):(\d{2})$/.exec(value || "");
  const next = new Date(base);
  if (!match) return next;
  next.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return next;
};

export const formatLogTime = (timestamp) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};
