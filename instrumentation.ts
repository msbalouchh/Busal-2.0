export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  if (process.env.DISABLE_ORCHESTRATION_WORKER === "true") {
    return;
  }

  const { startOrchestrationWorkerInterval } = await import(
    "@/modules/platform-orchestration/workers/orchestration-worker"
  );

  const intervalMs = Number(process.env.ORCHESTRATION_WORKER_INTERVAL_MS ?? 30_000);
  const limit = Number(process.env.ORCHESTRATION_WORKER_BATCH_SIZE ?? 25);

  startOrchestrationWorkerInterval(intervalMs, limit);
}
