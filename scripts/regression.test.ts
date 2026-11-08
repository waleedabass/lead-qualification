import assert from "node:assert/strict";
import test from "node:test";
import { territoryFromLocation } from "../src/lib/enrichment/company.ts";
import '../tests/live-access.test';

test("unknown headquarters require manual routing rather than silently assigning US-East", () => {
  assert.equal(territoryFromLocation("Islamabad, PK"), null);
  assert.equal(territoryFromLocation(""), null);
});

test("territory routing uses geographic names, not arbitrary country-code substrings", () => {
  assert.equal(territoryFromLocation("Hyderabad, IN"), null);
  assert.equal(territoryFromLocation("Berlin, DE"), "EMEA");
  assert.equal(territoryFromLocation("Singapore"), "APAC");
  assert.equal(territoryFromLocation("San Francisco, US"), "US-West");
  assert.equal(territoryFromLocation("New York, US"), "US-East");
});
