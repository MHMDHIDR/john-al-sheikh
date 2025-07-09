export interface OgImageParams {
  title: string;
  testId?: string;
  image?: string; // filename relative to public folder
  band?: string; // For test results
  username?: string; // For test results
}

/**
 * Generates a URL for dynamic OG image generation
 * @param params - Configuration for the OG image
 * @returns Complete URL for the OG image endpoint
 */
export function getOgImageUrl({ title, testId, image, band, username }: OgImageParams): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.john-al-shiekh.live";
  const endpoint = `${baseUrl}/api/og`;
  const ogTitle = decodeURIComponent(title.trim());

  const params = new URLSearchParams({
    title: ogTitle,
  });

  if (testId?.trim()) {
    params.append("testId", testId);
  }

  if (image?.trim()) {
    params.append("image", image.trim());
  }

  if (band?.trim()) {
    params.append("band", band.trim());
  }

  if (username?.trim()) {
    params.append("username", username.trim());
  }

  return `${endpoint}?${params.toString()}`;
}

/**
 * Utility to truncate text for better OG image display
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

/**
 * Generate metadata object with OG image for Next.js generateMetadata
 */
export function generateOgMetadata({
  title,
  description,
  ogImageParams,
}: {
  title: string;
  description: string;
  ogImageParams: OgImageParams;
}) {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: getOgImageUrl(ogImageParams),
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [getOgImageUrl(ogImageParams)],
    },
  };
}
