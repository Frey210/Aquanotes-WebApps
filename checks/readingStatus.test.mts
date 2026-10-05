import assert from "node:assert/strict";
import test from "node:test";
import { getReadingVisual } from "../src/utils/readingStatus.ts";
import type { DeviceThresholds } from "../src/types.ts";

const thresholds = { temp_min: 26, temp_max: 31, ph_min: 7.4, ph_max: 8.5, do_min: 4, tds_max: 1800, ammonia_max: .1, salinitas_min: 15, salinitas_max: 30 } as DeviceThresholds;

test("reading status follows device thresholds", () => {
  assert.equal(getReadingVisual("suhu", 25, thresholds).label, "Terlalu dingin");
  assert.equal(getReadingVisual("suhu", 32, thresholds).label, "Terlalu panas");
  assert.equal(getReadingVisual("ph", 7.8, thresholds).status, "normal");
  assert.equal(getReadingVisual("ammonia", .12, thresholds).status, "high");
});
