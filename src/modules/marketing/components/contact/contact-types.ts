export type ContactReason = "sales" | "support" | "partnership" | "enterprise" | "media";

export type ContactFormPayload = {
  name: string;
  company: string;
  email: string;
  phone: string;
  country: string;
  industry: string;
  message: string;
  reason: ContactReason;
};

export type ContactSubmitResult = {
  success: boolean;
  referenceId?: string;
  message?: string;
};

export type ContactFormAdapter = {
  submit: (payload: ContactFormPayload) => Promise<ContactSubmitResult>;
};

/** Default UI-only adapter — replace when connecting CRM, HubSpot, or Busal API. */
export const LOCAL_CONTACT_ADAPTER: ContactFormAdapter = {
  async submit(_payload) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      success: true,
      referenceId: `contact-${Date.now()}`,
      message: "Message received. Our team will respond shortly.",
    };
  },
};
