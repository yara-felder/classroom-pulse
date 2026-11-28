import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { stampFerpa } from "@/lib/ferpa";

const MARGIN = 48;
const BOTTOM_PAD = 56;

const DAILY_COLS = [
  { key: "date", label: "Date", w: 0.16 },
  { key: "percent", label: "% Independent", w: 0.17 },
  { key: "cues", label: "Support Cues", w: 0.42, wrap: true },
  { key: "digest", label: "Parent Digest", w: 0.25 },
];

const OVERVIEW_COLS = [
  { key: "goal", label: "Goal", w: 0.38, wrap: true },
  { key: "type", label: "Type", w: 0.1 },
  { key: "status", label: "Status", w: 0.16 },
  { key: "today", label: "Today", w: 0.1 },
  { key: "avg", label: "Average", w: 0.12 },
  { key: "mastery", label: "Mastery", w: 0.14 },
];

const LOG_COLS = [
  { key: "time", label: "Date / Time", w: 0.2 },
  { key: "type", label: "Type", w: 0.11 },
  { key: "tag", label: "Tag / Cues", w: 0.22, wrap: true },
  { key: "note", label: "Note", w: 0.25, wrap: true },
  { key: "digest", label: "Parent Digest", w: 0.22 },
];

const localDay = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const formatDay = (iso) => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(String(iso))) return iso || "—";
  const [year, month, day] = String(iso).slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const BADGE = { badge: "Parent notify queued" };

// One row per logged day, merged with the student's behavior logs from that day.
export const buildDailyRows = (history, logs) =>
  (history || [])
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((h) => {
      const dayLogs = (logs || []).filter((l) => localDay(l.timestamp) === h.date);
      const cues = dayLogs.filter((l) => l.type === "support").map((l) => l.tag).filter(Boolean);
      return {
        date: formatDay(h.date),
        percent: `${h.percent}%`,
        cues: cues.length ? [...new Set(cues)].join(", ") : "—",
        digest: dayLogs.some((l) => l.notifyParent) ? BADGE : "—",
      };
    });

const buildLogRows = (logs, includeReflections) =>
  (logs || [])
    .slice()
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .map((l) => ({
      time: new Date(l.timestamp).toLocaleString([], { dateStyle: "short", timeStyle: "short" }),
      type: l.type === "positive" ? "Positive" : l.type === "support" ? "Support" : "Note",
      tag: l.tag || "—",
      note: l.notePrivate ? (includeReflections ? `[Teacher reflection] ${l.note}` : "—") : l.note || "—",
      digest: l.notifyParent ? BADGE : "—",
    }));

const captureChart = async (el) => {
  if (!el) return null;
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff", logging: false });
  return { url: canvas.toDataURL("image/png"), ratio: canvas.height / canvas.width };
};

const INK = [15, 23, 42];
const MUTED = [100, 116, 139];
const TEAL = [13, 148, 136];

const heading = (doc, text, y, size = 12) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(size);
  doc.setTextColor(...INK);
  doc.text(text, MARGIN, y);
};

const runningHeader = (doc, label) => {
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...TEAL);
  doc.text("WrenRoom", MARGIN, 32);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  const maxW = pageW - MARGIN * 2 - 88;
  let shown = String(label || "");
  if (doc.getTextWidth(shown) > maxW) {
    while (shown.length > 1 && doc.getTextWidth(`${shown}...`) > maxW) shown = shown.slice(0, -1);
    shown = `${shown.trim()}...`;
  }
  doc.text(shown, pageW - MARGIN, 32, { align: "right" });
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, 40, pageW - MARGIN, 40);
  doc.setTextColor(...INK);
  return 58;
};

const continuePage = (doc, label) => {
  doc.addPage();
  return label ? runningHeader(doc, label) : MARGIN;
};

const drawHeaderRow = (doc, cols, x, y, width) => {
  doc.setFillColor(241, 245, 249);
  doc.rect(x, y, width, 20, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  let cx = x;
  cols.forEach((c) => {
    doc.text(c.label, cx + 6, y + 13);
    cx += c.w * width;
  });
  doc.setTextColor(15, 23, 42);
  return y + 20;
};

const drawBadge = (doc, text, x, y) => {
  doc.setFillColor(204, 251, 241);
  doc.setDrawColor(94, 234, 212);
  doc.roundedRect(x, y - 9, 104, 13, 6, 6, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 118, 110);
  doc.text(text, x + 7, y);
  doc.setTextColor(15, 23, 42);
};

const drawTable = (doc, cols, rows, startY, continued) => {
  const pageH = doc.internal.pageSize.getHeight();
  const width = doc.internal.pageSize.getWidth() - MARGIN * 2;
  const x = MARGIN;
  let y = drawHeaderRow(doc, cols, x, startY, width);
  rows.forEach((r, i) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    const cells = cols.map((c) => {
      const v = r[c.key];
      if (v && v.badge) return v;
      return c.wrap ? doc.splitTextToSize(String(v ?? "—"), c.w * width - 12) : [String(v ?? "—")];
    });
    const lines = Math.max(...cells.map((c) => (Array.isArray(c) ? c.length : 1)));
    const rowH = Math.max(18, lines * 11 + 7);
    if (y + rowH > pageH - BOTTOM_PAD) {
      y = continuePage(doc, continued);
      y = drawHeaderRow(doc, cols, x, y, width);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...INK);
    }
    if (i % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(x, y, width, rowH, "F");
    }
    let cx = x;
    cells.forEach((cell, ci) => {
      if (cell.badge) drawBadge(doc, cell.badge, cx + 6, y + 12);
      else doc.text(cell, cx + 6, y + 12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      cx += cols[ci].w * width;
    });
    doc.setDrawColor(226, 232, 240);
    doc.line(x, y + rowH, x + width, y + rowH);
    y += rowH;
  });
  return y;
};

const ensureSpace = (doc, y, needed, continued) => {
  if (y + needed > doc.internal.pageSize.getHeight() - BOTTOM_PAD) {
    return continuePage(doc, continued);
  }
  return y;
};

const drawCover = (doc, { student, meta, kicker }) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...TEAL);
  doc.text("WRENROOM", MARGIN, MARGIN);
  doc.setTextColor(...INK);
  doc.setFontSize(22);
  doc.text(student?.name || "Student", MARGIN, MARGIN + 28);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  let y = MARGIN + 48;
  if (meta) {
    doc.text(meta, MARGIN, y);
    y += 16;
  }
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  const dated = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  doc.text([kicker, dated].filter(Boolean).join("  ·  "), MARGIN, y);
  doc.setTextColor(...INK);
  return y + 24;
};

const writeWrapped = (doc, text, y, width, size = 10.5) => {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(size);
  doc.setTextColor(...INK);
  doc.splitTextToSize(String(text), width).forEach((line) => {
    doc.text(line, MARGIN, y);
    y += size + 4;
  });
  return y;
};

// Summary block → centered chart → daily log table. Returns the y after the section.
const renderGoalSection = async (doc, { goalName, summaryLines, history, logs, chartEl, maxDays, continued }, y, sizeTitle = 13) => {
  const pageW = doc.internal.pageSize.getWidth();
  const contentW = pageW - MARGIN * 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(sizeTitle);
  doc.setTextColor(...INK);
  doc.splitTextToSize(goalName, contentW).forEach((line) => {
    doc.text(line, MARGIN, y);
    y += sizeTitle + 4;
  });
  y += 6;
  heading(doc, "Where this goal stands", y);
  y += 16;
  summaryLines.forEach((line) => {
    y = writeWrapped(doc, line, y, contentW);
  });
  y += 8;

  heading(doc, "Trend · percent independent", y);
  y += 12;
  const chart = await captureChart(chartEl);
  if (chart) {
    const imgW = contentW * 0.8;
    const imgH = imgW * chart.ratio;
    y = ensureSpace(doc, y, imgH + 20, continued);
    const imgX = (pageW - imgW) / 2;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.8);
    doc.roundedRect(imgX - 6, y - 2, imgW + 12, imgH + 12, 6, 6, "S");
    doc.addImage(chart.url, "PNG", imgX, y + 4, imgW, imgH);
    doc.setLineWidth(0.6);
    y += imgH + 26;
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text("No trial data recorded yet.", MARGIN, y + 12);
    doc.setTextColor(...INK);
    y += 30;
  }

  const allRows = buildDailyRows(history, logs);
  const rows = maxDays ? allRows.slice(0, maxDays) : allRows;
  y = ensureSpace(doc, y, 60, continued);
  heading(doc, maxDays ? `Trial history · last ${maxDays} days` : "Trial history", y);
  y += 10;
  if (rows.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text("No logged days yet.", MARGIN, y + 14);
    doc.setTextColor(...INK);
    return y + 24;
  }
  return drawTable(doc, DAILY_COLS, rows, y, continued);
};

export const generateGoalReportPDF = async ({ reportTitle, goalName, student, summaryLines, history, logs, chartEl, filename }) => {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const continued = `${student?.name || "Student"} · ${goalName}`;
  const y = drawCover(doc, {
    student,
    meta: student?.grade || "",
    kicker: reportTitle,
  });
  await renderGoalSection(doc, { goalName, summaryLines, history, logs, chartEl, continued }, y + 4);
  stampFerpa(doc);
  doc.save(filename);
};

// items: [{ sectionLabel, goalName, summaryLines, history, chartEl, overview }]
export const generateStudentReportPDF = async ({ student, periodNames, planLabel, items, logs, filename, includeReflections = false }) => {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const continued = `${student?.name || "Student"} · Student progress`;
  const plan = planLabel && planLabel !== "None" ? planLabel : "";
  const periods = (periodNames || []).filter(Boolean).join(", ");
  const meta = [periods || student?.grade || "", plan].filter(Boolean).join("  ·  ");
  let y = drawCover(doc, { student, meta, kicker: "Student progress" });
  heading(doc, `Goals (${items.length})`, y);
  y += 10;
  if (items.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text("No goals yet.", MARGIN, y + 14);
    doc.setTextColor(...INK);
    y += 36;
  } else {
    y = drawTable(doc, OVERVIEW_COLS, items.map((i) => i.overview), y, continued) + 22;
  }

  for (const item of items) {
    y = ensureSpace(doc, y, 180, continued);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...TEAL);
    doc.text(item.sectionLabel.toUpperCase(), MARGIN, y);
    doc.setTextColor(...INK);
    y = await renderGoalSection(doc, { ...item, logs, maxDays: 14, continued }, y + 18, 15);
    y += 20;
  }

  const logRows = buildLogRows(logs, includeReflections);
  y = ensureSpace(doc, y, logRows.length ? 80 : 48, continued);
  heading(doc, "Logged moments", y, 16);
  if (logRows.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text("No moments logged yet.", MARGIN, y + 22);
    doc.setTextColor(...INK);
  } else {
    drawTable(doc, LOG_COLS, logRows, y + 12, continued);
  }
  stampFerpa(doc);
  doc.save(filename);
};
