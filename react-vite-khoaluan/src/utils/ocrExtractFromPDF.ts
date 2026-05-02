// src/utils/ocrExtractFromPDF.ts
import Tesseract from "tesseract.js";

export async function ocrExtractFromPDF(file: File): Promise<string> {
  try {
    const {
      data: { text },
    } = await Tesseract.recognize(file, "vie", {
      // logger: (m) => console.log(m), // Bật log nếu cần debug
    });
    return text;
  } catch (error) {
    console.error("Lỗi khi thực hiện OCR:", error);
    return "";
  }
}
