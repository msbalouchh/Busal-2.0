import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  DEFAULT_MAX_JOB_ATTEMPTS,
  IDEMPOTENCY_KEY_TTL_MS,
} from "@/modules/platform-orchestration/constants/domain-events";
import type {
  OrchestrationJob,
  OrchestrationMetrics,
  OrchestrationTenantScope,
  StoredOrchestrationBranchMeta,
} from "@/modules/platform-orchestration/types/domain-event.types";
import { computeNextRetryAt } from "@/modules/platform-orchestration/queue/retry-policy";

function defaultMetrics(): OrchestrationMetrics {
  return {
    totalEvents: 0,
    totalJobs: 0,
    pendingJobs: 0,
    deadLetterCount: 0,
    averageDispatchMs: 0,
    successRateBps: 10000,
    lastProcessedAt: null,
  };
}

export function defaultOrchestrationBranchMeta(): StoredOrchestrationBranchMeta {
  return {
    idempotencyKeys: [],
    jobs: [],
    deadLetter: [],
    metrics: defaultMetrics(),
    aiContextSnapshots: [],
  };
}

/** Branch-scoped orchestration queue, idempotency, and metrics store. */
export class JobQueueRepository {
  private async loadMeta(branchId: string): Promise<StoredOrchestrationBranchMeta> {
    const settings = await prisma.branchSettings.findUnique({
      where: { branchId },
      select: { settings: true },
    });

    const raw = settings?.settings;
    if (raw && typeof raw === "object" && raw !== null && "orchestrationOperations" in raw) {
      return (raw as unknown as { orchestrationOperations: StoredOrchestrationBranchMeta }).orchestrationOperations;
    }

    return defaultOrchestrationBranchMeta();
  }

  private async saveMeta(branchId: string, meta: StoredOrchestrationBranchMeta): Promise<void> {
    const existing = await prisma.branchSettings.findUnique({
      where: { branchId },
      select: { settings: true },
    });

    const settingsObject =
      existing?.settings && typeof existing.settings === "object" && existing.settings !== null
        ? (existing.settings as Record<string, unknown>)
        : {};

    await prisma.branchSettings.upsert({
      where: { branchId },
      create: {
        branchId,
        settings: { ...settingsObject, orchestrationOperations: meta } as unknown as Prisma.InputJsonValue,
      },
      update: {
        settings: { ...settingsObject, orchestrationOperations: meta } as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async hasIdempotencyKey(branchId: string, key: string): Promise<boolean> {
    const meta = await this.loadMeta(branchId);
    return meta.idempotencyKeys.includes(key);
  }

  async recordIdempotencyKey(branchId: string, key: string): Promise<void> {
    const meta = await this.loadMeta(branchId);
    const cutoff = Date.now() - IDEMPOTENCY_KEY_TTL_MS;
    meta.idempotencyKeys = [...meta.idempotencyKeys.filter((k) => !k.startsWith("expired:")), key].slice(-500);
    void cutoff;
    await this.saveMeta(branchId, meta);
  }

  async enqueueJob(
    branchId: string,
    job: Omit<OrchestrationJob, "id" | "createdAt" | "status" | "attemptCount" | "startedAt" | "completedAt" | "lastError" | "nextRetryAt">,
  ): Promise<OrchestrationJob> {
    const meta = await this.loadMeta(branchId);
    const record: OrchestrationJob = {
      ...job,
      id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: "pending",
      attemptCount: 0,
      maxAttempts: job.maxAttempts ?? DEFAULT_MAX_JOB_ATTEMPTS,
      startedAt: null,
      completedAt: null,
      lastError: null,
      nextRetryAt: null,
      createdAt: new Date().toISOString(),
    };

    meta.jobs.push(record);
    meta.metrics.totalJobs += 1;
    meta.metrics.pendingJobs = meta.jobs.filter((j) => j.status === "pending" || j.status === "retry").length;
    await this.saveMeta(branchId, meta);
    return record;
  }

  async getPendingJobs(branchId: string, limit = 50): Promise<OrchestrationJob[]> {
    const meta = await this.loadMeta(branchId);
    const now = Date.now();
    return meta.jobs
      .filter(
        (job) =>
          (job.status === "pending" || job.status === "retry") &&
          (!job.nextRetryAt || new Date(job.nextRetryAt).getTime() <= now),
      )
      .slice(0, limit);
  }

  async updateJob(branchId: string, jobId: string, patch: Partial<OrchestrationJob>): Promise<void> {
    const meta = await this.loadMeta(branchId);
    const job = meta.jobs.find((item) => item.id === jobId);
    if (!job) {
      return;
    }

    Object.assign(job, patch);
    meta.metrics.pendingJobs = meta.jobs.filter((j) => j.status === "pending" || j.status === "retry").length;
    await this.saveMeta(branchId, meta);
  }

  async moveToDeadLetter(branchId: string, job: OrchestrationJob): Promise<void> {
    const meta = await this.loadMeta(branchId);
    meta.jobs = meta.jobs.filter((item) => item.id !== job.id);
    meta.deadLetter.unshift({ ...job, status: "dead_letter", completedAt: new Date().toISOString() });
    meta.deadLetter = meta.deadLetter.slice(0, 200);
    meta.metrics.deadLetterCount = meta.deadLetter.length;
    meta.metrics.pendingJobs = meta.jobs.filter((j) => j.status === "pending" || j.status === "retry").length;
    await this.saveMeta(branchId, meta);
  }

  async recordDispatchMetrics(branchId: string, durationMs: number, success: boolean): Promise<void> {
    const meta = await this.loadMeta(branchId);
    meta.metrics.totalEvents += 1;
    meta.metrics.averageDispatchMs = Math.round(
      (meta.metrics.averageDispatchMs * (meta.metrics.totalEvents - 1) + durationMs) /
        meta.metrics.totalEvents,
    );
    if (!success) {
      const failures = Math.round((10000 - meta.metrics.successRateBps) / 100) + 1;
      const total = meta.metrics.totalEvents;
      meta.metrics.successRateBps = Math.round(((total - failures) / total) * 10000);
    }
    meta.metrics.lastProcessedAt = new Date().toISOString();
    await this.saveMeta(branchId, meta);
  }

  async updateAiContextSnapshot(
    branchId: string,
    eventType: string,
    aggregateId: string,
    snapshot: Record<string, unknown>,
  ): Promise<void> {
    const meta = await this.loadMeta(branchId);
    meta.aiContextSnapshots = [
      { eventType, aggregateId, snapshot, updatedAt: new Date().toISOString() },
      ...meta.aiContextSnapshots.filter((s) => !(s.eventType === eventType && s.aggregateId === aggregateId)),
    ].slice(0, 100);
    await this.saveMeta(branchId, meta);
  }

  async getMetrics(branchId: string): Promise<OrchestrationMetrics> {
    const meta = await this.loadMeta(branchId);
    return meta.metrics;
  }

  buildScopeFromJob(job: OrchestrationJob): OrchestrationTenantScope {
    return job.scope;
  }

  async markJobRetry(branchId: string, job: OrchestrationJob, error: string): Promise<void> {
    const attemptCount = job.attemptCount + 1;
    if (attemptCount >= job.maxAttempts) {
      await this.moveToDeadLetter(branchId, { ...job, attemptCount, lastError: error });
      return;
    }

    await this.updateJob(branchId, job.id, {
      status: "retry",
      attemptCount,
      lastError: error,
      nextRetryAt: computeNextRetryAt(attemptCount),
    });
  }
}

export const jobQueueRepository = new JobQueueRepository();
