export const FERPA_NOTICE =
  "CONFIDENTIAL: This document contains personally identifiable student education records protected under the Family Educational Rights and Privacy Act (FERPA, 20 U.S.C. § 1232g; 34 CFR Part 99). Do not redistribute or disclose without authorization.";

// Adds the FERPA notice to the footer of every page of a jsPDF document.
export const stampFerpa = (doc) => {
  const pages = doc.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(40, h - 44, w - 40, h - 44);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(doc.splitTextToSize(FERPA_NOTICE, w - 80), 40, h - 34);
    doc.text(`Page ${i} of ${pages}`, w - 40, h - 14, { align: "right" });
    doc.setTextColor(15, 23, 42);
  }
};
