import assert from "node:assert/strict";
import test from "node:test";
import { generateOrderNumber } from "../src/lib/utils/order-number";

test("order numbers have a production-safe format and do not collide in a batch", () => {
  const numbers = Array.from({ length: 5_000 }, generateOrderNumber);
  assert.equal(new Set(numbers).size, numbers.length);
  for (const value of numbers) {
    assert.match(value, /^ZEE-\d{8}-[A-F0-9]{12}$/);
    assert.ok(value.length <= 30);
  }
});
