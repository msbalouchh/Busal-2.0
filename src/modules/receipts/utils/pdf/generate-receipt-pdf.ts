import "server-only";

import PDFDocument from "pdfkit";

import type {
  ReceiptPaperSizeOption,
  ReceiptTemplateTypeOption,
} from "@/modules/receipts/constants/routes";
import { getPaperSizeConfig } from "@/modules/receipts/utils/pdf/paper-sizes";
import type { ReceiptTemplateData } from "@/modules/receipts/utils/templates/template-renderer";

interface GenerateReceiptPdfOptions {
  templateType: ReceiptTemplateTypeOption;
  paperSize: ReceiptPaperSizeOption;
}

function getFontSize(base: number, size?: "small" | "normal" | "large"): number {
  switch (size) {
    case "small":
      return base - 1;
    case "large":
      return base + 2;
    default:
      return base;
  }
}

export async function generateReceiptPdf(
  templateData: ReceiptTemplateData,
  options: GenerateReceiptPdfOptions,
): Promise<Buffer> {
  const paper = getPaperSizeConfig(options.paperSize);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: options.paperSize === "A4" ? "A4" : [paper.width, paper.height],
      margins: {
        top: paper.margin,
        bottom: paper.margin,
        left: paper.margin,
        right: paper.margin,
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc
      .fontSize(getFontSize(paper.fontSize, "large"))
      .font("Helvetica-Bold")
      .text(templateData.header);
    doc.moveDown(0.5);

    for (const line of templateData.lines) {
      if (!line.text) {
        doc.moveDown(0.3);
        continue;
      }

      const fontSize = getFontSize(paper.fontSize, line.size);
      doc
        .fontSize(fontSize)
        .font(line.bold ? "Helvetica-Bold" : "Helvetica")
        .text(line.text, {
          lineGap: paper.lineGap,
        });
    }

    doc.end();
  });
}
