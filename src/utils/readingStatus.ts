import type { DeviceThresholds, SensorReading } from "../types";

export type ReadingStatus = "normal" | "low" | "high" | "unknown";

const limits: Record<Exclude<keyof SensorReading, "timestamp">, [keyof DeviceThresholds | null, keyof DeviceThresholds | null]> = {
  suhu: ["temp_min", "temp_max"],
  ph: ["ph_min", "ph_max"],
  do: ["do_min", null],
  tds: [null, "tds_max"],
  ammonia: [null, "ammonia_max"],
  salinitas: ["salinitas_min", "salinitas_max"],
};

const clamp = (value: number) => Math.min(100, Math.max(0, value));

export function getReadingVisual(key: Exclude<keyof SensorReading, "timestamp">, value: number | null | undefined, thresholds: DeviceThresholds | null) {
  const [minKey, maxKey] = limits[key];
  const min = minKey ? thresholds?.[minKey] as number | null | undefined : null;
  const max = maxKey ? thresholds?.[maxKey] as number | null | undefined : null;
  if (value == null || !Number.isFinite(value)) return { status: "unknown" as const, label: "Belum ada data", min, max, rangeMin: 0, rangeMax: 1, position: 0, minPosition: null, maxPosition: null };
  if (min == null && max == null) return { status: "unknown" as const, label: "Batas belum diatur", min, max, rangeMin: 0, rangeMax: 1, position: 0, minPosition: null, maxPosition: null };

  const span = min != null && max != null ? Math.max(max - min, 0.01) : null;
  const rangeMin = min != null && max != null ? Math.max(0, min - span! * .35) : 0;
  const rangeMax = min != null && max != null ? max + span! * .35 : max != null ? Math.max(max * 1.25, max + .01) : Math.max(min! * 2, min! + .01);
  const position = clamp(((value - rangeMin) / (rangeMax - rangeMin)) * 100);
  const minPosition = min == null ? null : clamp(((min - rangeMin) / (rangeMax - rangeMin)) * 100);
  const maxPosition = max == null ? null : clamp(((max - rangeMin) / (rangeMax - rangeMin)) * 100);
  const status: ReadingStatus = min != null && value < min ? "low" : max != null && value > max ? "high" : "normal";
  const label = status === "normal" ? "Dalam batas" : key === "suhu" ? status === "low" ? "Terlalu dingin" : "Terlalu panas" : status === "low" ? "Di bawah batas" : "Di atas batas";
  return { status, label, min, max, rangeMin, rangeMax, position, minPosition, maxPosition };
}
