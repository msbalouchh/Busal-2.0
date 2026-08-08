export {
  buildOrderAiContext,
  buildOrderCatalogSummary,
  buildOrderTrackingSummary,
  detectDelays,
  detectHighValueCustomers,
  forecastDemand,
  generateUpsellRecommendations,
  predictOrderDelay,
  predictPreparationTime,
  searchOrdersForAi,
  suggestOrderOptimizations,
} from "@/modules/orders/services/order-ai.service";

export type { OmsPlatformContext } from "@/modules/orders/types/order";
