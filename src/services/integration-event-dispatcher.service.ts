import "server-only";

export type IntegrationEventType =
  | "connection.created"
  | "connection.deleted"
  | "connection.tested"
  | "sync.started"
  | "sync.completed"
  | "sync.failed"
  | "webhook.received"
  | "credentials.rotated";

type IntegrationEventHandler = (payload: Record<string, unknown>) => void | Promise<void>;

class IntegrationEventDispatcherImpl {
  private handlers = new Map<IntegrationEventType, IntegrationEventHandler[]>();

  on(event: IntegrationEventType, handler: IntegrationEventHandler): void {
    const existing = this.handlers.get(event) ?? [];
    existing.push(handler);
    this.handlers.set(event, existing);
  }

  async dispatch(event: IntegrationEventType, payload: Record<string, unknown>): Promise<void> {
    const handlers = this.handlers.get(event) ?? [];
    await Promise.all(handlers.map((handler) => handler(payload)));
  }
}

export const integrationEventDispatcher = new IntegrationEventDispatcherImpl();

export async function dispatchIntegrationEvent(
  event: IntegrationEventType,
  payload: Record<string, unknown>,
): Promise<void> {
  await integrationEventDispatcher.dispatch(event, payload);
}
