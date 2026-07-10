import assert from "node:assert/strict";
import test from "node:test";

import { recommendCategorySlug } from "../src/lib/catalog/egypt-auto-parts";
import { normalizePartNumber, normalizeSearchText } from "../src/lib/search/normalize";
import { buildProductWhere, inferVehicleFilters, scoreProductRelevance } from "../src/lib/search/product-search";
import { createProductSchema } from "../src/lib/validations/product";

test("normalizes common Arabic spelling variants", () => {
  assert.equal(normalizeSearchText("أكصدام أمامي"), normalizeSearchText("اكصدام امامي"));
});

test("normalizes OEM separators", () => {
  assert.equal(normalizePartNumber("90915-YZZD2"), normalizePartNumber("90915 yzzd2"));
});

test("recommends Egyptian aftermarket categories", () => {
  assert.equal(recommendCategorySlug("تيل فرامل أمامي بوش"), "brake-systems");
  assert.equal(recommendCategorySlug("فلتر زيت تويوتا"), "filters");
  assert.equal(recommendCategorySlug("بطارية 70 أمبير"), "batteries");
  assert.equal(recommendCategorySlug("كاوتش 16 بوصة"), "tires-wheels");
});

test("exact OEM matches outrank descriptive matches", () => {
  const exact = scoreProductRelevance(
    { name: "فلتر زيت أصلي", oemNumber: "90915-YZZD2", stockQuantity: 3 },
    "90915 yzzd2",
  );
  const descriptive = scoreProductRelevance(
    { name: "فلتر زيت بديل", description: "بديل لعدد من سيارات تويوتا", stockQuantity: 3 },
    "90915 yzzd2",
  );
  assert.ok(exact > descriptive);
});

test("Egyptian synonyms improve relevance", () => {
  const pads = scoreProductRelevance({ name: "فحمات أمامية بوش" }, "تيل فرامل بوش");
  const oil = scoreProductRelevance({ name: "زيت محرك بوش" }, "تيل فرامل بوش");
  assert.ok(pads > oil);
});

test("combines search and filters without overwriting conditions", () => {
  const where = buildProductWhere({
    search: "فلتر زيت",
    categoryId: "11111111-1111-1111-1111-111111111111",
    inStock: "true",
  });
  assert.ok(Array.isArray(where.AND));
  assert.equal((where.AND as unknown[]).length, 3);
});

test("requires a category when a vendor creates a product", () => {
  const result = createProductSchema.safeParse({
    name: "فلتر زيت أصلي",
    price: 150,
    stockQuantity: 4,
  });
  assert.equal(result.success, false);
});

test("infers a strict vehicle model and year from a natural query", () => {
  const result = inferVehicleFilters("تيل فرامل تويوتا كورولا 2020", [
    { id: "toyota", name: "Toyota", models: [{ id: "corolla", name: "Corolla" }, { id: "camry", name: "Camry" }] },
  ]);
  assert.equal(result.vehicleMakeId, "toyota");
  assert.equal(result.vehicleModelId, "corolla");
  assert.equal(result.year, 2020);
});
