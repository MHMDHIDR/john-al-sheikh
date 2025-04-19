/**
 * Check if the text is actual English speech
 * @param text - The text to check
 * @returns - The cleaned text if valid, otherwise an empty string
 */
export function isActualEnglishSpeech(text: string): { isValid: boolean; cleanText: string } {
  // Split into words
  const words = text
    .toLowerCase()
    // Split on any non-letter character
    .split(/[^a-z]+/)
    .filter(word => {
      // Only accept words that:
      // 1. Are at least 2 letters
      // 2. Are actual English words (not transcription artifacts)
      // 3. Are not common "hallucinated" instructions
      const commonHallucinations = new Set([
        "translate",
        "transcribe",
        "speech",
        "only",
        "english",
        "language",
        "languages",
        "audio",
        "from",
        "other",
        "please",
        "thank",
        "you",
        "hello",
        "hi",
        "hey",
        "the",
        "this",
        "that",
        "these",
        "those",
        "there",
        "here",
        "where",
        "what",
        "when",
        "who",
        "why",
        "how",
        "do",
        "does",
        "did",
        "done",
        "am",
        "is",
        "are",
        "was",
        "were",
        "be",
        "been",
        "being",
        "have",
        "has",
        "had",
        "having",
        "can",
        "could",
        "will",
        "would",
        "shall",
        "should",
        "may",
        "might",
        "must",
        "ought",
      ]);

      return (
        word.length >= 2 &&
        !commonHallucinations.has(word) &&
        // Only accept words that contain English vowels (to filter out non-English sounds)
        /[aeiou]/.test(word)
      );
    });

  // We need at least 5 valid English content words
  const isValid = words.length >= 5;

  // Return the cleaned text only if valid
  return {
    isValid,
    // Reconstruct the original text but only with valid words
    cleanText: isValid ? words.join(" ") : "",
  };
}
