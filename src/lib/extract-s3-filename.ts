/**
 * Extracts the S3 file key from a full S3 URL
 * @param url The full S3 URL (e.g., https://s3.eu-central-1.amazonaws.com/bucket-name/path/to/file)
 * @returns The file key (e.g., path/to/file) or null if parsing fails
 */
export function extractS3FileName(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    // Remove the leading slash from pathname and skip the bucket name
    const pathParts = parsedUrl.pathname.slice(1).split("/");
    // Join all parts after the bucket name to get the file key
    const fileKey = pathParts.slice(1).join("/");
    const decodedKey = decodeURI(fileKey); //doing this because if the key has spaces and we need to remove the %20
    return decodedKey || null;
  } catch (error) {
    console.error("Failed to parse S3 URL:", error);
    return null;
  }
}
