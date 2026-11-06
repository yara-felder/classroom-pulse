import React from "react";
import { useClassroom } from "@/context/ClassroomContext";
import { useAuth } from "@/context/AuthContext";
import { PdfReportButton, chartElFor } from "@/components/goals/PdfReportButton";
import { generateStudentReportPDF } from "@/lib/goalReportPdf";
import {
  skillSummaryLines,
  iepSummaryLines,
  overviewRow,
  deriveIepStatus,
  pdfFilename,
} from "@/lib/goalSummaries";

export const FullReportButton = ({ student, ensureOverview }) => {
  const { skillsByStudent, iepGoalsByStudent, logs, can } = useClassroom();
  const { user } = useAuth();
  const [includeReflections, setIncludeReflections] = React.useState(false);

  const handleExport = async () => {
    await ensureOverview();
    const hasPlan = !!(student.iep || student.plan504);
    const goals = hasPlan ? iepGoalsByStudent[student.id] || [] : [];
    const skills = skillsByStudent[student.id] || [];
    const items = [
      ...goals.map((g) => ({
        sectionLabel: `${g.planType || "IEP"} Goal · ${g.domain || "General"}`,
        goalName: g.description,
        summaryLines: iepSummaryLines(g),
        history: g.history,
        chartEl: chartElFor(`iep-goal-${g.id}`),
        overview: overviewRow(g, "iep", deriveIepStatus(g)),
      })),
      ...skills.map((sk) => ({
        sectionLabel: "Active Skill Goal",
        goalName: sk.name,
        summaryLines: skillSummaryLines(sk),
        history: sk.history,
        chartEl: chartElFor(`skill-${sk.id}`),
        overview: overviewRow(sk, "skill", sk.status),
      })),
    ];
    const periodNames = (user?.periods || [])
      .filter((p) => (student.periodIds || []).includes(p.id))
      .map((p) => p.name);
    const planLabel = [student.iep && "IEP", student.plan504 && "504"].filter(Boolean).join(" + ") || "None";
    const filename = pdfFilename(student.name, "Full_Report");
    await generateStudentReportPDF({
      student,
      periodNames,
      planLabel,
      items,
      logs: logs.filter((l) => l.studentId === student.id),
      filename,
      includeReflections: includeReflections && can("view_private_notes"),
    });
    return filename;
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <PdfReportButton
        testid={`full-report-btn-${student.id}`}
        onExport={handleExport}
        label="Full Report"
        shortLabel="Report"
      />
      {can("view_private_notes") && (
        <label className="flex items-center gap-1 text-[10px] text-slate-500 font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={includeReflections}
            onChange={(e) => setIncludeReflections(e.target.checked)}
            data-testid={`full-report-include-reflections-${student.id}`}
            className="accent-teal-600"
          />
          Include reflection notes
        </label>
      )}
    </div>
  );
};
