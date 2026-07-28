import type { CartData } from "@/services/cart.service";
import type { OrderSessionData } from "@/services/order-session.service";
import type { TableData } from "@/services/table.service";

import type { PosOrderType } from "@/modules/pos/constants/routes";
import type { PlatformContext } from "@/modules/platform-guards/types/platform-context";

export interface PosCartItemView {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes: string | null;
}

export interface PosCartView {
  id: string;
  subtotal: number;
  items: PosCartItemView[];
}

export interface PosHeldOrderView {
  orderSessionId: string;
  cartId: string;
  label: string;
  tableId: string | null;
  tableName: string | null;
  orderType: PosOrderType;
  itemCount: number;
  subtotal: number;
  updatedAt: string;
}

export interface PosTableView {
  id: string;
  name: string;
  section: string | null;
  capacity: number;
  status: TableData["status"];
}

export interface PosMenuCategoryView {
  id: string;
  name: string;
  sortOrder: number;
}

export interface PosMenuItemView {
  id: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  price: number;
  isAvailable: boolean;
  isFeatured: boolean;
}

export interface PosTerminalState {
  context: PlatformContext;
  posSessionId: string;
  cart: PosCartView;
  heldOrders: PosHeldOrderView[];
  categories: PosMenuCategoryView[];
  menuItems: PosMenuItemView[];
  tables: PosTableView[];
  orderType: PosOrderType;
  tableId: string | null;
  tableName: string | null;
  customerName: string | null;
  orderNotes: string | null;
}

export interface PosSendToKitchenResult {
  orderId: string;
  orderNumber: string;
  kitchenQueueId: string;
}

export interface PosHoldOrderInput {
  cartId: string;
  posSessionId: string;
  label?: string;
  tableId?: string | null;
  orderType?: PosOrderType;
  customerName?: string | null;
  orderNotes?: string | null;
}

export interface PosResumeOrderInput {
  orderSessionId: string;
  posSessionId: string;
}

export interface PosUpdateCartItemNotesInput {
  cartItemId: string;
  notes: string | null;
}

export type PosCartState = CartData;
export type PosOrderSessionState = OrderSessionData;
