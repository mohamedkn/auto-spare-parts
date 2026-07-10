import assert from "node:assert/strict";
import test from "node:test";
import {
  DELIVERY_FEE_EGP,
  DELIVERY_PLATFORM_COMMISSION_EGP,
  DRIVER_EARNING_EGP,
} from "../src/lib/delivery/pricing";

test("the delivery fee is fully allocated", () => {
  assert.equal(DRIVER_EARNING_EGP + DELIVERY_PLATFORM_COMMISSION_EGP, DELIVERY_FEE_EGP);
  assert.ok(DELIVERY_FEE_EGP > 0);
});
