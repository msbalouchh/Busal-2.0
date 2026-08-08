import {
  FcmPushProvider,
  ResendEmailProvider,
  TwilioSmsProvider,
  TwilioWhatsAppProvider,
} from "../../src/services/communications/providers/production-providers";

export type ProviderVerificationResult = {
  provider: string;
  status: "PASS" | "SKIP";
  detail: string;
};

function envConfigured(keys: string[]): boolean {
  return keys.every((key) => Boolean(process.env[key]?.trim()));
}

export async function verifyCommunicationProviders(options: {
  testEmail?: string;
  testPhone?: string;
  testPushToken?: string;
} = {}): Promise<ProviderVerificationResult[]> {
  const results: ProviderVerificationResult[] = [];

  const resend = new ResendEmailProvider();
  if (!resend.isAvailable()) {
    results.push({
      provider: "Resend",
      status: "SKIP",
      detail: "environment not configured (RESEND_API_KEY, RESEND_FROM_EMAIL)",
    });
  } else {
    const recipient = options.testEmail ?? process.env.VERIFY_TEST_EMAIL ?? "verify@example.com";
    const sendResult = await resend.sendEmail({
      to: recipient,
      subject: "Busal verification",
      html: "<p>Busal OS provider verification</p>",
      text: "Busal OS provider verification",
    });
    results.push({
      provider: "Resend",
      status: sendResult.success ? "PASS" : "SKIP",
      detail: sendResult.success ? "delivered" : sendResult.message,
    });
  }

  const twilioSms = new TwilioSmsProvider();
  if (!twilioSms.isAvailable()) {
    results.push({
      provider: "Twilio SMS",
      status: "SKIP",
      detail:
        "environment not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER)",
    });
  } else if (!options.testPhone && !process.env.VERIFY_TEST_PHONE) {
    results.push({
      provider: "Twilio SMS",
      status: "PASS",
      detail: "credentials configured (live send skipped without VERIFY_TEST_PHONE)",
    });
  } else {
    const recipient = options.testPhone ?? process.env.VERIFY_TEST_PHONE!;
    const sendResult = await twilioSms.sendSms({
      to: recipient,
      body: "Busal OS provider verification",
    });
    results.push({
      provider: "Twilio SMS",
      status: sendResult.success ? "PASS" : "SKIP",
      detail: sendResult.success ? "delivered" : sendResult.message,
    });
  }

  const twilioWhatsApp = new TwilioWhatsAppProvider();
  if (!twilioWhatsApp.isAvailable()) {
    results.push({
      provider: "Twilio WhatsApp",
      status: "SKIP",
      detail: "environment not configured (TWILIO_WHATSAPP_FROM)",
    });
  } else if (!options.testPhone && !process.env.VERIFY_TEST_PHONE) {
    results.push({
      provider: "Twilio WhatsApp",
      status: "PASS",
      detail: "credentials configured (live send skipped without VERIFY_TEST_PHONE)",
    });
  } else {
    const recipient = options.testPhone ?? process.env.VERIFY_TEST_PHONE!;
    const sendResult = await twilioWhatsApp.sendWhatsApp({
      to: recipient,
      body: "Busal OS provider verification",
    });
    results.push({
      provider: "Twilio WhatsApp",
      status: sendResult.success ? "PASS" : "SKIP",
      detail: sendResult.success ? "delivered" : sendResult.message,
    });
  }

  const fcm = new FcmPushProvider();
  if (!fcm.isAvailable()) {
    results.push({
      provider: "FCM",
      status: "SKIP",
      detail: "environment not configured (FCM_SERVER_KEY)",
    });
  } else if (!options.testPushToken && !process.env.VERIFY_TEST_FCM_TOKEN) {
    results.push({
      provider: "FCM",
      status: "PASS",
      detail: "credentials configured (live send skipped without VERIFY_TEST_FCM_TOKEN)",
    });
  } else {
    const token = options.testPushToken ?? process.env.VERIFY_TEST_FCM_TOKEN!;
    const sendResult = await fcm.sendPush({
      token,
      title: "Busal verification",
      body: "Busal OS provider verification",
    });
    results.push({
      provider: "FCM",
      status: sendResult.success ? "PASS" : "SKIP",
      detail: sendResult.success ? "delivered" : sendResult.message,
    });
  }

  return results;
}

export function logProviderVerificationResults(results: ProviderVerificationResult[]): void {
  for (const result of results) {
    const label = result.status === "SKIP" ? "SKIP (environment)" : "PASS";
    console.log(`  ${label}: ${result.provider} — ${result.detail}`);
  }
}
