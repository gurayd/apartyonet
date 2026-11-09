import assert from "node:assert/strict";
import test from "node:test";
import { MAX_UNITS, MIN_UNITS, normalizeUnits, quotePlans } from "../js/pricing.mjs";

test("every unit count and promotion preserves the order of published term prices", () => {
  for (const promo of [false, true]) {
    for (let units = MIN_UNITS; units <= MAX_UNITS; units++) {
      const { plans } = quotePlans(units, promo);
      assert.ok(plans["1y"].total < plans["2y"].total, String(units));
      assert.ok(plans["2y"].total < plans["3y"].total, String(units));
      assert.equal(plans.lifetime, undefined);
    }
  }
});

test("preserves existing term pricing and actual averages; lifetime is quote-only", () => {
  const { plans } = quotePlans(20);
  assert.deepEqual(Object.values(plans).map((plan) => plan.total), [720, 1152, 1512]);
  assert.equal(plans["3y"].perUnitMonthly, 2.1);
  assert.equal(quotePlans(20, true).plans["1y"].total, 648);
});

test("handles empty, invalid, fractional and out-of-range unit counts", () => {
  for (const value of ["", "no", -42, Infinity]) assert.equal(normalizeUnits(value), MIN_UNITS);
  assert.equal(normalizeUnits(45.9), 45);
  assert.equal(normalizeUnits(9000), MAX_UNITS);
});
