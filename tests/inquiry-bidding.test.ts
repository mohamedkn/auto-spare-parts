import assert from "node:assert/strict";
import test from "node:test";
import { getBiddingEndsAt, isBiddingOpen, VENDOR_BIDDING_WINDOW_MS } from "../src/lib/inquiries/constants";
import { parseVehicleMarkets } from "../src/lib/vehicles/markets";
import { createInquirySchema } from "../src/lib/validations/inquiry";

test("vendor bidding window is exactly five minutes", () => {
  const startsAt = new Date("2026-07-12T10:00:00.000Z");
  assert.equal(VENDOR_BIDDING_WINDOW_MS, 300_000);
  assert.equal(getBiddingEndsAt(startsAt).toISOString(), "2026-07-12T10:05:00.000Z");
});

test("bids are accepted only before the server deadline", () => {
  const end = new Date("2026-07-12T10:05:00.000Z");
  assert.equal(isBiddingOpen("open", end, new Date("2026-07-12T10:04:59.999Z")), true);
  assert.equal(isBiddingOpen("open", end, end), false);
  assert.equal(isBiddingOpen("bidding_closed", end, new Date("2026-07-12T10:04:00.000Z")), false);
});

test("vehicle markets accept multiple valid branches and discard unknown values", () => {
  assert.deepEqual(parseVehicleMarkets("german,korean,german,unknown"), ["german", "korean"]);
});

test("a customer inquiry accepts only one vehicle market", () => {
  const baseInquiry = { description: "محتاج تيل فرامل أمامي للعربية" };
  assert.equal(createInquirySchema.safeParse({ ...baseInquiry, vehicleMarkets: ["korean"] }).success, true);
  assert.equal(createInquirySchema.safeParse({ ...baseInquiry, vehicleMarkets: ["korean", "chinese"] }).success, false);
});
