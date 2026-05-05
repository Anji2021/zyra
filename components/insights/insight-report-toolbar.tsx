"use client";

import { jsPDF } from "jspdf";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { InsightSummaryDocument } from "@/lib/insight-summary/types";

const PDF_FILE = "zyra-health-insights.pdf";
const MARGIN_X = 18;
const MARGIN_TOP = 20;
const MARGIN_BOTTOM = 16;
const MAX_CONTEXT_CHARS = 3800;

type PdfWriter = {
  doc: jsPDF;
  y: number;
  maxW: number;
  pageH: number;
};

function pageWidth(doc: jsPDF): number {
  return doc.internal.pageSize.getWidth();
}

function pageHeight(doc: jsPDF): number {
  return doc.internal.pageSize.getHeight();
}

function ensureSpace(w: PdfWriter, needMm: number): void {
  if (w.y + needMm > w.pageH - MARGIN_BOTTOM) {
    w.doc.addPage();
    w.y = MARGIN_TOP;
  }
}

function writeLines(
  w: PdfWriter,
  lines: string[],
  opts: { fontSize: number; bold?: boolean; gray?: boolean; lineMm: number },
): void {
  const { doc } = w;
  doc.setFont("helvetica", opts.bold ? "bold" : "normal");
  doc.setFontSize(opts.fontSize);
  if (opts.gray) {
    doc.setTextColor(88, 88, 88);
  } else {
    doc.setTextColor(0, 0, 0);
  }
  for (const line of lines) {
    ensureSpace(w, opts.lineMm);
    doc.text(line, MARGIN_X, w.y);
    w.y += opts.lineMm;
  }
}

function writeWrapped(
  w: PdfWriter,
  text: string,
  opts: { fontSize: number; bold?: boolean; gray?: boolean; lineMm: number },
): void {
  const lines = w.doc.splitTextToSize(text.trim(), w.maxW);
  writeLines(w, lines, opts);
}

function writeParagraphGap(w: PdfWriter, mm: number): void {
  w.y += mm;
}

function buildTextPdf(report: InsightSummaryDocument): void {
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const w: PdfWriter = {
    doc,
    y: MARGIN_TOP,
    maxW: pageWidth(doc) - MARGIN_X * 2,
    pageH: pageHeight(doc),
  };

  const dateStr = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  writeLines(w, ["Zyra Health Insights Summary"], {
    fontSize: 16,
    bold: true,
    lineMm: 7,
  });
  writeParagraphGap(w, 2);
  writeWrapped(w, `Date: ${dateStr}`, {
    fontSize: 10,
    gray: true,
    lineMm: 5,
  });
  writeParagraphGap(w, 6);

  writeLines(w, ["Possible patterns"], { fontSize: 12, bold: true, lineMm: 6.5 });
  writeParagraphGap(w, 2);
  for (const card of report.patternCards) {
    writeWrapped(w, card.title.toUpperCase(), {
      fontSize: 9,
      bold: true,
      gray: true,
      lineMm: 4.5,
    });
    writeWrapped(w, card.highlight, { fontSize: 10, bold: true, lineMm: 5 });
    for (const b of card.bullets) {
      writeWrapped(w, `• ${b}`, { fontSize: 10, lineMm: 4.8 });
    }
    writeParagraphGap(w, 4);
  }

  writeLines(w, ["Summary"], { fontSize: 12, bold: true, lineMm: 6.5 });
  writeParagraphGap(w, 2);
  for (const bullet of report.summaryBullets) {
    writeWrapped(w, `• ${bullet}`, { fontSize: 10, lineMm: 4.8 });
  }

  if (report.unusualPatterns.length > 0) {
    writeParagraphGap(w, 5);
    writeLines(w, ["Worth reviewing"], { fontSize: 11, bold: true, lineMm: 6 });
    writeParagraphGap(w, 2);
    for (const p of report.unusualPatterns) {
      writeWrapped(w, `• ${p}`, { fontSize: 10, lineMm: 4.8 });
    }
  }

  writeParagraphGap(w, 6);
  writeLines(w, ["Possible specialist"], { fontSize: 11, bold: true, lineMm: 6 });
  writeParagraphGap(w, 2);
  const specialist =
    report.possibleSpecialist?.trim() ||
    "Not specified from recent DoctorMatch — primary care or women’s health may be a starting point to discuss.";
  writeWrapped(w, specialist, { fontSize: 10, lineMm: 4.8 });

  writeParagraphGap(w, 6);
  writeLines(w, ["Questions to ask"], { fontSize: 11, bold: true, lineMm: 6 });
  writeParagraphGap(w, 2);
  report.questionsToAsk.forEach((q, i) => {
    writeWrapped(w, `${i + 1}. ${q}`, { fontSize: 10, lineMm: 4.8 });
  });

  writeParagraphGap(w, 6);
  writeLines(w, ["What to bring"], { fontSize: 11, bold: true, lineMm: 6 });
  writeParagraphGap(w, 2);
  for (const c of report.doctorVisitChecklist) {
    writeWrapped(w, `• ${c}`, { fontSize: 10, lineMm: 4.8 });
  }

  const rawContext = report.carePrepScript.trim();
  if (rawContext.length > 0) {
    writeParagraphGap(w, 6);
    writeLines(w, ["Context from logs"], { fontSize: 11, bold: true, lineMm: 6 });
    writeParagraphGap(w, 2);
    let ctx = rawContext;
    if (ctx.length > MAX_CONTEXT_CHARS) {
      ctx =
        ctx.slice(0, MAX_CONTEXT_CHARS - 80).trimEnd() +
        "\n\n[Context truncated for PDF length.]";
    }
    writeWrapped(w, ctx, { fontSize: 10, gray: true, lineMm: 4.8 });
  }

  writeParagraphGap(w, 8);
  writeLines(w, ["Disclaimer"], { fontSize: 11, bold: true, lineMm: 6 });
  writeParagraphGap(w, 2);
  writeWrapped(w, report.disclaimer, { fontSize: 9, gray: true, lineMm: 4.5 });

  doc.save(PDF_FILE);
}

type InsightReportToolbarProps = {
  report: InsightSummaryDocument;
};

export function InsightReportToolbar({ report }: InsightReportToolbarProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<"pdf" | "update" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const handleDownloadPDF = useCallback(() => {
    setErr(null);
    setBusy("pdf");
    try {
      buildTextPdf(report);
    } catch (e) {
      console.error("[InsightReportToolbar] PDF export failed:", e);
      setErr("Could not generate PDF. Please try again.");
    } finally {
      setBusy(null);
    }
  }, [report]);

  const onUpdateInsights = useCallback(() => {
    setBusy("update");
    router.refresh();
    setTimeout(() => setBusy(null), 600);
  }, [router]);

  return (
    <div className="border-t border-border/40 pt-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleDownloadPDF}
          disabled={busy === "pdf"}
          className="no-print inline-flex min-h-[2.25rem] items-center justify-center rounded-full border border-accent/45 bg-background px-4 py-2 text-xs font-semibold text-accent transition hover:bg-soft-rose/40 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
        >
          {busy === "pdf" ? "Preparing PDF…" : "Download PDF"}
        </button>
        <button
          type="button"
          onClick={onUpdateInsights}
          disabled={busy === "update" || busy === "pdf"}
          className="no-print inline-flex min-h-[2.25rem] items-center justify-center rounded-full border border-accent/45 bg-background px-4 py-2 text-xs font-semibold text-accent transition hover:bg-soft-rose/40 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
        >
          {busy === "update" ? "Updating…" : "Update insights"}
        </button>
      </div>
      <p className="mt-2 text-[10px] leading-snug text-muted/90">
        Uses your latest logs to refresh patterns.
      </p>
      <p className="mt-1 text-[10px] leading-snug text-muted/90">
        Downloads a plain-text PDF summary (readable, not a screenshot).
      </p>
      {err ? <p className="mt-2 text-[11px] text-red-700 dark:text-red-400">{err}</p> : null}
    </div>
  );
}
