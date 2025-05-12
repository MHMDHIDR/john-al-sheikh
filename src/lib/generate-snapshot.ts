import fs from "fs";
import path from "path";
import sharp from "sharp";
import { env } from "@/env";

type GenerateMetadataImageOptions = {
  username: string;
  displayName?: string | null;
  band: number;
  testId: string;
};

export async function generateMetadataImage(
  options: GenerateMetadataImageOptions,
): Promise<string> {
  const { username, displayName, band, testId } = options;
  const name = displayName ?? username;

  // Decode URL-encoded characters
  const decodedUsername = decodeURIComponent(username);
  const decodedName = name ? decodeURIComponent(name) : decodedUsername;

  // Create directory for storing generated images if it doesn't exist
  const publicDir = path.join(process.cwd(), "public");
  const ogDir = path.join(publicDir, "og");

  if (!fs.existsSync(ogDir)) {
    fs.mkdirSync(ogDir, { recursive: true });
  }

  // Generate a unique filename
  const fileName = `og-${username}-${testId}.png`;
  const filePath = path.join(ogDir, fileName);
  const publicPath = `/og/${fileName}`;

  // Check if file already exists to avoid regeneration
  if (fs.existsSync(filePath)) {
    return `${env.NEXT_PUBLIC_APP_URL}${publicPath}`;
  }

  // Define badge color based on band score
  const badgeColor = band >= 6 ? "#10b981" : "#6366f1";

  // Create SVG template
  const svgTemplate = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="white"/>
      <rect x="40" y="40" width="1120" height="550" rx="15" fill="white" stroke="${badgeColor}" stroke-width="8"/>

      <text x="600" y="140" font-family="Arial, sans-serif" font-size="48" text-anchor="middle" font-weight="bold">${decodedName.trim()} - اختبار المحادثة</text>
      <text x="600" y="180" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="#64748b">${decodedUsername.trim()}</text>

      <circle cx="600" cy="315" r="100" fill="${badgeColor}"/>
      <text x="600" y="325" font-family="Arial, sans-serif" font-size="80" text-anchor="middle" fill="white" font-weight="bold">${band}</text>
      <text x="600" y="375" font-family="Arial, sans-serif" font-size="30" text-anchor="middle" fill="white">Band</text>

      <text x="600" y="520" font-family="Arial, sans-serif" font-size="36" text-anchor="middle" font-weight="bold">🎉 تهانينا على إكمال الاختبار في منصة ${env.NEXT_PUBLIC_APP_NAME} 🎉</text>
    </svg>
  `;

  // Generate PNG from SVG template
  await sharp(Buffer.from(svgTemplate)).png().toFile(filePath);

  return `${env.NEXT_PUBLIC_APP_URL}${publicPath}`;
}
