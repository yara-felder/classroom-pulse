import React, { useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { FileText, GraduationCap, Sparkles, AlertTriangle, Target } from "lucide-react";
import { startOfWeek, addDays, format } from "date-fns";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { useClassroom } from "@/context/ClassroomContext";
import { PdfExportDialog } from "@/components/dialogs/PdfExportDialog";
import { currentWeekdays } from "@/lib/weekDates";
import { studentDay } from "@/lib/pointCycle";
import { stampFerpa } from "@/lib/ferpa";

// Same deterministic mock + real logs used by Analytics grouping; future weekdays show 0.
const getStudentWeek = (student, studentLogs) =>
  currentWeekdays().map((wd) => ({ date: wd.label, ...studentDay(student.id, wd.date, studentLogs, student.createdAt) }));

const weekRangeLabel = () => {
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const friday = addDays(monday, 4);
  return {
    label: `${format(monday, "MMM d")} – ${format(friday, "MMM d, yyyy")}`,
    monday,
    friday,
  };
};

export const StudentAnalyticsSheet = ({ open, onOpenChange, student }) => {
  const { skillsByStudent, logs } = useClassroom();
  const chartRef = useRef(null);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  if (!student) return null;

  const studentLogs = logs.filter((l) => l.studentId === student.id);
  const weekData = getStudentWeek(student, studentLogs);
  const range = weekRangeLabel();
  const studentSkills = skillsByStudent[student.id] || [];
  const positiveCount = weekData.reduce((s, d) => s + d.positive, 0);
  const supportCount = weekData.reduce((s, d) => s + d.support, 0);

  // Build unified itemized log entries: behavior logs + today's skill trials (optionally filtered by date range)
  const buildItemizedLogs = (dateRange) => {
    const items = [];
    const inRange = (t) => {
      if (!dateRange) return true;
      return t >= dateRange.startDate && t <= dateRange.endDate;
    };
    studentLogs.forEach((l) => {
      const t = new Date(l.timestamp);
      if (!inRange(t)) return;
      items.push({
        time: t,
        type: l.type === "positive" ? "Positive" : l.type === "support" ? "Support" : "Note",
        name: l.tag,
        outcome:
          l.type === "positive"
            ? "+1 Point"
            : l.type === "support"
            ? "Support"
            : "Logged",
        notes: (l.notePrivate ? "" : l.note) || (l.notifyParent ? "Parent notify queued" : ""),
      });
    });
    // Today's skill trials (only if today falls within range)
    const today = new Date();
    if (inRange(today)) {
      studentSkills.forEach((sk) => {
        (sk.trials || []).forEach((t, i) => {
          if (!t) return;
          items.push({
            time: today,
            type: "Trial",
            name: sk.name,
            outcome: t === "independent" ? "Ind" : t === "prompted" ? "Pmt" : "Ref",
            notes: `Trial ${i + 1}`,
          });
        });
      });
    }
    items.sort((a, b) => b.time - a.time);
    return items;
  };

  const handleExportPdf = async (dateRange) => {
    const toastId = toast.loading("Generating PDF report...");
    try {
      const doc = new jsPDF({ unit: "pt", format: "letter" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 48;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      const ensureSpace = (needed) => {
        if (y + needed > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
      };

      // ---------- Header ----------
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("Behavior & Skill History Report", margin, y);
      y += 24;

      doc.setFontSize(14);
      doc.text(student.name, margin, y);
      y += 18;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Grade: ${student.grade}   ·   IEP: ${student.iep ? "Yes" : "No"}`, margin, y);
      y += 14;
      doc.text(`Guardian contact: ${[student.guardianName, student.guardianEmail].filter(Boolean).join(" · ") || "—"}`, margin, y);
      y += 14;
      // Prominent Report Period header
      const reportPeriodLabel = dateRange ? dateRange.rangeLabel : range.label;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(20, 90, 90);
      doc.text(`Report Period: ${reportPeriodLabel}`, margin, y);
      doc.setTextColor(0, 0, 0);
      y += 16;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Report generated: ${format(new Date(), "MMM d, yyyy h:mm a")}`, margin, y);
      y += 22;

      // ---------- Overall Mastery / Behavior Summary ----------
      const mastered = studentSkills.filter((sk) => sk.status === "Mastered").length;
      const inProgress = studentSkills.filter((sk) => sk.status === "In Progress").length;
      const needsSupport = studentSkills.filter((sk) => sk.status === "Needs Support").length;
      const posRatio =
        positiveCount + supportCount === 0
          ? 100
          : Math.round((positiveCount / (positiveCount + supportCount)) * 100);
      const avgSkillProgress =
        studentSkills.length === 0
          ? 0
          : Math.round(
              studentSkills.reduce((s, sk) => s + (sk.progress || 0), 0) / studentSkills.length
            );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Overall Summary", margin, y);
      y += 16;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);

      const summaryLines = [
        `Skills Mastered: ${mastered} / ${studentSkills.length}   ·   In Progress: ${inProgress}   ·   Needs Support: ${needsSupport}`,
        `Average Skill Progress: ${avgSkillProgress}%`,
        `Positive logs (week): ${positiveCount}   ·   Support logs (week): ${supportCount}   ·   Positive Ratio: ${posRatio}%`,
        `Active point balance: ${student.points}   ·   Lifetime points: ${student.lifetimePoints ?? student.points}   ·   Support flags: ${student.supportCount}`,
      ];
      summaryLines.forEach((line) => {
        doc.text(line, margin, y);
        y += 14;
      });
      y += 8;

      // ---------- Visual Graph ----------
      if (chartRef.current) {
        try {
          const canvas = await html2canvas(chartRef.current, {
            scale: 2,
            backgroundColor: "#ffffff",
            logging: false,
            useCORS: true,
          });
          const imgData = canvas.toDataURL("image/png");
          const imgW = contentWidth;
          const imgH = (canvas.height * imgW) / canvas.width;
          ensureSpace(imgH + 30);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.text("Weekday Performance Chart", margin, y);
          y += 14;
          doc.addImage(imgData, "PNG", margin, y, imgW, imgH, undefined, "FAST");
          y += imgH + 14;
        } catch (err) {
          // If image capture fails, continue without failing whole export
          console.warn("Chart capture failed", err);
        }
      }

      // ---------- Skill goals table ----------
      ensureSpace(60);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Skill Goals", margin, y);
      y += 14;
      doc.setFont("courier", "normal");
      doc.setFontSize(9.5);
      const skillHeader = "Skill                    Status         Last Trial   Progress  Baseline  Target";
      doc.text(skillHeader, margin, y);
      y += 12;
      doc.setDrawColor(200);
      doc.line(margin, y - 4, pageWidth - margin, y - 4);
      if (studentSkills.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.text("No active skill goals.", margin, y);
        y += 14;
      } else {
        studentSkills.forEach((sk) => {
          ensureSpace(14);
          const row = [
            (sk.name || "").slice(0, 22).padEnd(24),
            (sk.status || "").slice(0, 13).padEnd(15),
            (sk.lastPrompt || "—").slice(0, 11).padEnd(13),
            `${sk.progress ?? 0}%`.padEnd(10),
            `${sk.baseline ?? 0}%`.padEnd(10),
            `${sk.targetPercent ?? 100}% by ${
              sk.targetDate ? format(new Date(sk.targetDate), "MMM d") : "—"
            }`,
          ].join("");
          doc.text(row, margin, y);
          y += 12;
        });
      }
      y += 8;

      // ---------- Itemized Daily Logs ----------
      const items = buildItemizedLogs(dateRange);
      ensureSpace(40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Itemized Daily Logs", margin, y);
      y += 14;

      if (items.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(11);
        doc.text("No log entries recorded in this period.", margin, y);
        y += 14;
      } else {
        // Group by day
        const groups = {};
        items.forEach((it) => {
          const key = format(it.time, "EEEE, MMM d, yyyy");
          if (!groups[key]) groups[key] = [];
          groups[key].push(it);
        });

        const columnHeader =
          "Time      Type       Skill / Behavior           Outcome    Notes";
        Object.entries(groups).forEach(([day, rows]) => {
          ensureSpace(38);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(20, 90, 90);
          doc.text(day, margin, y);
          doc.setTextColor(0, 0, 0);
          y += 12;
          doc.setDrawColor(220);
          doc.line(margin, y - 3, pageWidth - margin, y - 3);
          doc.setFont("courier", "bold");
          doc.setFontSize(9);
          doc.text(columnHeader, margin, y + 4);
          y += 14;
          doc.setFont("courier", "normal");
          rows.forEach((it) => {
            ensureSpace(14);
            const time = format(it.time, "h:mm a").padEnd(10);
            const type = (it.type || "").slice(0, 9).padEnd(11);
            const name = (it.name || "").slice(0, 25).padEnd(27);
            const outcome = (it.outcome || "").slice(0, 9).padEnd(11);
            const notes = (it.notes || "").slice(0, 40);
            doc.text(`${time}${type}${name}${outcome}${notes}`, margin, y);
            y += 11;
          });
          y += 8;
        });
      }

      // Footer on last page
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(
        `Classroom Pulse · Confidential student record · ${student.name}`,
        margin,
        pageHeight - 20
      );

      const filename = `${student.name.replace(/\s+/g, "_")}-History-${format(
        new Date(),
        "yyyy-MM-dd"
      )}.pdf`;
      stampFerpa(doc);
      doc.save(filename);
      toast.success("History report downloaded", { id: toastId, description: filename });
    } catch (e) {
      toast.error("Could not generate PDF", {
        id: toastId,
        description: String(e?.message || e),
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        data-testid={`student-analytics-sheet-${student.id}`}
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto bg-[#FAFAF7]"
      >
        <SheetHeader className="pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <img
              src={student.avatar}
              alt={student.name}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow-sm bg-slate-100"
            />
            <div>
              <SheetTitle style={{ fontFamily: "Outfit" }} className="text-xl">
                {student.name}
              </SheetTitle>
              <SheetDescription className="mt-0.5">Weekly analytics</SheetDescription>
              <div className="flex items-center gap-2 mt-0.5 text-sm text-slate-600">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{student.grade}</span>
                {student.iep && (
                  <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-[10px] font-bold ml-1">
                    IEP
                  </Badge>
                )}
                {student.plan504 && (
                  <Badge className="bg-teal-100 text-teal-700 border-teal-200 text-[10px] font-bold ml-1">
                    504
                  </Badge>
                )}
              </div>
              <span
                className="text-xs text-slate-500 font-medium mt-1 block"
                data-testid={`analytics-range-${student.id}`}
              >
                {range.label}
              </span>
            </div>
          </div>
        </SheetHeader>

        {/* Weekly KPIs */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white border border-emerald-200 rounded-2xl p-3">
            <div className="flex items-center gap-2 text-emerald-700">
              <Sparkles className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Positive · Week</span>
            </div>
            <div
              className="text-2xl font-extrabold text-slate-900 mt-1"
              style={{ fontFamily: "Fredoka" }}
              data-testid={`analytics-positive-week-${student.id}`}
            >
              {positiveCount}
            </div>
          </div>
          <div className="bg-white border border-amber-200 rounded-2xl p-3">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Support · Week</span>
            </div>
            <div
              className="text-2xl font-extrabold text-slate-900 mt-1"
              style={{ fontFamily: "Fredoka" }}
              data-testid={`analytics-support-week-${student.id}`}
            >
              {supportCount}
            </div>
          </div>
        </div>

        {/* Line chart Mon-Fri */}
        <div
          className="bg-white border border-slate-200 rounded-2xl p-4 mt-4"
          data-testid={`analytics-line-${student.id}`}
        >
          <h4
            className="text-sm font-bold text-slate-900"
            style={{ fontFamily: "Outfit" }}
          >
            Weekday performance
          </h4>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            {weekData[0].date} to {weekData[weekData.length - 1].date}
          </p>
          <div className="h-60 mt-3" ref={chartRef}>
            <ResponsiveContainer width="100%" height="100%" minHeight={180}>
              <LineChart data={weekData} margin={{ top: 6, right: 12, left: 0, bottom: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} data-testid="student-weekday-xaxis" />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "white",
                    border: "1px solid #E2E8F0",
                    borderRadius: 8,
                    fontSize: 11,
                    padding: "4px 8px",
                  }}
                />
                <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 11, paddingTop: 14 }} />
                <Line
                  type="monotone"
                  dataKey="positive"
                  name="Positive"
                  stroke="#10B981"
                  strokeWidth={2.6}
                  dot={{ r: 3, fill: "#10B981" }}
                />
                <Line
                  type="monotone"
                  dataKey="support"
                  name="Support"
                  stroke="#F59E0B"
                  strokeWidth={2.6}
                  dot={{ r: 3, fill: "#F59E0B" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill goals summary */}
        <div
          className="bg-white border border-slate-200 rounded-2xl p-4 mt-4"
          data-testid={`analytics-skills-${student.id}`}
        >
          <h4
            className="text-sm font-bold text-slate-900 flex items-center gap-2"
            style={{ fontFamily: "Outfit" }}
          >
            <Target className="w-4 h-4 text-teal-600" />
            Skill goals ({studentSkills.length})
          </h4>
          <div className="mt-3 space-y-2">
            {studentSkills.length === 0 && (
              <p className="text-xs text-slate-400 italic">No active goals.</p>
            )}
            {studentSkills.map((sk) => (
              <div
                key={sk.id}
                className="flex items-center justify-between text-xs px-3 py-2 bg-slate-50 rounded-lg"
              >
                <div>
                  <div className="font-semibold text-slate-800">{sk.name}</div>
                  <div className="text-slate-500">
                    {sk.status} · {sk.progress}% · Last trial: {sk.lastPrompt || "—"}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`font-semibold ${
                    sk.status === "Mastered"
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : sk.status === "Needs Support"
                      ? "bg-rose-50 text-rose-700 border-rose-300"
                      : "bg-amber-50 text-amber-700 border-amber-300"
                  }`}
                >
                  {sk.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Download PDF button */}
        <button
          data-testid={`download-history-pdf-btn-${student.id}`}
          onClick={() => setPdfDialogOpen(true)}
          className="mt-4 mb-6 w-full inline-flex items-center justify-center gap-2 text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-4 py-3 transition-colors shadow-sm active:scale-95"
        >
          <FileText className="w-4 h-4" />
          Download PDF History Report
        </button>

        <PdfExportDialog
          open={pdfDialogOpen}
          onOpenChange={setPdfDialogOpen}
          student={student}
          onExport={handleExportPdf}
        />
      </SheetContent>
    </Sheet>
  );
};
