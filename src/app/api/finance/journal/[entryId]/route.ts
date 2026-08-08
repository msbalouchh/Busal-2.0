import {
  handleDeleteJournalEntry,
  handleRestoreJournalEntry,
  handleUpdateJournalEntry,
} from "@/modules/finance/api/finance-route-handlers";

export async function PATCH(request: Request, context: { params: Promise<{ entryId: string }> }) {
  const { entryId } = await context.params;
  const body = await request.json();
  return handleUpdateJournalEntry(
    new Request(request.url, {
      method: "PATCH",
      headers: request.headers,
      body: JSON.stringify({ ...(body as object), journalEntryId: entryId }),
    }),
  );
}

export async function DELETE(_request: Request, context: { params: Promise<{ entryId: string }> }) {
  const { entryId } = await context.params;
  return handleDeleteJournalEntry(_request, entryId);
}

export async function PUT(_request: Request, context: { params: Promise<{ entryId: string }> }) {
  const { entryId } = await context.params;
  return handleRestoreJournalEntry(_request, entryId);
}
