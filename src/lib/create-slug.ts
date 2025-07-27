/** A function to create a slug
 * making the text from (this is text) => (this-is-text)
 * @param txt the text to be converted to slug
 * @returns the slug
 */
export function createSlug(txt: string) {
  return txt
    .replace(/[^A-Za-z0-9أ-ي -]/g, "") // remove invalid chars
    .replace(/\s+/g, "-") // collapse whitespace and replace by -
    .replace(/-+/g, "-") // collapse dashes replace with one dash
    .toLowerCase(); //
}

/**
 * Clean Arabic text by removing diacritics and special characters
 * @param text the Arabic text to clean
 * @returns cleaned Arabic text
 */
export function cleanArabicText(text: string): string {
  return (
    text
      // Remove Arabic diacritics (التشكيل)
      .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
      // Remove Arabic tatweel (التطويل)
      .replace(/\u0640/g, "")
      // Remove punctuation marks
      .replace(/[؟،؛:""'']/g, "")
      // Remove other special characters but keep Arabic letters, numbers, and spaces
      .replace(
        /[^\u0621-\u06FF\u0750-\u077F\u0590-\u05FF\u200C\u200D\u202A-\u202E\u2066-\u2069A-Za-z0-9\s-]/g,
        "",
      )
      // Clean up extra spaces
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * Create a slug specifically for Arabic text
 * @param text the Arabic text to convert to slug
 * @returns the Arabic slug
 */
export function createArabicSlug(text: string): string {
  return cleanArabicText(text)
    .replace(/\s+/g, "-") // replace spaces with dashes
    .replace(/-+/g, "-") // collapse multiple dashes
    .replace(/^-+|-+$/g, "") // remove leading/trailing dashes
    .toLowerCase();
}

/**
 * Unslugify a slug, making the text from (this-is-text) => (this is text)
 * @param slug the slug to unslugify
 * @returns the unslugified text
 */
export function unslugifyArabic(slug: string) {
  const decodedSlug = decodeURIComponent(slug);
  return decodedSlug.replace(/-/g, " ");
}
