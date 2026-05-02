// src/utils/extractTextFromPDF.ts
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.min.mjs"; // Import worker

export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  // Cấu hình worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  try {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let textContent = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const text = await page.getTextContent();
      textContent += text.items.map((item: any) => item.str).join(" ");
    }
    return textContent;
  } catch (error) {
    console.error("Lỗi khi đọc PDF:", error);
    return "";
  }
}
