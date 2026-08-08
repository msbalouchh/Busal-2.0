import "server-only";

import type { PlatformChannelType } from "@prisma/client";

import type {
  BaseCommunicationProvider,
  CommunicationSendResult,
} from "@/services/communications/interfaces/base-communication-provider.interface";
import { providerNotConfigured } from "@/services/communications/interfaces/base-communication-provider.interface";
import type { EmailProvider } from "@/services/communications/interfaces/email-provider.interface";
import type { PushProvider } from "@/services/communications/interfaces/push-provider.interface";
import type { SmsProvider } from "@/services/communications/interfaces/sms-provider.interface";
import type { WhatsAppProvider } from "@/services/communications/interfaces/whatsapp-provider.interface";

function successResult(providerReference: string, message: string): CommunicationSendResult {
  return {
    success: true,
    simulated: false,
    providerReference,
    message,
  };
}

function failureResult(message: string): CommunicationSendResult {
  return {
    success: false,
    simulated: false,
    providerReference: "",
    message,
  };
}

export class ResendEmailProvider implements EmailProvider {
  readonly providerId = "resend";
  readonly channelType = "EMAIL" as const;

  isAvailable(): boolean {
    return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
  }

  async sendMessage(input: {
    recipient: string;
    subject?: string;
    content: string;
  }): Promise<CommunicationSendResult> {
    return this.sendEmail({
      to: input.recipient,
      subject: input.subject ?? "Busal notification",
      html: input.content,
      text: input.content,
    });
  }

  async sendEmail(input: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<CommunicationSendResult> {
    if (!this.isAvailable()) {
      return providerNotConfigured(this.providerId);
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    if (!response.ok) {
      return failureResult(await response.text());
    }

    const payload = (await response.json()) as { id?: string };
    return successResult(payload.id ?? "", "Email sent");
  }
}

export class TwilioSmsProvider implements SmsProvider {
  readonly providerId = "twilio";
  readonly channelType = "SMS" as const;

  isAvailable(): boolean {
    return Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_FROM_NUMBER,
    );
  }

  async sendMessage(input: {
    recipient: string;
    content: string;
  }): Promise<CommunicationSendResult> {
    return this.sendSms({ to: input.recipient, body: input.content });
  }

  async sendSms(input: { to: string; body: string }): Promise<CommunicationSendResult> {
    if (!this.isAvailable()) {
      return providerNotConfigured(this.providerId);
    }

    const credentials = Buffer.from(
      `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`,
    ).toString("base64");

    const body = new URLSearchParams({
      To: input.to,
      From: process.env.TWILIO_FROM_NUMBER!,
      Body: input.body,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      },
    );

    if (!response.ok) {
      return failureResult(await response.text());
    }

    const payload = (await response.json()) as { sid?: string };
    return successResult(payload.sid ?? "", "SMS sent");
  }
}

export class TwilioWhatsAppProvider implements WhatsAppProvider {
  readonly providerId = "twilio-whatsapp";
  readonly channelType = "WHATSAPP" as const;

  isAvailable(): boolean {
    return Boolean(process.env.TWILIO_WHATSAPP_FROM);
  }

  async sendMessage(input: {
    recipient: string;
    content: string;
  }): Promise<CommunicationSendResult> {
    return this.sendWhatsApp({ to: input.recipient, body: input.content });
  }

  async sendWhatsApp(input: { to: string; body: string }): Promise<CommunicationSendResult> {
    if (!this.isAvailable()) {
      return providerNotConfigured(this.providerId);
    }

    const sms = new TwilioSmsProvider();
    return sms.sendSms({
      to: `whatsapp:${input.to.replace(/^whatsapp:/, "")}`,
      body: input.body,
    });
  }
}

export class FcmPushProvider implements PushProvider {
  readonly providerId = "firebase-fcm";
  readonly channelType = "PUSH" as const;

  isAvailable(): boolean {
    return Boolean(process.env.FCM_SERVER_KEY);
  }

  async sendMessage(input: {
    recipient: string;
    subject?: string;
    content: string;
  }): Promise<CommunicationSendResult> {
    return this.sendPush({
      token: input.recipient,
      title: input.subject ?? "Busal",
      body: input.content,
    });
  }

  async sendPush(input: {
    token: string;
    title: string;
    body: string;
    data?: Record<string, string>;
  }): Promise<CommunicationSendResult> {
    if (!this.isAvailable()) {
      return providerNotConfigured(this.providerId);
    }

    const response = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        Authorization: `key=${process.env.FCM_SERVER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: input.token,
        notification: { title: input.title, body: input.body },
        data: input.data,
      }),
    });

    if (!response.ok) {
      return failureResult(await response.text());
    }

    const payload = (await response.json()) as { message_id?: string; multicast_id?: number };
    return successResult(
      payload.message_id ?? String(payload.multicast_id ?? ""),
      "Push notification sent",
    );
  }
}

export function createProductionCommunicationProviders(): BaseCommunicationProvider[] {
  return [
    new ResendEmailProvider(),
    new TwilioSmsProvider(),
    new TwilioWhatsAppProvider(),
    new FcmPushProvider(),
  ];
}
