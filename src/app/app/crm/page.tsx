import { redirect } from "next/navigation";

import { CUSTOMER_CRM_ROUTES } from "@/modules/customer-crm-management/constants/routes";

export default function ApplicationCrmPage() {
  redirect(CUSTOMER_CRM_ROUTES.dashboard());
}
