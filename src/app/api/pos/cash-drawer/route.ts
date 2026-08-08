import {
  handleCloseCashDrawer,
  handleListPosCashDrawers,
  handleOpenCashDrawer,
} from "@/modules/pos/api/pos-route-handlers";

export async function GET() {
  return handleListPosCashDrawers();
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  if (action === "close") {
    return handleCloseCashDrawer(request);
  }
  return handleOpenCashDrawer(request);
}
