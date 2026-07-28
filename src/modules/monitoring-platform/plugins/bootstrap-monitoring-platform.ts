import { registerHealthCheckDefinition } from "@/modules/monitoring-platform/registry/health-check-registry";
import type { RegisteredHealthCheckDefinition } from "@/modules/monitoring-platform/types/monitoring-platform-types";

const DEFAULT_HEALTH_CHECKS: Omit<RegisteredHealthCheckDefinition, "isActive">[] = [
  {
    checkKey: "platform.core",
    name: "Platform Core",
    targetType: "PLATFORM",
    serviceTarget: "busal-platform",
  },
  {
    checkKey: "service.orders",
    name: "Orders Service",
    targetType: "SERVICE",
    serviceTarget: "orders-service",
  },
  {
    checkKey: "database.primary",
    name: "Primary Database",
    targetType: "DATABASE",
    serviceTarget: "postgres-primary",
  },
  {
    checkKey: "cache.redis",
    name: "Redis Cache",
    targetType: "CACHE",
    serviceTarget: "redis-cache",
  },
  {
    checkKey: "queue.kitchen",
    name: "Kitchen Queue",
    targetType: "QUEUE",
    serviceTarget: "kitchen-queue",
  },
  {
    checkKey: "storage.files",
    name: "File Storage",
    targetType: "STORAGE",
    serviceTarget: "file-storage",
  },
  {
    checkKey: "api.gateway",
    name: "API Gateway",
    targetType: "API",
    serviceTarget: "api-gateway",
  },
  {
    checkKey: "ai.platform",
    name: "AI Platform",
    targetType: "AI",
    serviceTarget: "ai-service",
  },
  {
    checkKey: "worker.background",
    name: "Background Workers",
    targetType: "WORKER",
    serviceTarget: "background-workers",
  },
];

let bootstrapped = false;

export function ensureBootstrapMonitoringPlatform(): void {
  if (bootstrapped) {
    return;
  }

  for (const check of DEFAULT_HEALTH_CHECKS) {
    registerHealthCheckDefinition({ ...check, isActive: true });
  }

  bootstrapped = true;
}

export function resetBootstrapMonitoringPlatform(): void {
  bootstrapped = false;
}

export function getDefaultHealthCheckCount(): number {
  return DEFAULT_HEALTH_CHECKS.length;
}

export const DEFAULT_REGISTERED_HEALTH_CHECKS = DEFAULT_HEALTH_CHECKS;
