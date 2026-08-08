import "server-only";

import { DOMAIN_EVENT_TYPES } from "@/modules/platform-orchestration/constants/domain-events";
import {
  moduleScopeFromPlatform,
  publishModuleDomainEvent,
} from "@/modules/platform-orchestration/lib/publish-module-event";
import type { KitchenTenantScope } from "@/modules/kitchen/lib/kitchen-scope";
import {
  kitchenRepository,
  type KitchenSearchResult,
} from "@/modules/kitchen/repository/kitchen-repository";
import type {
  AcceptKitchenOrderInput,
  AddKitchenNoteInput,
  AssignStationInput,
  BumpKitchenOrderInput,
  KitchenPlatformContext,
  KitchenQueue,
  KitchenRecord,
  KitchenScreen,
  KitchenSearchQuery,
  KitchenStation,
  RecallKitchenOrderInput,
  UpdateKitchenItemStatusInput,
} from "@/modules/kitchen/types/kitchen";
import type {
  CreateKitchenStationSchemaInput,
  KitchenSearchSchemaInput,
  UpdateKitchenStationSchemaInput,
} from "@/modules/kitchen/validation/kitchen-schemas";

/** Domain service for kitchen order operations. */
export class KitchenService {
  async list(context: KitchenPlatformContext): Promise<KitchenRecord[]> {
    return kitchenRepository.listRecords(this.toScope(context));
  }

  async getById(context: KitchenPlatformContext, kitchenOrderId: string): Promise<KitchenRecord | null> {
    return kitchenRepository.findById(this.toScope(context), kitchenOrderId);
  }

  async search(
    query: KitchenSearchQuery & KitchenSearchSchemaInput,
    context: KitchenPlatformContext,
  ): Promise<KitchenSearchResult> {
    return kitchenRepository.search(this.toScope(context), query);
  }

  async getByStation(context: KitchenPlatformContext, stationId: string): Promise<KitchenRecord[]> {
    return kitchenRepository.findByStationId(this.toScope(context), stationId);
  }

  async getQueueRecords(context: KitchenPlatformContext, queueId: string): Promise<KitchenRecord[]> {
    return kitchenRepository.getQueueRecords(this.toScope(context), queueId);
  }

  async listStations(context: KitchenPlatformContext): Promise<KitchenStation[]> {
    return kitchenRepository.listStations(this.toScope(context));
  }

  async listScreens(context: KitchenPlatformContext): Promise<KitchenScreen[]> {
    return kitchenRepository.listScreens(this.toScope(context));
  }

  async listQueues(context: KitchenPlatformContext): Promise<KitchenQueue[]> {
    return kitchenRepository.listQueues(this.toScope(context));
  }

  async createStation(
    context: KitchenPlatformContext,
    input: CreateKitchenStationSchemaInput,
  ): Promise<KitchenStation> {
    return kitchenRepository.createStation(this.toScope(context), input);
  }

  async updateStation(
    context: KitchenPlatformContext,
    input: UpdateKitchenStationSchemaInput,
  ): Promise<KitchenStation | null> {
    return kitchenRepository.updateStation(this.toScope(context), input);
  }

  async archiveStation(context: KitchenPlatformContext, stationId: string): Promise<boolean> {
    return kitchenRepository.archiveStation(this.toScope(context), stationId);
  }

  async acceptOrder(
    context: KitchenPlatformContext,
    input: AcceptKitchenOrderInput,
  ): Promise<KitchenRecord | null> {
    return kitchenRepository.acceptOrder(this.toScope(context), input);
  }

  async fireOrder(context: KitchenPlatformContext, kitchenOrderId: string): Promise<KitchenRecord | null> {
    return kitchenRepository.fireOrder(this.toScope(context), kitchenOrderId);
  }

  async holdOrder(context: KitchenPlatformContext, kitchenOrderId: string): Promise<KitchenRecord | null> {
    return kitchenRepository.holdOrder(this.toScope(context), kitchenOrderId);
  }

  async resumeOrder(context: KitchenPlatformContext, kitchenOrderId: string): Promise<KitchenRecord | null> {
    return kitchenRepository.resumeOrder(this.toScope(context), kitchenOrderId);
  }

  async markReady(context: KitchenPlatformContext, kitchenOrderId: string): Promise<KitchenRecord | null> {
    return kitchenRepository.markReady(this.toScope(context), kitchenOrderId);
  }

  async bumpOrder(
    context: KitchenPlatformContext,
    input: BumpKitchenOrderInput,
  ): Promise<KitchenRecord | null> {
    return kitchenRepository.bumpOrder(this.toScope(context), input);
  }

  async completeOrder(context: KitchenPlatformContext, kitchenOrderId: string): Promise<KitchenRecord | null> {
    const record = await kitchenRepository.completeOrder(this.toScope(context), kitchenOrderId);
    if (record) {
      await publishModuleDomainEvent(moduleScopeFromPlatform(context), {
        eventType: DOMAIN_EVENT_TYPES.KITCHEN_TICKET_COMPLETED,
        aggregateId: kitchenOrderId,
        payload: { kitchenOrderId, orderId: record.order?.id ?? null },
      });
    }
    return record;
  }

  async recallOrder(
    context: KitchenPlatformContext,
    input: RecallKitchenOrderInput,
  ): Promise<KitchenRecord | null> {
    return kitchenRepository.recallOrder(this.toScope(context), input);
  }

  async cancelOrder(context: KitchenPlatformContext, kitchenOrderId: string): Promise<KitchenRecord | null> {
    return kitchenRepository.cancelOrder(this.toScope(context), kitchenOrderId);
  }

  async assignStation(
    context: KitchenPlatformContext,
    input: AssignStationInput,
  ): Promise<KitchenRecord | null> {
    return kitchenRepository.assignStation(this.toScope(context), input);
  }

  async updateItemStatus(
    context: KitchenPlatformContext,
    input: UpdateKitchenItemStatusInput,
  ): Promise<KitchenRecord | null> {
    return kitchenRepository.updateItemStatus(this.toScope(context), input);
  }

  async addNote(
    context: KitchenPlatformContext,
    input: AddKitchenNoteInput,
  ): Promise<KitchenRecord | null> {
    return kitchenRepository.addNote(this.toScope(context), input);
  }

  async receiveFromOms(
    context: KitchenPlatformContext,
    restaurantOrderId: string,
    priority?: string,
  ): Promise<KitchenRecord | null> {
    const record = await kitchenRepository.receiveFromOms(this.toScope(context), restaurantOrderId, priority);
    if (record) {
      await publishModuleDomainEvent(moduleScopeFromPlatform(context), {
        eventType: DOMAIN_EVENT_TYPES.KITCHEN_TICKET_CREATED,
        aggregateId: record.kitchen.id,
        payload: { kitchenOrderId: record.kitchen.id, orderId: restaurantOrderId },
      });
    }
    return record;
  }

  private toScope(context: KitchenPlatformContext): KitchenTenantScope {
    return {
      tenantId: context.tenantId,
      workspaceId: context.workspaceId,
      businessId: context.businessId,
      branchId: context.branchId,
      userId: context.userId,
      kitchenId: context.kitchenId,
    };
  }
}

export const kitchenService = new KitchenService();
