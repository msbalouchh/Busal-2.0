import type { OrderSessionData } from "@/services/order-session.service";

export interface ClientOrderSession {
  id: string;
  tableName: string | null;
  customerName: string;
  customerPhone: string;
  orderNotes: string;
  status: OrderSessionData["status"];
}

export function serializeOrderSession(session: OrderSessionData): ClientOrderSession {
  return {
    id: session.id,
    tableName: session.tableName,
    customerName: session.customerName ?? "",
    customerPhone: session.customerPhone ?? "",
    orderNotes: session.orderNotes ?? "",
    status: session.status,
  };
}

export interface OrderReviewFormState {
  customerName: string;
  customerPhone: string;
  orderNotes: string;
}

export function createEmptyOrderReviewForm(): OrderReviewFormState {
  return {
    customerName: "",
    customerPhone: "",
    orderNotes: "",
  };
}

export function isOrderReviewValid(cartItemCount: number): boolean {
  return cartItemCount > 0;
}
