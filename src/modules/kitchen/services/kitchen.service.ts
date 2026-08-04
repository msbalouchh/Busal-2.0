import { kitchenRepository } from "@/modules/kitchen/repository/kitchen-repository";
import type {
  AcceptKitchenOrderInput,
  AddKitchenNoteInput,
  AssignStationInput,
  BumpKitchenOrderInput,
  KitchenRecord,
  KitchenSearchQuery,
  RecallKitchenOrderInput,
  UpdateKitchenItemStatusInput,
} from "@/modules/kitchen/types/kitchen";

/** Domain service for kitchen order operations. */
export class KitchenService {
  list(): KitchenRecord[] {
    return kitchenRepository.listRecords();
  }

  getById(kitchenOrderId: string): KitchenRecord | null {
    return kitchenRepository.findById(kitchenOrderId) ?? null;
  }

  search(query: KitchenSearchQuery = {}): KitchenRecord[] {
    return kitchenRepository.search(query);
  }

  getByStation(stationId: string): KitchenRecord[] {
    return kitchenRepository.findByStationId(stationId);
  }

  getQueueRecords(queueId: string): KitchenRecord[] {
    return kitchenRepository.getQueueRecords(queueId);
  }

  acceptOrder(input: AcceptKitchenOrderInput): KitchenRecord | null {
    return kitchenRepository.acceptOrder(input);
  }

  bumpOrder(input: BumpKitchenOrderInput): KitchenRecord | null {
    return kitchenRepository.bumpOrder(input);
  }

  recallOrder(input: RecallKitchenOrderInput): KitchenRecord | null {
    return kitchenRepository.recallOrder(input);
  }

  assignStation(input: AssignStationInput): KitchenRecord | null {
    return kitchenRepository.assignStation(input);
  }

  updateItemStatus(input: UpdateKitchenItemStatusInput): KitchenRecord | null {
    return kitchenRepository.updateItemStatus(input);
  }

  addNote(input: AddKitchenNoteInput): KitchenRecord | null {
    return kitchenRepository.addNote(input);
  }
}

export const kitchenService = new KitchenService();
