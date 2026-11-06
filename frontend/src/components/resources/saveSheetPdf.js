import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export const saveSheetAsPdf = async (elementId, title) => {
  const el = document.getElementById(elementId);
  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: "#ffffff",
    logging: false,
    windowWidth: 1024,
    onclone: (doc) => {
      const c = doc.getElementById(elementId);
      c.style.width = "816px";
      c.style.maxWidth = "816px";
      c.style.padding = "48px";
      c.style.boxShadow = "none";
    },
  });
  const pdf = new jsPDF({ unit: "in", format: "letter" });
  const margin = 0.5;
  const maxW = 8.5 - margin * 2;
  const maxH = 11 - margin * 2;
  const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
  const w = canvas.width * ratio;
  const h = canvas.height * ratio;
  pdf.addImage(canvas.toDataURL("image/jpeg", 0.85), "JPEG", (8.5 - w) / 2, margin, w, h);
  pdf.save(`${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`);
};
