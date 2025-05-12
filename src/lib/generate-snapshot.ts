import { env } from "@/env";

type GenerateMetadataImageOptions = {
  username: string;
  displayName?: string | null;
  band: number;
  testId: string;
};

export function generateMetadataImage(options: GenerateMetadataImageOptions): string {
  const { username, displayName, band, testId } = options;
  const name = displayName ?? username;

  // Create OG Image URL using Vercel's Image Generation API
  const ogImageUrl = new URL(`${env.NEXT_PUBLIC_APP_URL}/api/og`);

  // Add parameters to the URL
  ogImageUrl.searchParams.set("name", encodeURIComponent(name));
  ogImageUrl.searchParams.set("username", encodeURIComponent(username));
  ogImageUrl.searchParams.set("band", band.toString());
  ogImageUrl.searchParams.set("testId", testId);

  return ogImageUrl.toString();
}
