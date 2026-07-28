import { NextResponse } from "next/server";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import {
  handlePlatformRouteError,
  protectedRoute,
} from "@/modules/platform-guards/guards/route.guards";
import {
  RECEIPT_PAPER_SIZES,
  RECEIPT_TEMPLATE_TYPES,
  type ReceiptPaperSizeOption,
  type ReceiptTemplateTypeOption,
} from "@/modules/receipts/constants/routes";
import { reprintReceipt } from "@/services/receipt.service";

function parseTemplateType(value: unknown): ReceiptTemplateTypeOption {
  if (
    typeof value === "string" &&
    RECEIPT_TEMPLATE_TYPES.includes(value as ReceiptTemplateTypeOption)
  ) {
    return value as ReceiptTemplateTypeOption;
  }

  return "CUSTOMER";
}

function parsePaperSize(value: unknown): ReceiptPaperSizeOption {
  if (typeof value === "string" && RECEIPT_PAPER_SIZES.includes(value as ReceiptPaperSizeOption)) {
    return value as ReceiptPaperSizeOption;
  }

  return "A4";
}

export async function POST(request: Request, context: { params: Promise<{ receiptId: string }> }) {
  try {
    const platform = await protectedRoute({ permission: PERMISSION_CODES.RECEIPT_PRINT });
    const { receiptId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      templateType?: unknown;
      paperSize?: unknown;
    };

    const result = await reprintReceipt(receiptId, platform.business.id, {
      templateType: parseTemplateType(body.templateType),
      paperSize: parsePaperSize(body.paperSize),
      staffId: platform.staffSession?.staffId ?? null,
    });

    return NextResponse.json({
      success: true,
      receiptId: result.receipt.id,
      printCount: result.receipt.printCount,
      pdfBase64: result.pdf.toString("base64"),
    });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}
