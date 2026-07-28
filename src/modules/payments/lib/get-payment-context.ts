import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import {
  serializePaymentOrderContext,
  serializeUnpaidOrder,
} from "@/modules/payments/utils/payment-utils";
import { getPaymentOrderContext, listUnpaidOrders } from "@/services/payment.service";
import { prisma } from "@/lib/prisma";

export const getPaymentsModuleContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.PAYMENT_CREATE });
  const unpaidOrders = await listUnpaidOrders(context.business.id, context.branchId);

  return {
    context,
    unpaidOrders: unpaidOrders.map(serializeUnpaidOrder),
  };
});

export const getPaymentOrderPageContext = cache(async (orderId: string) => {
  const context = await protectedPage({ permission: PERMISSION_CODES.PAYMENT_CREATE });

  const { order, summary } = await getPaymentOrderContext(orderId, context.business.id);

  const table = order.tableId
    ? await prisma.table.findUnique({
        where: { id: order.tableId },
        select: { name: true },
      })
    : null;

  return {
    context,
    paymentContext: serializePaymentOrderContext({
      order,
      tableName: table?.name ?? null,
      summary,
    }),
  };
});
