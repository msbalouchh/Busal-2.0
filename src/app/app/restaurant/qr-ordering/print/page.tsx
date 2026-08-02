import type { Metadata } from "next";

import { QrPrintableSheet } from "@/modules/qr-ordering-management/components/qr-printable-sheet";
import { getQrPrintSheetContext } from "@/modules/qr-ordering-management/lib/get-qr-ordering-context";

interface QrPrintPageProps {
  searchParams: Promise<{ branchId?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Print QR Codes" };
}

export default async function QrPrintPage({ searchParams }: QrPrintPageProps) {
  const params = await searchParams;
  const context = await getQrPrintSheetContext(params.branchId ?? "");
  const branch = context.branches.find((entry) => entry.id === context.selectedBranchId);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <QrPrintableSheet
        branchId={context.selectedBranchId!}
        businessName={context.business.businessName ?? "Restaurant"}
        branchName={branch?.name ?? "Branch"}
        qrCodes={context.qrCodes}
      />
    </div>
  );
}
