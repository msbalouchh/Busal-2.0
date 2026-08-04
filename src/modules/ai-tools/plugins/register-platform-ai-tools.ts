import { registerAnalyticsAiTools } from "@/modules/analytics/ai/analytics-ai-tools";
import { registerBillingAiTools } from "@/modules/billing/ai/billing-ai-tools";
import { registerCrmAiTools } from "@/modules/crm/ai/crm-ai-tools";
import { registerFinanceAiTools } from "@/modules/finance/ai/finance-ai-tools";
import { registerIntegrationAiTools } from "@/modules/integrations/ai/integration-ai-tools";
import { registerInventoryAiTools } from "@/modules/inventory/ai/inventory-ai-tools";
import { registerKitchenAiTools } from "@/modules/kitchen/ai/kitchen-ai-tools";
import { registerMenuAiTools } from "@/modules/menu/ai/menu-ai-tools";
import { registerNotificationAiTools } from "@/modules/notifications/ai/notification-ai-tools";
import { registerOrderAiTools } from "@/modules/orders/ai/order-ai-tools";
import { registerPosAiTools } from "@/modules/pos/ai/pos-ai-tools";
import { registerReservationAiTools } from "@/modules/reservations/ai/reservation-ai-tools";
import { registerStaffAiTools } from "@/modules/staff/ai/staff-ai-tools";
import { registerTableManagementAiTools } from "@/modules/table-management/ai/table-ai-tools";

let platformToolsRegistered = false;

/** Registers all module platform AI tools (idempotent, lazy — not at module load). */
export function registerAllPlatformAiTools(): void {
  if (platformToolsRegistered) {
    return;
  }

  registerAnalyticsAiTools();
  registerBillingAiTools();
  registerCrmAiTools();
  registerFinanceAiTools();
  registerIntegrationAiTools();
  registerInventoryAiTools();
  registerKitchenAiTools();
  registerMenuAiTools();
  registerNotificationAiTools();
  registerOrderAiTools();
  registerPosAiTools();
  registerReservationAiTools();
  registerStaffAiTools();
  registerTableManagementAiTools();

  platformToolsRegistered = true;
}
