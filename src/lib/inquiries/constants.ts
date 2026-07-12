export const VENDOR_BIDDING_WINDOW_MS = 5 * 60 * 1000;

export function getBiddingEndsAt(startsAt = new Date()) {
  return new Date(startsAt.getTime() + VENDOR_BIDDING_WINDOW_MS);
}

export function isBiddingOpen(status: string, biddingEndsAt: Date | null, now = new Date()) {
  return status === "open" && Boolean(biddingEndsAt && biddingEndsAt.getTime() > now.getTime());
}
