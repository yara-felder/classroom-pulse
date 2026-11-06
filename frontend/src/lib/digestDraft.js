import { format } from "date-fns";

export const DRAFT_FIELDS = ["personalNote", "intro", "celebrations", "mastered", "support", "homeConnection"];

export const DEFAULT_FOOTER = "Thanks for partnering with us. Reply to this email anytime; it goes straight to your teacher.";

// Saved drafts only hold the fields a teacher changed, so untouched sections keep updating with new logs.
export const mergeDraft = (original, saved) => ({ ...original, ...(saved?.overrides || {}) });

export const diffOverrides = (fields, original) =>
  Object.fromEntries(DRAFT_FIELDS.filter((k) => (fields[k] || "").trim() !== (original[k] || "").trim()).map((k) => [k, fields[k]]));

const day = (iso) => (iso ? format(new Date(iso), "EEE") : "");

export const firstNameOf = (student) => (student?.name || "").split(/\s+/)[0] || "your child";

export const salutationFor = (student) =>
  student.guardianName ? `Hi ${student.guardianName},` : `Hi ${firstNameOf(student)}'s family,`;

export const buildOriginalDraft = (student, snapshot, settings) => {
  const name = firstNameOf(student);
  const { wins, mastered, supportNotes } = snapshot;
  return {
    personalNote: "",
    intro:
      settings.header ||
      `Here is your weekly Classroom Pulse update for ${name}! We use this tool to share real-time skill growth, celebrate wins, and keep home-to-school communication transparent.`,
    celebrations: wins.length
      ? wins.map((w) => `• ${day(w.timestamp)}: ${w.tag}${w.note ? `: ${w.note}` : ""}`).join("\n")
      : `${name} had a steady week! Specific celebration notes will appear here as they are logged.`,
    mastered: mastered.length
      ? mastered.map((m) => `• ${m.name} (${m.kind})`).join("\n")
      : "Actively working on core learning goals and daily routines.",
    support: supportNotes.length
      ? supportNotes.map((n) => `• ${day(n.timestamp)} · ${n.tag}${n.note ? `: ${n.note}` : ""}`).join("\n")
      : "No support strategies or cues needed to be flagged this week!",
    homeConnection: `Want to chat about the school week? Ask ${name} to share one thing they were proud of working on this week!`,
  };
};

export const isDraftEdited = (draft, original) =>
  !!draft && DRAFT_FIELDS.some((k) => (draft[k] || "").trim() !== (original[k] || "").trim());

const esc = (s) =>
  String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const paras = (text) =>
  String(text || "")
    .split(/\n+/)
    .filter((p) => p.trim())
    .map((p) => `<p style="margin:0 0 6px">${esc(p)}</p>`)
    .join("");

const section = (title, text) =>
  text.trim() ? `<h3 style="margin:16px 0 6px;font-size:15px">${esc(title)}</h3>${paras(text)}` : "";

export const compileDigestHtml = ({ student, draft, footer, ferpa }) =>
  [
    `<div style="font-family:Arial,sans-serif;color:#1e293b;font-size:14px;line-height:1.5">`,
    `<h2 style="margin:0 0 8px;font-size:18px">${esc(salutationFor(student))}</h2>`,
    draft.personalNote.trim() ? `<div style="margin:0 0 12px">${paras(draft.personalNote)}</div>` : "",
    paras(draft.intro),
    section("Celebrations", draft.celebrations),
    section("Mastered skill highlights", draft.mastered),
    section("Support notes", draft.support),
    draft.homeConnection.trim()
      ? `<div style="margin:16px 0;padding:12px;background:#fffbeb;border-radius:8px"><b>&#128161; Parent Connection:</b> ${esc(draft.homeConnection)}</div>`
      : "",
    `<div style="color:#64748b;font-size:12px">${paras(footer)}</div>`,
    `<p style="color:#94a3b8;font-size:10px">${esc(ferpa)}</p>`,
    `</div>`,
  ].join("");
