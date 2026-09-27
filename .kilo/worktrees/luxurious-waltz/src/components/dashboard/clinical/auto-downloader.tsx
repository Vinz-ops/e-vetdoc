"use client";

import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export function AutoDownloader({ filename, targetId }: { filename: string, targetId: string }) {
  const [status, setStatus] = useState<"generating" | "ready" | "error">("generating");
  const isDownloading = useRef(false);

  useEffect(() => {
    if (isDownloading.current) return;
    isDownloading.current = true;

    const downloadPdf = async () => {
      try {
        // Wait a tiny bit for the font rendering if any
        await new Promise((r) => setTimeout(r, 500));
        
        const element = document.getElementById(targetId);
        if (!element) {
          throw new Error("Element not found");
        }

        const canvas = await html2canvas(element, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL("image/png");
        
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "px",
          format: "letter"
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(filename);
        
        setStatus("ready");

        setTimeout(() => {
          if (window.history.length > 1) window.history.back();
          else window.close();
        }, 1500);

      } catch (err) {
        console.error("PDF generation failed:", err);
        setStatus("error");
      }
    };

    downloadPdf();
  }, [filename, targetId]);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center print:hidden">
      <div className="bg-card p-6 rounded-xl shadow-lg border border-border text-center space-y-4 max-w-sm">
        {status === "generating" && (
          <>
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <h3 className="font-semibold text-lg">Generating PDF...</h3>
            <p className="text-sm text-muted-foreground">Please wait while your document is being prepared for download.</p>
          </>
        )}
        {status === "ready" && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg text-green-700">Downloaded Successfully</h3>
            <p className="text-sm text-muted-foreground">Returning to previous page...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg text-red-700">Generation Failed</h3>
            <button onClick={() => window.history.back()} className="text-sm text-primary underline">Go back</button>
          </>
        )}
      </div>
    </div>
  );
}
