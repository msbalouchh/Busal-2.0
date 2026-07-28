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
import { printReceipt } from "@/services/receipt.service";

function parseTemplateType(value: string | null): ReceiptTemplateTypeOption {
  if (value && RECEIPT_TEMPLATE_TYPES.includes(value as ReceiptTemplateTypeOption)) {
    return value as ReceiptTemplateTypeOption;
  }

  return "CUSTOMER";
}

function parsePaperSize(value: string | null): ReceiptPaperSizeOption {
  if (value && RECEIPT_PAPER_SIZES.includes(value as ReceiptPaperSizeOption)) {
    return value as ReceiptPaperSizeOption;
  }

  return "A4";
}

export async function GET(request: Request, context: { params: Promise<{ receiptId: string }> }) {
  try {
    const platform = await protectedRoute({ permission: PERMISSION_CODES.RECEIPT_PRINT });
    const { receiptId } = await context.params;
    const { searchParams } = new URL(request.url);
    const templateType = parseTemplateType(searchParams.get("template"));
    const paperSize = parsePaperSize(searchParams.get("paper"));

    const result = await printReceipt(receiptId, platform.business.id, {
      templateType,
      paperSize,
      staffId: platform.staffSession?.staffId ?? null,
      isReprint: false,
    });

    return new NextResponse(new Uint8Array(result.pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${result.receipt.receiptNumber}.pdf"`,
      },
    });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}
