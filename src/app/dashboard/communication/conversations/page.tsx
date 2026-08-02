import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { COMMUNICATION_ROUTES } from "@/modules/communication/constants/routes";

export const metadata: Metadata = {
  title: "Conversations",
};

export default function CommunicationConversationsRedirectPage() {
  redirect(COMMUNICATION_ROUTES.inbox);
}
