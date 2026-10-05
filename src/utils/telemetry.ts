export type TelemetryFreshness = "fresh" | "late" | "silent" | "unknown" | "clock_error";

export function getTelemetryFreshness(timestamp?: string | null, intervalMinutes = 5, now = Date.now()): TelemetryFreshness {
  if (!timestamp) return "unknown";
  const observedAt = new Date(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(timestamp) ? timestamp : `${timestamp}Z`).getTime();
  if (!Number.isFinite(observedAt) || observedAt > now + 120_000) return "clock_error";
  const expectedMs = Math.max(1, intervalMinutes) * 60_000;
  const age = now - observedAt;
  if (age <= expectedMs) return "fresh";
  if (age <= expectedMs * 2) return "late";
  return "silent";
}
