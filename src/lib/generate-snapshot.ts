import { env } from "@/env";

type GenerateMetadataImageOptions = {
  username: string;
  displayName?: string | null;
  band: number;
  testId: string;
};

export function generateMetadataImage(options: GenerateMetadataImageOptions): string {
  const { username, displayName, band } = options;
  const name = displayName ?? username;
  const imageUrl = new URL(`${env.NEXT_PUBLIC_APP_URL}/api/og`);

  imageUrl.searchParams.set("title", `${name} - اختبار المحادثة`);
  imageUrl.searchParams.set("band", band.toString());
  imageUrl.searchParams.set("username", username);

  return imageUrl.toString();
}
