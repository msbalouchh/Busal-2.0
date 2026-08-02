/**
 * Demo booking types — structured for future provider integration.
 * Connect via DemoBookingAdapter (Calendly, Google Calendar, Outlook, HubSpot, Busal API).
 */

export type DemoBookingProvider =
  "local" | "calendly" | "google-calendar" | "outlook" | "hubspot" | "busal-api";

export type DemoBookingSchedule = {
  date: string;
  time: string;
  timezone: string;
};

export type DemoBookingBusinessInfo = {
  businessName: string;
  industry: string;
  country: string;
  locations: string;
  employees: string;
  currentSoftware: string;
  monthlyOrders: string;
  website: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  phone: string;
};

export type DemoBookingPayload = {
  schedule: DemoBookingSchedule;
  business: DemoBookingBusinessInfo;
  interests: string[];
};

export type DemoBookingResult = {
  success: boolean;
  confirmationId?: string;
  message?: string;
};

export type DemoBookingAdapter = {
  readonly provider: DemoBookingProvider;
  submit: (payload: DemoBookingPayload) => Promise<DemoBookingResult>;
};

/** Default UI-only adapter — replace with provider adapter when backend is ready. */
export const LOCAL_DEMO_BOOKING_ADAPTER: DemoBookingAdapter = {
  provider: "local",
  async submit(_payload) {
    await new Promise((resolve) => setTimeout(resolve, 900));
    return {
      success: true,
      confirmationId: `demo-${Date.now()}`,
      message: "Demo request received. A Busal specialist will confirm by email.",
    };
  },
};
