/**
 * Slug Generator
 * ─────────────────────────────────────
 * ينشئ slug آمن للـ URL من نص عربي أو إنجليزي.
 * لو الـ slug اتكرر (في نفس الـ vendor مثلاً)، بيضيف suffix عشوائي.
 */

/**
 * يحوّل نص لـ URL-safe slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u0600-\u06FF-]/g, "") // يسمح بالعربي والإنجليزي
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 190); // يسيب مساحة لـ suffix لو احتاج
}

/**
 * يضيف suffix عشوائي (4 حروف) لو الـ slug مكرر
 */
export function appendSlugSuffix(slug: string): string {
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${slug}-${suffix}`;
}
