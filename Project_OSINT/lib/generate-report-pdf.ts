import { jsPDF } from "jspdf";
import type { IntelligenceReport } from "@/lib/api";

const PAGE_MARGIN = 56;
const LINE_HEIGHT = 16;

function newDoc() {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  return doc;
}

function pageBottom(doc: jsPDF) {
  return doc.internal.pageSize.getHeight() - PAGE_MARGIN;
}

function pageWidth(doc: jsPDF) {
  return doc.internal.pageSize.getWidth() - PAGE_MARGIN * 2;
}

/** Writes a block of body text, wrapping and paging as needed. Returns the new cursor y. */
function writeParagraph(doc: jsPDF, text: string, y: number): number {
  const lines = doc.splitTextToSize(text, pageWidth(doc));
  for (const line of lines) {
    if (y > pageBottom(doc)) {
      doc.addPage();
      y = PAGE_MARGIN;
    }
    doc.text(line, PAGE_MARGIN, y);
    y += LINE_HEIGHT;
  }
  return y;
}

function writeSectionHeading(doc: jsPDF, title: string, y: number): number {
  if (y > pageBottom(doc) - LINE_HEIGHT) {
    doc.addPage();
    y = PAGE_MARGIN;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(20, 30, 45);
  doc.text(title, PAGE_MARGIN, y);
  y += 6;
  doc.setDrawColor(0, 170, 200);
  doc.setLineWidth(1.2);
  doc.line(PAGE_MARGIN, y, PAGE_MARGIN + pageWidth(doc), y);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(40, 40, 40);
  return y;
}

/**
 * Builds a PDF from the DETAILED analyst report only (not the sarcastic summary engine)
 * and triggers a browser download. All generation happens client-side — no backend call.
 */
export function downloadDetailedReportPdf(params: {
  target: string | null;
  report: IntelligenceReport | undefined;
  sourcesCount?: number;
}) {
  const { target, report, sourcesCount } = params;
  const detailed = report?.detailed_corporate_report || report;

  const doc = newDoc();
  let y = PAGE_MARGIN;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(10, 20, 35);
  doc.text("OSINT Threat Intelligence Report", PAGE_MARGIN, y);
  y += 26;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(90, 90, 90);
  doc.text(`Target: ${target || "Unknown"}`, PAGE_MARGIN, y);
  y += 14;
  doc.text(`Generated: ${new Date().toLocaleString()}`, PAGE_MARGIN, y);
  y += 14;
  if (typeof sourcesCount === "number") {
    doc.text(`Sources analyzed: ${sourcesCount}`, PAGE_MARGIN, y);
    y += 14;
  }
  y += 8;

  // Risk summary strip
  const riskLevel = detailed?.risk_level || report?.risk_level || "UNKNOWN";
  const threatCount = detailed?.total_threat_count ?? report?.total_threat_count ?? 0;
  doc.setDrawColor(0, 170, 200);
  doc.setFillColor(235, 250, 252);
  doc.roundedRect(PAGE_MARGIN, y, pageWidth(doc), 36, 4, 4, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(10, 80, 100);
  doc.text(`Risk Level: ${riskLevel}`, PAGE_MARGIN + 12, y + 23);
  doc.text(`Total Threats Identified: ${threatCount}`, PAGE_MARGIN + 220, y + 23);
  y += 56;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);

  // Sections from the detailed analyst report
  y = writeSectionHeading(doc, "Executive Summary", y);
  y = writeParagraph(doc, detailed?.executive_summary || "No executive summary was returned for this scan.", y);
  y += 16;

  y = writeSectionHeading(doc, "Threat Actor Exploitation", y);
  y = writeParagraph(doc, detailed?.threat_actor_exploitation || "No threat actor exploitation data was returned for this scan.", y);
  y += 16;

  y = writeSectionHeading(doc, "Actionable Remediation", y);
  y = writeParagraph(doc, detailed?.actionable_remediation || "No remediation recommendations were returned for this scan.", y);

  // Footer page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8.5);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount} — Confidential OSINT Intelligence Report`,
      PAGE_MARGIN,
      doc.internal.pageSize.getHeight() - 24
    );
  }

  const safeTarget = (target || "report").replace(/[^a-z0-9.-]/gi, "_");
  doc.save(`osint-detailed-report-${safeTarget}.pdf`);
}