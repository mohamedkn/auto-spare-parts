import { Prisma, ProductCondition, VehicleMarket } from "@prisma/client";
import { expandEgyptianSearchTerms } from "@/lib/catalog/egypt-auto-parts";
import { normalizePartNumber, normalizeSearchText, searchTokens } from "@/lib/search/normalize";

export interface ProductSearchFilters {
  search?: string;
  categoryId?: string;
  vendorId?: string;
  oemNumber?: string;
  brand?: string;
  condition?: ProductCondition;
  vehicleMakeId?: string;
  vehicleModelId?: string;
  vehicleMarkets?: VehicleMarket[];
  year?: number;
  minPrice?: number;
  maxPrice?: number;
  inStock?: "true" | "false";
  productIdsFromRating?: string[];
}

export interface SearchableProduct {
  name: string;
  description?: string | null;
  oemNumber?: string | null;
  partNumber?: string | null;
  brand?: string | null;
  stockQuantity?: number;
  category?: { name: string; slug?: string } | null;
  vendor?: { storeName: string } | null;
}

export interface SearchVehicleMake {
  id: string;
  name: string;
  models: Array<{ id: string; name: string }>;
}

const EGYPT_VEHICLE_NAME_ALIASES: string[][] = [
  ["Toyota", "تويوتا"], ["Corolla", "كورولا"],
  ["Nissan", "نيسان"], ["Sunny", "صني"],
  ["Hyundai", "هيونداي"], ["Elantra", "النترا", "إلنترا"], ["Accent", "اكسنت", "أكسنت"],
  ["Chevrolet", "شيفروليه", "شيفرولية"], ["Optra", "اوبترا", "أوبترا"],
  ["Chery", "شيري"], ["Arrizo", "اريزو", "أريزو"], ["Tiggo", "تيجو"],
  ["MG", "ام جي"], ["Kia", "كيا"], ["Cerato", "سيراتو"],
  ["Renault", "رينو"], ["Logan", "لوجان"], ["Fiat", "فيات"], ["Tipo", "تيبو"],
  ["BYD", "بي واي دي"], ["Mitsubishi", "ميتسوبيشي"], ["Lancer", "لانسر"],
  ["Daewoo", "دايو"], ["Lanos", "لانوس"], ["Skoda", "سكودا"], ["Octavia", "اوكتافيا", "أوكتافيا"],
  ["BMW", "بي ام دبليو"], ["Peugeot", "بيجو"],
];

function queryIncludesVehicleName(normalizedQuery: string, catalogName: string): boolean {
  const normalizedName = normalizeSearchText(catalogName);
  const aliases = EGYPT_VEHICLE_NAME_ALIASES.find((group) =>
    group.some((alias) => normalizeSearchText(alias) === normalizedName),
  ) || [catalogName];
  return aliases.some((alias) => {
    const normalizedAlias = normalizeSearchText(alias);
    if (normalizedAlias.length <= 2) return normalizedQuery.split(" ").includes(normalizedAlias);
    return normalizedQuery.includes(normalizedAlias);
  });
}

export function inferVehicleFilters(query: string, makes: SearchVehicleMake[]) {
  const normalizedQuery = normalizeSearchText(query);
  const yearMatch = normalizedQuery.match(/(?:^|\s)((?:19|20)\d{2})(?:\s|$)/);
  const year = yearMatch ? Number(yearMatch[1]) : undefined;
  const matchingModels = makes.flatMap((make) =>
    make.models
      .filter((model) => queryIncludesVehicleName(normalizedQuery, model.name))
      .map((model) => ({ make, model, length: normalizeSearchText(model.name).length })),
  ).sort((a, b) => b.length - a.length);

  if (matchingModels[0]) {
    return {
      vehicleMakeId: matchingModels[0].make.id,
      vehicleModelId: matchingModels[0].model.id,
      year,
      makeName: matchingModels[0].make.name,
      modelName: matchingModels[0].model.name,
    };
  }

  const matchingMake = makes
    .filter((make) => queryIncludesVehicleName(normalizedQuery, make.name))
    .sort((a, b) => b.name.length - a.name.length)[0];

  return {
    vehicleMakeId: matchingMake?.id,
    vehicleModelId: undefined,
    year,
    makeName: matchingMake?.name,
    modelName: undefined,
  };
}

function textFieldConditions(term: string): Prisma.ProductWhereInput[] {
  return [
    { name: { contains: term, mode: "insensitive" } },
    { description: { contains: term, mode: "insensitive" } },
    { brand: { contains: term, mode: "insensitive" } },
    { oemNumber: { contains: term, mode: "insensitive" } },
    { partNumber: { contains: term, mode: "insensitive" } },
    { category: { name: { contains: term, mode: "insensitive" } } },
  ];
}

export function buildProductWhere(filters: ProductSearchFilters): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [];

  if (filters.search) {
    const terms = expandEgyptianSearchTerms(filters.search);
    and.push({ OR: terms.flatMap(textFieldConditions) });
  }

  if (filters.categoryId) {
    and.push({
      OR: [
        { categoryId: filters.categoryId },
        { category: { parentId: filters.categoryId } },
      ],
    });
  }

  if (filters.vendorId) and.push({ vendorId: filters.vendorId });
  if (filters.brand) and.push({ brand: { equals: filters.brand, mode: "insensitive" } });
  if (filters.condition) and.push({ condition: filters.condition });
  if (filters.oemNumber) {
    and.push({
      OR: [
        { oemNumber: { contains: filters.oemNumber, mode: "insensitive" } },
        { partNumber: { contains: filters.oemNumber, mode: "insensitive" } },
      ],
    });
  }

  if (filters.vehicleModelId || filters.vehicleMakeId || filters.year) {
    and.push({
      compatibilities: {
        some: {
          ...(filters.vehicleModelId && { vehicleModelId: filters.vehicleModelId }),
          ...(filters.vehicleMakeId && { vehicleModel: { makeId: filters.vehicleMakeId } }),
          ...(filters.year && {
            OR: [
              { specificYear: filters.year },
              {
                specificYear: null,
                vehicleModel: {
                  startYear: { lte: filters.year },
                  OR: [{ endYear: { gte: filters.year } }, { endYear: null }],
                },
              },
            ],
          }),
        },
      },
    });
  }

  if (filters.vehicleMarkets?.length) {
    and.push({ compatibilities: { some: { vehicleModel: { make: { market: { in: filters.vehicleMarkets } } } } } });
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    and.push({
      price: {
        ...(filters.minPrice !== undefined && { gte: new Prisma.Decimal(filters.minPrice) }),
        ...(filters.maxPrice !== undefined && { lte: new Prisma.Decimal(filters.maxPrice) }),
      },
    });
  }

  if (filters.inStock === "true") {
    and.push({
      OR: [
        { stockQuantity: { gt: 0 } },
        { variants: { some: { stockQuantity: { gt: 0 } } } },
      ],
    });
  }

  if (filters.productIdsFromRating !== undefined) {
    and.push({ id: { in: filters.productIdsFromRating } });
  }

  return {
    status: "active",
    isPrivate: false,
    vendor: { status: "approved" },
    ...(and.length > 0 && { AND: and }),
  };
}

export function scoreProductRelevance(product: SearchableProduct, query: string): number {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return 0;

  const name = normalizeSearchText(product.name);
  const description = normalizeSearchText(product.description || "");
  const brand = normalizeSearchText(product.brand || "");
  const category = normalizeSearchText(product.category?.name || "");
  const vendor = normalizeSearchText(product.vendor?.storeName || "");
  const identifierQuery = normalizePartNumber(query);
  const oem = normalizePartNumber(product.oemNumber || "");
  const partNumber = normalizePartNumber(product.partNumber || "");
  let score = 0;

  if (identifierQuery.length >= 4) {
    if (identifierQuery === oem || identifierQuery === partNumber) score += 200;
    else if (oem.includes(identifierQuery) || partNumber.includes(identifierQuery)) score += 120;
  }

  if (name === normalizedQuery) score += 100;
  else if (name.startsWith(normalizedQuery)) score += 70;
  else if (name.includes(normalizedQuery)) score += 55;

  if (brand === normalizedQuery) score += 40;
  if (category === normalizedQuery) score += 30;

  const concepts = expandEgyptianSearchTerms(query).map(normalizeSearchText).filter(Boolean);
  const baseTokens = searchTokens(query);

  for (const term of concepts) {
    if (name.includes(term)) score += 14;
    else if (brand.includes(term)) score += 10;
    else if (category.includes(term)) score += 8;
    else if (vendor.includes(term)) score += 4;
    else if (description.includes(term)) score += 2;
  }

  const coveredTokens = baseTokens.filter((token) =>
    [name, brand, category, description, vendor].some((field) => field.includes(token)),
  ).length;
  if (baseTokens.length > 0 && coveredTokens === baseTokens.length) score += 35;
  else score += coveredTokens * 4;

  if ((product.stockQuantity || 0) > 0) score += 2;
  return score;
}
