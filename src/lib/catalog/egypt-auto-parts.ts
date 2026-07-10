import { normalizeSearchText, searchTokens } from "@/lib/search/normalize";

export interface EgyptMarketCategory {
  slug: string;
  name: string;
  aliases: string[];
  priority: number;
}

// Ordered for the Egyptian aftermarket: maintenance and fast-moving replacement parts first.
export const EGYPT_MARKET_CATEGORIES: EgyptMarketCategory[] = [
  {
    slug: "tires-wheels",
    name: "الإطارات والجنوط",
    aliases: ["كاوتش", "إطار", "اطار", "إطارات", "جنوط", "جنط", "tire", "tyre", "wheel"],
    priority: 110,
  },
  {
    slug: "filters",
    name: "الفلاتر",
    aliases: ["فلتر زيت", "فلتر هواء", "فلتر بنزين", "فلتر تكييف", "فلتر سولار"],
    priority: 100,
  },
  {
    slug: "oils-fluids",
    name: "الزيوت والسوائل",
    aliases: ["زيت موتور", "زيت محرك", "زيت فتيس", "atf", "cvt", "مياه ردياتير", "سائل تبريد", "زيت فرامل", "زيت باور"],
    priority: 95,
  },
  {
    slug: "brake-systems",
    name: "أنظمة الفرامل",
    aliases: ["تيل فرامل", "فحمات", "طنابير", "ديسكات فرامل", "ماستر فرامل", "سلك فرامل"],
    priority: 92,
  },
  {
    slug: "batteries",
    name: "البطاريات",
    aliases: ["بطارية", "بطاريات", "امبير", "دين بطارية"],
    priority: 90,
  },
  {
    slug: "suspension-steering",
    name: "التعليق والتوجيه",
    aliases: ["مساعدين", "ممتص صدمات", "مقص", "مقصات", "بيضة مقص", "تيش", "بارات", "اسكاترا", "علبة دركسيون", "كوبلن"],
    priority: 88,
  },
  {
    slug: "engine-parts",
    name: "أجزاء المحرك ونقل الحركة",
    aliases: ["بوجيه", "بوجيهات", "سير كاتينة", "سير مجموعة", "شداد", "طرمبة زيت", "طرمبة بنزين", "قواعد موتور", "دبرياج", "اسطوانة", "ديسك", "بلية"],
    priority: 86,
  },
  {
    slug: "cooling-ac",
    name: "التبريد والتكييف",
    aliases: ["ردياتير", "رادياتير", "سربنتينة", "كمبروسر", "كومبريسور", "ثرموستات", "مروحة تبريد", "طرمبة مياه"],
    priority: 84,
  },
  {
    slug: "lighting-electrical",
    name: "الإضاءة والكهرباء",
    aliases: ["فانوس", "كشاف", "لمبة", "led", "زينون", "دينامو", "مارش", "موبينة", "حساس", "فيوز"],
    priority: 82,
  },
  {
    slug: "body-accessories",
    name: "الهيكل والإكسسوارات",
    aliases: ["اكصدام", "أكصدام", "صدام", "رفرف", "كبوت", "شنطة", "مراية", "شبكة", "اكسسوار", "فرش", "دواسة"],
    priority: 70,
  },
];

export const EGYPTIAN_SEARCH_SYNONYMS: string[][] = [
  ["تيل", "فحمات", "brake pads", "brake pad"],
  ["طنابير", "طنبورة", "ديسكات فرامل", "brake disc", "brake rotor"],
  ["مساعدين", "مساعد", "ممتص صدمات", "shock absorber"],
  ["بوجيهات", "بوجيه", "شمعات احتراق", "spark plugs", "spark plug"],
  ["ردياتير", "رادياتير", "radiator"],
  ["كمبروسر", "كومبريسور", "compressor"],
  ["اكصدام", "أكصدام", "صدام", "bumper"],
  ["سير كاتينة", "كاتينة", "timing belt"],
  ["سير مجموعة", "سير دينامو", "drive belt", "serpentine belt"],
  ["طرمبة بنزين", "طلمبة بنزين", "fuel pump"],
  ["طرمبة مياه", "طلمبة مياه", "water pump"],
  ["مقص", "مقصات", "control arm"],
  ["كوبلن", "cv joint"],
  ["مارش", "starter motor", "starter"],
  ["دينامو", "alternator"],
  ["فتيس", "ناقل حركة", "gearbox", "transmission"],
];

export function expandEgyptianSearchTerms(query: string): string[] {
  const normalizedQuery = normalizeSearchText(query);
  const terms = new Set<string>([query.trim(), ...searchTokens(query)]);

  for (const group of EGYPTIAN_SEARCH_SYNONYMS) {
    if (group.some((term) => normalizedQuery.includes(normalizeSearchText(term)))) {
      group.forEach((term) => terms.add(term));
    }
  }

  return [...terms].filter(Boolean).slice(0, 30);
}

export function recommendCategorySlug(productName: string): string | null {
  const normalizedName = normalizeSearchText(productName);
  if (!normalizedName) return null;

  const ranked = EGYPT_MARKET_CATEGORIES.map((category) => {
    const hits = category.aliases.reduce((score, alias) => {
      const normalizedAlias = normalizeSearchText(alias);
      return score + (normalizedName.includes(normalizedAlias) ? normalizedAlias.split(" ").length * 10 : 0);
    }, 0);
    return { category, score: hits + (hits > 0 ? category.priority / 100 : 0) };
  }).sort((a, b) => b.score - a.score);

  return ranked[0]?.score > 0 ? ranked[0].category.slug : null;
}
