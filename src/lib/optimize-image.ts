"use server";

import sharp from "sharp";
import { env } from "@/env";

/**
 * Get the blur placeholder of an image, used for lazy loading
 * @param imageSrc The source of the image
 * @returns The blur placeholder of the image
 */
export async function getBlurPlaceholder(
  imageSrc: string,
  width = 10,
  height = 10,
): Promise<string | null> {
  const imageUrl = await getFullUrl(imageSrc);
  const response = await fetch(imageUrl);
  if (response.status !== 200) return null;

  const buffer = await response.arrayBuffer();
  const { data, info } = await sharp(buffer)
    .resize(width, height, { fit: "inside" })
    .toBuffer({ resolveWithObject: true });

  const base64 = `data:image/${info.format};base64,${data.toString("base64")}`;
  return base64;
}

export async function getFullUrl(path: string) {
  if (path.startsWith("http")) return path;

  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return new URL(cleanPath, env.NEXT_PUBLIC_APP_URL).toString();
}
