import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { STAFF_MANAGEMENT_ROUTES } from "@/modules/staff/constants/staff-management";

export const metadata: Metadata = {
  title: "Staff Members",
};

export default function StaffMembersRedirectPage() {
  redirect(STAFF_MANAGEMENT_ROUTES.directory);
}
