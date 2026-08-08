import "server-only";

import { NextResponse } from "next/server";

import {
  handlePlatformRouteError,
  protectedRoute,
} from "@/modules/platform-guards/guards/route.guards";
import { POS_MODULE_PERMISSIONS } from "@/modules/pos/constants/permissions";
import { resolvePosScope, toPosPlatformContext } from "@/modules/pos/lib/pos-scope";
import { posService } from "@/modules/pos/services/pos.service";
import { buildPosPlatformSnapshot } from "@/modules/pos/services/pos-platform.service";
import {
  applyPosDiscountSchema,
  cashDrawerActionSchema,
  closePosShiftSchema,
  createPosSaleSchema,
  mergePosBillsSchema,
  openPosShiftSchema,
  posSearchSchema,
  processPosPaymentSchema,
  processPosRefundSchema,
  splitPosBillSchema,
  transferPosTableSchema,
  voidPosOrderSchema,
} from "@/modules/pos/validation/pos-schemas";

function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export async function handleListPosTransactions(request: Request) {
  try {
    const platform = await protectedRoute({ permission: POS_MODULE_PERMISSIONS.POS_READ });
    const context = toPosPlatformContext(resolvePosScope(platform));
    const url = new URL(request.url);
    const parsed = posSearchSchema.parse(Object.fromEntries(url.searchParams.entries()));
    const [result, snapshot] = await Promise.all([
      posService.search(parsed, context),
      buildPosPlatformSnapshot(context),
    ]);
    return jsonSuccess({ ...result, snapshot });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handlePosSnapshot() {
  try {
    const platform = await protectedRoute({ permission: POS_MODULE_PERMISSIONS.POS_READ });
    const context = toPosPlatformContext(resolvePosScope(platform));
    const [snapshot, registers, terminals, shifts, employees, cashDrawers, activeSession] =
      await Promise.all([
        buildPosPlatformSnapshot(context),
        posService.listRegisters(context),
        posService.listTerminals(context),
        posService.listShifts(context),
        posService.listEmployees(context),
        posService.listCashDrawers(context),
        posService.getActiveSession(context),
      ]);

    return jsonSuccess({
      ...snapshot,
      registers,
      terminals,
      shifts,
      employees,
      cashDrawers,
      activeSession,
    });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreatePosSale(request: Request) {
  try {
    const platform = await protectedRoute({ permission: POS_MODULE_PERMISSIONS.POS_CREATE });
    const context = toPosPlatformContext(resolvePosScope(platform));
    const body = createPosSaleSchema.parse(await request.json());
    const record = await posService.createSale(context, body);
    return jsonSuccess(record, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleGetPosTransaction(_request: Request, orderId: string) {
  try {
    const platform = await protectedRoute({ permission: POS_MODULE_PERMISSIONS.POS_READ });
    const context = toPosPlatformContext(resolvePosScope(platform));
    const record = await posService.getById(context, orderId);
    if (!record) {
      return NextResponse.json({ success: false, error: "POS transaction not found" }, { status: 404 });
    }
    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleApplyPosDiscount(request: Request, orderId: string) {
  try {
    const platform = await protectedRoute({ permission: POS_MODULE_PERMISSIONS.POS_UPDATE });
    const context = toPosPlatformContext(resolvePosScope(platform));
    const body = applyPosDiscountSchema.parse({ ...(await request.json()), orderId });
    const record = await posService.applyDiscount(context, body);
    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleSplitPosBill(request: Request, orderId: string) {
  try {
    const platform = await protectedRoute({ permission: POS_MODULE_PERMISSIONS.POS_UPDATE });
    const context = toPosPlatformContext(resolvePosScope(platform));
    const body = splitPosBillSchema.parse({ ...(await request.json()), orderId });
    const record = await posService.splitBill(context, body);
    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleProcessPosPayment(request: Request, orderId: string) {
  try {
    const platform = await protectedRoute({ permission: POS_MODULE_PERMISSIONS.POS_UPDATE });
    const context = toPosPlatformContext(resolvePosScope(platform));
    const body = processPosPaymentSchema.parse({ ...(await request.json()), orderId });
    const record = await posService.processPayment(context, body);
    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleProcessPosRefund(request: Request, orderId: string) {
  try {
    const platform = await protectedRoute({ permission: POS_MODULE_PERMISSIONS.POS_REFUND });
    const context = toPosPlatformContext(resolvePosScope(platform));
    const body = processPosRefundSchema.parse({ ...(await request.json()), orderId });
    const record = await posService.processRefund(context, body);
    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleVoidPosOrder(request: Request, orderId: string) {
  try {
    const platform = await protectedRoute({ permission: POS_MODULE_PERMISSIONS.POS_UPDATE });
    const context = toPosPlatformContext(resolvePosScope(platform));
    const body = voidPosOrderSchema.parse({ ...(await request.json()), orderId });
    const record = await posService.voidOrder(context, body.orderId, body.reason);
    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleMergePosBills(request: Request) {
  try {
    const platform = await protectedRoute({ permission: POS_MODULE_PERMISSIONS.POS_UPDATE });
    const context = toPosPlatformContext(resolvePosScope(platform));
    const body = mergePosBillsSchema.parse(await request.json());
    const record = await posService.mergeBills(context, body);
    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleTransferPosTable(request: Request, orderId: string) {
  try {
    const platform = await protectedRoute({ permission: POS_MODULE_PERMISSIONS.POS_UPDATE });
    const context = toPosPlatformContext(resolvePosScope(platform));
    const body = transferPosTableSchema.parse({ ...(await request.json()), orderId });
    const record = await posService.transferTable(context, body);
    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleReprintPosReceipt(_request: Request, orderId: string) {
  try {
    const platform = await protectedRoute({ permission: POS_MODULE_PERMISSIONS.POS_READ });
    const context = toPosPlatformContext(resolvePosScope(platform));
    const record = await posService.reprintReceipt(context, orderId);
    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleOpenPosShift(request: Request) {
  try {
    const platform = await protectedRoute({ permission: POS_MODULE_PERMISSIONS.POS_CREATE });
    const context = toPosPlatformContext(resolvePosScope(platform));
    const body = openPosShiftSchema.parse(await request.json());
    const shift = await posService.openShift(context, body);
    return jsonSuccess(shift, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleClosePosShift(request: Request, shiftId: string) {
  try {
    const platform = await protectedRoute({ permission: POS_MODULE_PERMISSIONS.POS_CLOSE_SHIFT });
    const context = toPosPlatformContext(resolvePosScope(platform));
    const body = closePosShiftSchema.parse({ ...(await request.json()), shiftId });
    const shift = await posService.closeShift(context, body);
    return jsonSuccess(shift);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleOpenCashDrawer(request: Request) {
  try {
    const platform = await protectedRoute({ permission: POS_MODULE_PERMISSIONS.POS_UPDATE });
    const context = toPosPlatformContext(resolvePosScope(platform));
    const body = cashDrawerActionSchema.parse(await request.json());
    const drawer = await posService.openCashDrawer(context, body);
    return jsonSuccess(drawer);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCloseCashDrawer(request: Request) {
  try {
    const platform = await protectedRoute({ permission: POS_MODULE_PERMISSIONS.POS_CLOSE_SHIFT });
    const context = toPosPlatformContext(resolvePosScope(platform));
    const body = cashDrawerActionSchema.parse(await request.json());
    const drawer = await posService.closeCashDrawer(context, body);
    return jsonSuccess(drawer);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleListPosShifts() {
  try {
    const platform = await protectedRoute({ permission: POS_MODULE_PERMISSIONS.POS_READ });
    const context = toPosPlatformContext(resolvePosScope(platform));
    const shifts = await posService.listShifts(context);
    return jsonSuccess(shifts);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleListPosCashDrawers() {
  try {
    const platform = await protectedRoute({ permission: POS_MODULE_PERMISSIONS.POS_READ });
    const context = toPosPlatformContext(resolvePosScope(platform));
    const drawers = await posService.listCashDrawers(context);
    return jsonSuccess(drawers);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}
