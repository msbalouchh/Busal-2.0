import { NextResponse } from "next/server";

import { tenantFoundationService } from "@/modules/tenant/services/tenant-foundation.service";
import { getCurrentUser } from "@/services/auth.service";
import {
  handlePlatformRouteError,
  protectedRoute,
} from "@/modules/platform-guards/guards/route.guards";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthenticated" }, { status: 401 });
    }

    const snapshots = await tenantFoundationService.listAccessibleSnapshots(user.id);
    return NextResponse.json({
      success: true,
      data: snapshots.map((snapshot) => ({
        tenant: snapshot.tenant,
        organization: snapshot.organization,
        workspace: snapshot.workspace,
        business: snapshot.business,
        branches: snapshot.branches,
        selection: snapshot.selection,
      })),
    });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const platform = await protectedRoute({ permission: PERMISSION_CODES.TENANT_PLATFORM_MANAGE });
    const body = (await request.json()) as {
      action?: string;
      businessName?: string;
      newOwnerId?: string;
      branchName?: string;
    };

    switch (body.action) {
      case "create": {
        const created = await tenantFoundationService.createTenant({
          ownerId: platform.user.id,
          businessName: body.businessName ?? "New Tenant",
        });
        await tenantFoundationService.provisionCommercialStack(created.businessId);
        const snapshot = await tenantFoundationService.buildSnapshotForBusiness(created.businessId);
        return NextResponse.json({ success: true, data: snapshot });
      }
      case "suspend":
        await tenantFoundationService.suspendTenant(platform.business.id, platform.user.id);
        return NextResponse.json({ success: true });
      case "activate":
        await tenantFoundationService.activateTenant(platform.business.id, platform.user.id);
        return NextResponse.json({ success: true });
      case "delete":
        await tenantFoundationService.deleteTenant(platform.business.id);
        return NextResponse.json({ success: true });
      case "transfer_owner":
        if (!body.newOwnerId) {
          return NextResponse.json({ success: false, error: "newOwnerId required" }, { status: 400 });
        }
        await tenantFoundationService.transferOwnership(platform.business.id, body.newOwnerId);
        return NextResponse.json({ success: true });
      case "create_branch": {
        const branch = await tenantFoundationService.createBusinessBranch({
          businessId: platform.business.id,
          name: body.branchName ?? "Branch",
        });
        return NextResponse.json({ success: true, data: branch });
      }
      default:
        return NextResponse.json({ success: false, error: "Unsupported tenant action" }, { status: 400 });
    }
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}
