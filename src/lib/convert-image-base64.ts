export async function convertImageToBase64(file: File) {
  if (!file) return null;

  // Convert file to base64
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

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
}
