import "server-only";

import {
  getAiProvider,
  registerAiProvider,
} from "@/modules/ai-restaurant-assistant-management/engine/ai-provider-registry";
import { LocalRestaurantAiProvider } from "@/modules/ai-restaurant-assistant-management/engine/providers/local-restaurant-ai-provider";

let bootstrapped = false;

export function ensureAiRestaurantAssistantProviders(): void {
  if (bootstrapped) return;
  registerAiProvider(new LocalRestaurantAiProvider(), { isDefault: true });
  bootstrapped = true;
}

export function getRestaurantAssistantProvider() {
  ensureAiRestaurantAssistantProviders();
  return getAiProvider();
}
