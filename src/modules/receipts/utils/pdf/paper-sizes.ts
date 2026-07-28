import type { ReceiptPaperSizeOption } from "@/modules/receipts/constants/routes";

export interface PaperSizeConfig {
  width: number;
  height: number;
  margin: number;
  fontSize: number;
  lineGap: number;
}

const MM_TO_POINT = 2.834645669;

export function getPaperSizeConfig(paperSize: ReceiptPaperSizeOption): PaperSizeConfig {
  switch (paperSize) {
    case "THERMAL_80MM":
      return {
        width: Math.round(80 * MM_TO_POINT),
        height: 800,
        margin: 12,
        fontSize: 9,
        lineGap: 4,
      };
    case "THERMAL_58MM":
      return {
        width: Math.round(58 * MM_TO_POINT),
        height: 800,
        margin: 10,
        fontSize: 8,
        lineGap: 3,
      };
    case "A4":
    default:
      return {
        width: 595.28,
        height: 841.89,
        margin: 40,
        fontSize: 11,
        lineGap: 6,
      };
  }
}
