/**
 * Converts an image file to base64 with special handling for mobile devices
 */
export async function convertImageToBase64(file: File) {
  if (!file) return null;

  try {
    // Check if the file is an image
    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files are supported");
    }

    // Convert file to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      // Add timeout for mobile browsers that might hang
      const timeout = setTimeout(() => {
        reader.abort();
        reject(new Error("File reading timed out"));
      }, 10000); // 10 second timeout

      reader.onload = () => {
        clearTimeout(timeout);
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("FileReader did not return a string"));
        }
      };

      reader.onerror = error => {
        clearTimeout(timeout);
        reject(error as unknown as Error);
      };

      reader.readAsDataURL(file);
    });

    // Verify we have a proper data URL
    if (!base64.startsWith("data:image/")) {
      throw new Error("Invalid image data URL");
    }

    // Prepare file data for S3 upload
    const fileData = [
      {
        name: file.name.replace(/\.[^.]+$/, ".webp"),
        type: "image/webp",
        size: base64.length,
        lastModified: file.lastModified,
        base64,
      },
    ];

    return { base64, fileData };
  } catch (error) {
    console.error("Error converting image to base64:", error);
    throw error;
  }
}
