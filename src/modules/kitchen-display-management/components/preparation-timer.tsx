"use client";

interface PreparationTimerProps {
  placedAt: string;
  preparingStartedAt: string | null;
  targetMinutes: number | null;
}

export function PreparationTimer({
  placedAt,
  preparingStartedAt,
  targetMinutes,
}: PreparationTimerProps) {
  const reference = preparingStartedAt ?? placedAt;
  const elapsedMinutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(reference).getTime()) / 60_000),
  );
  const isOverdue = targetMinutes != null && elapsedMinutes > targetMinutes;

  return (
    <div
      className={`text-sm font-medium ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}
    >
      {elapsedMinutes}m elapsed
      {targetMinutes != null ? ` · target ${targetMinutes}m` : ""}
    </div>
  );
}
