import { isValidEmail } from "@/components/dialogs/GuardianFields";

const splitCsvLine = (line) => {
  const out = [];
  let cur = "";
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') quoted = !quoted;
    else if (ch === "," && !quoted) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
};

const splitName = (full) => {
  const parts = full.trim().split(/\s+/);
  return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") };
};

const clean = (r) => ({
  firstName: r.firstName.trim(),
  lastName: (r.lastName || "").trim(),
  grade: (r.grade || "").trim(),
  guardianName: (r.guardianName || "").trim(),
  guardianEmail: isValidEmail(r.guardianEmail || "") ? (r.guardianEmail || "").trim() : "",
});

// One student per line: "First Last".
export const parsePastedNames = (text) =>
  text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => clean(splitName(l)))
    .filter((r) => r.firstName);

const HEADER_KEYS = {
  firstName: ["first", "first name", "firstname", "given name"],
  lastName: ["last", "last name", "lastname", "surname", "family name"],
  name: ["name", "student", "student name", "full name"],
  grade: ["grade", "grade level"],
  guardianName: ["guardian", "guardian name", "parent", "parent name"],
  guardianEmail: ["guardian email", "parent email", "email", "guardian e-mail"],
};

// CSV with optional header row: first, last, grade, guardian name, guardian email.
export const parseRosterCsv = (text) => {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const first = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const hasHeader = first.some((h) => Object.values(HEADER_KEYS).flat().includes(h));
  const idx = {};
  if (hasHeader) {
    Object.entries(HEADER_KEYS).forEach(([k, names]) => {
      idx[k] = first.findIndex((h) => names.includes(h));
    });
  } else {
    Object.assign(idx, { firstName: 0, lastName: 1, grade: 2, guardianName: 3, guardianEmail: 4, name: -1 });
  }
  const at = (cells, k) => (idx[k] >= 0 ? cells[idx[k]] || "" : "");
  return (hasHeader ? lines.slice(1) : lines)
    .map((l) => {
      const cells = splitCsvLine(l);
      const names = at(cells, "firstName")
        ? { firstName: at(cells, "firstName"), lastName: at(cells, "lastName") }
        : splitName(at(cells, "name"));
      return clean({
        ...names,
        grade: at(cells, "grade"),
        guardianName: at(cells, "guardianName"),
        guardianEmail: at(cells, "guardianEmail"),
      });
    })
    .filter((r) => r.firstName);
};
