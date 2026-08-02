import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { BUSINESS_PROFILE_ROUTES } from "@/modules/business/constants/business-profile";

export const metadata: Metadata = {
  title: "General Information",
};

export default function BusinessGeneralRedirectPage() {
  redirect(BUSINESS_PROFILE_ROUTES.profile);
}
