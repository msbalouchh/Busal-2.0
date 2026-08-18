import "server-only";

import {
  decryptDeveloperSecret,
  encryptDeveloperSecret,
} from "@/services/developer-platform-context.service";
import type { ChannelConnectionCredentials } from "@/modules/customer-ai/omnichannel/types/omnichannel.types";

export function encryptChannelCredentials(credentials: ChannelConnectionCredentials): string {
  return encryptDeveloperSecret(JSON.stringify(credentials));
}

export function decryptChannelCredentials(encrypted: string): ChannelConnectionCredentials {
  if (!encrypted.trim()) {
    return { provider: "MANUAL" };
  }
  const parsed = JSON.parse(decryptDeveloperSecret(encrypted)) as ChannelConnectionCredentials;
  return parsed;
}

export function maskCredentialValue(value: string | undefined): string {
  if (!value) return "—";
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}
