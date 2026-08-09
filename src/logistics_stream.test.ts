import assert from "node:assert/strict";
import test from "node:test";
import { parseShipmentEvent } from "./logistics_stream.ts";

test("turns one complete model line into a UI event", () => {
  assert.deepEqual(
    parseShipmentEvent("STATUS: In transit| LOCATION: Suzhou hub| ETA: 2026-08-10"),
    { status: "In transit", location: "Suzhou hub", eta: "2026-08-10" },
  );
});

test("waits for the complete line before updating the UI", () => {
  assert.equal(parseShipmentEvent("STATUS: In transit| LOCATION: Suzhou hub"), null);
});
