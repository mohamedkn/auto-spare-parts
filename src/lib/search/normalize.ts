const ARABIC_DIACRITICS = /[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/g;
const NON_ALPHANUMERIC = /[^a-z0-9\u0621-\u064a]+/gi;

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("ar")
    .replace(ARABIC_DIACRITICS, "")
    .replace(/ـ/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(NON_ALPHANUMERIC, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizePartNumber(value: string): string {
  return value.normalize("NFKC").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function searchTokens(value: string): string[] {
  return [...new Set(normalizeSearchText(value).split(" ").filter((token) => token.length > 1))];
}
