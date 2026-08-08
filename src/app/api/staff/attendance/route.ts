import { handleClockInStaff, handleClockOutStaff } from "@/modules/staff/api/staff-route-handlers";

export async function POST(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("action") === "clock-out") {
    return handleClockOutStaff(request);
  }
  return handleClockInStaff(request);
}
