import "server-only";

import { prisma } from "@/lib/prisma";
import { branchFilter } from "@/modules/business-context/utils/branch-scope";
import { moneyDecimalToPence } from "@/modules/payments/utils/currency";
import { listBranches, type BranchData } from "@/services/business-management.service";

export interface BranchSummary {
  id: string;
  name: string;
  isMain: boolean;
  staffCount: number;
  todayOrders: number;
  todayRevenuePence: number;
}

export interface CentralBranchDashboard {
  totalBranches: number;
  totalStaff: number;
  todayOrders: number;
  todayRevenuePence: number;
  branches: BranchSummary[];
}

export interface BranchDashboard {
  branch: BranchData;
  staffCount: number;
  activeTables: number;
  todayOrders: number;
  todayRevenuePence: number;
  pendingKitchenOrders: number;
}

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export async function getCentralBranchDashboard(
  businessId: string,
): Promise<CentralBranchDashboard> {
  const branches = await listBranches(businessId);
  const todayStart = startOfDay(new Date());

  const summaries = await Promise.all(
    branches.map(async (branch) => {
      const [staffCount, todayOrders, payments] = await Promise.all([
        prisma.staff.count({
          where: { businessId, branchId: branch.id, isActive: true },
        }),
        prisma.order.count({
          where: {
            businessId,
            ...branchFilter(branch.id),
            status: "COMPLETED",
            createdAt: { gte: todayStart },
          },
        }),
        prisma.payment.findMany({
          where: {
            businessId,
            ...branchFilter(branch.id),
            status: "COMPLETED",
            createdAt: { gte: todayStart },
          },
          select: { amount: true },
        }),
      ]);

      return {
        id: branch.id,
        name: branch.name,
        isMain: branch.isMain,
        staffCount,
        todayOrders,
        todayRevenuePence: payments.reduce((sum, payment) => sum + payment.amount, 0),
      };
    }),
  );

  return {
    totalBranches: branches.length,
    totalStaff: summaries.reduce((sum, branch) => sum + branch.staffCount, 0),
    todayOrders: summaries.reduce((sum, branch) => sum + branch.todayOrders, 0),
    todayRevenuePence: summaries.reduce((sum, branch) => sum + branch.todayRevenuePence, 0),
    branches: summaries,
  };
}

export async function getBranchDashboard(
  businessId: string,
  branchId: string,
): Promise<BranchDashboard> {
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, businessId },
  });

  if (!branch) {
    throw new Error("Branch not found");
  }

  const todayStart = startOfDay(new Date());
  const scope = branchFilter(branchId);

  const [staffCount, activeTables, todayOrders, payments, pendingKitchenOrders] = await Promise.all(
    [
      prisma.staff.count({ where: { businessId, branchId, isActive: true } }),
      prisma.table.count({ where: { businessId, ...scope, isActive: true, status: "OCCUPIED" } }),
      prisma.order.count({
        where: {
          businessId,
          ...scope,
          status: "COMPLETED",
          createdAt: { gte: todayStart },
        },
      }),
      prisma.payment.findMany({
        where: {
          businessId,
          ...scope,
          status: "COMPLETED",
          createdAt: { gte: todayStart },
        },
        select: { amount: true },
      }),
      prisma.kitchenQueue.count({
        where: {
          businessId,
          ...scope,
          status: { in: ["NEW", "ACKNOWLEDGED", "PREPARING"] },
        },
      }),
    ],
  );

  return {
    branch: {
      id: branch.id,
      businessId: branch.businessId,
      name: branch.name,
      address: branch.address,
      city: branch.city,
      country: branch.country,
      phone: branch.phone,
      isMain: branch.isMain,
      createdAt: branch.createdAt,
      updatedAt: branch.updatedAt,
    },
    staffCount,
    activeTables,
    todayOrders,
    todayRevenuePence: payments.reduce((sum, payment) => sum + payment.amount, 0),
    pendingKitchenOrders,
  };
}

export async function getBranchOrderRevenuePence(
  businessId: string,
  branchId: string,
): Promise<number> {
  const orders = await prisma.order.findMany({
    where: { businessId, ...branchFilter(branchId), status: "COMPLETED" },
    select: { total: true },
  });

  return orders.reduce((sum, order) => sum + moneyDecimalToPence(order.total), 0);
}
