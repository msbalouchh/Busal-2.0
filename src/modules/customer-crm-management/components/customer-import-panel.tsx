"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { importCustomersAction } from "@/modules/customer-crm-management/actions/customer-crm-actions";
import {
  CUSTOMER_CRM_EXPORT_HEADERS,
  CUSTOMER_CRM_ROUTES,
} from "@/modules/customer-crm-management/constants/routes";
import type { CustomerImportRow } from "@/modules/customer-crm-management/types/customer-crm-types";

interface CustomerImportPanelProps {
  canExport: boolean;
}

function parseCsv(text: string): CustomerImportRow[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);

  if (lines.length <= 1) return [];

  const headerLine = lines[0];
  if (!headerLine) return [];

  const headers = headerLine.split(",").map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((value) => value.trim());
    const row: CustomerImportRow = {};

    headers.forEach((header, index) => {
      const value = values[index];
      if (!value) return;

      if (header === "firstName") row.firstName = value;
      if (header === "lastName") row.lastName = value;
      if (header === "email") row.email = value;
      if (header === "phone") row.phone = value;
      if (header === "tags") row.tags = value;
      if (header === "notes") row.notes = value;
      if (header === "marketingConsent") row.marketingConsent = value;
    });

    return row;
  });
}

export function CustomerImportPanel({ canExport }: CustomerImportPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [csvText, setCsvText] = useState("");

  const handleImport = () => {
    const rows = parseCsv(csvText);
    if (rows.length === 0) {
      toast.error("Paste CSV data with a header row");
      return;
    }

    startTransition(async () => {
      try {
        const result = await importCustomersAction(rows);
        toast.success(`Imported ${result.imported} customers (${result.skipped} skipped)`);
        router.push(CUSTOMER_CRM_ROUTES.dashboard());
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Import failed");
      }
    });
  };

  const template = `${CUSTOMER_CRM_EXPORT_HEADERS.join(",")}\nJane,Doe,jane@example.com,07700900000,VIP,Regular guest,yes`;

  return (
    <div className="space-y-6">
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle>Import customers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Paste CSV content with headers: {CUSTOMER_CRM_EXPORT_HEADERS.join(", ")}. Duplicate
            email or phone rows are skipped automatically.
          </p>
          <textarea
            value={csvText}
            onChange={(event) => setCsvText(event.target.value)}
            rows={12}
            placeholder={template}
            className="border-input bg-background min-h-48 w-full rounded-md border px-3 py-2 font-mono text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleImport} disabled={isPending}>
              Import customers
            </Button>
            <Button asChild variant="outline">
              <Link href={CUSTOMER_CRM_ROUTES.dashboard()}>Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {canExport ? (
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle>Export customers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm">
              Download all customers as CSV from the customers dashboard export action.
            </p>
            <Button asChild variant="outline">
              <a href="/api/restaurant/customers/export" download>
                Download CSV
              </a>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
