import assert from "node:assert/strict";
import test from "node:test";
import { getTelemetryFreshness } from "../src/utils/telemetry.ts";

const now = Date.parse("2026-08-26T10:00:00+08:00");

test("telemetry freshness follows the configured device interval", () => {
  assert.equal(getTelemetryFreshness("2026-08-26T09:57:00+08:00", 5, now), "fresh");
  assert.equal(getTelemetryFreshness("2026-08-26T09:53:00+08:00", 5, now), "late");
  assert.equal(getTelemetryFreshness("2026-08-26T09:40:00+08:00", 5, now), "silent");
  assert.equal(getTelemetryFreshness(null, 5, now), "unknown");
  assert.equal(getTelemetryFreshness("2026-08-26T10:05:00+08:00", 5, now), "clock_error");
});

test("timezone-less backend timestamps are interpreted as UTC", () => {
  assert.equal(getTelemetryFreshness("2026-08-26T01:57:00", 5, now), "fresh");
});
