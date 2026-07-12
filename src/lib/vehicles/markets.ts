import { VehicleMarket } from "@prisma/client";

export const VEHICLE_MARKETS: Array<{ value: VehicleMarket; label: string }> = [
  { value: "german", label: "ألماني" },
  { value: "korean", label: "كوري" },
  { value: "japanese", label: "ياباني" },
  { value: "american", label: "أمريكي" },
  { value: "chinese", label: "صيني" },
  { value: "european", label: "أوروبي آخر" },
  { value: "other", label: "أخرى" },
];

export const VEHICLE_MARKET_VALUES = VEHICLE_MARKETS.map((market) => market.value) as [VehicleMarket, ...VehicleMarket[]];

export function parseVehicleMarkets(value?: string | null): VehicleMarket[] {
  if (!value) return [];
  const allowed = new Set<VehicleMarket>(VEHICLE_MARKET_VALUES);
  return [...new Set(value.split(",").filter((item): item is VehicleMarket => allowed.has(item as VehicleMarket)))];
}
