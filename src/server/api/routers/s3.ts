import crypto from "crypto";
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import { env } from "@/env";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

// Define the FileData schema using Zod
const FileDataSchema = z.object({
  name: z.string(),
  type: z.string(),
  size: z.number(),
  lastModified: z.number(),
  base64: z.string(),
});

// Define the input schema for the procedure
const UploadInputSchema = z.object({
  entityId: z.string(),
  fileData: z.array(FileDataSchema),
});

const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: { accessKeyId: env.AWS_ACCESS_ID, secretAccessKey: env.AWS_SECRET },
});

function generateUniqueFileName(entityId: string, fileName: string): string {
  const uniqueSuffix = crypto.randomBytes(8).toString("hex");
  return `${entityId}/${uniqueSuffix}-${fileName}`;
}

export const S3Router = createTRPCRouter({
  uploadFiles: protectedProcedure.input(UploadInputSchema).mutation(async ({ input }) => {
    const { entityId, fileData } = input;

    const presignedUrls = await Promise.all(
      fileData.map(async file => {
        const uniqueFileName = generateUniqueFileName(entityId, file.name);

        // if entityId includes user-avatar/ then delete the files with the same entityId (previous avatar)
        if (entityId.includes("user-avatar/")) {
          const listObjectsParams = {
            Bucket: env.AWS_BUCKET_NAME,
            Prefix: entityId,
          };
          const listCommand = new ListObjectsCommand(listObjectsParams);
          const { Contents } = await s3Client.send(listCommand);

          if (Contents) {
            const deleteObjectsParams = {
              Bucket: env.AWS_BUCKET_NAME,
              Delete: { Objects: Contents.map(({ Key }) => ({ Key })) },
            };
            const deleteCommand = new DeleteObjectsCommand(deleteObjectsParams);
            await s3Client.send(deleteCommand);
          }
        }

        const putObjectParams = {
          Bucket: env.AWS_BUCKET_NAME,
          Key: uniqueFileName,
          ContentType: file.type,
        };

        const putCommand = new PutObjectCommand(putObjectParams);
        const presignedUrl = await getSignedUrl(s3Client, putCommand, { expiresIn: 3600 });

        return { presignedUrl, fileName: uniqueFileName };
      }),
    );

    const uploadPromises = presignedUrls.map(async ({ fileName, presignedUrl }, index) => {
      // Ensure fileData[index] is defined before accessing its properties
      const file = fileData[index];
      if (!file) {
        throw new Error(`File data for index ${index} is undefined`);
      }

      // Decode the base64 string to binary data
      const base64Data = file.base64.split(",")[1];
      if (!base64Data) {
        throw new Error(`Base64 data for file ${file.name} is undefined or invalid`);
      }
      const binaryData = Buffer.from(base64Data, "base64");

      const response = await fetch(presignedUrl, {
        method: "PUT",
        body: binaryData,
        headers: { "Content-Type": file.type },
      });

      if (!response.ok) {
        throw new Error(`Failed to upload ${fileName}`);
      }

      // Generate a GET URL for the uploaded file
      const getObjectParams = {
        Bucket: env.AWS_BUCKET_NAME,
        Key: fileName,
      };
      const getCommand = new GetObjectCommand(getObjectParams);
      const getUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 * 24 * 7 }); // URL valid for 7 days

      // Remove query parameters from the signed URL to get a clean, permanent URL
      const cleanUrl = new URL(getUrl);
      cleanUrl.search = "";

      return cleanUrl.toString();
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    return uploadedUrls;
  }),

  deleteFile: protectedProcedure
    .input(z.object({ fileName: z.string() }))
    .mutation(async ({ input }) => {
      const { fileName } = input;

      const deleteObjectParams = {
        Bucket: env.AWS_BUCKET_NAME,
        Key: fileName,
      };
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: env.AWS_BUCKET_NAME,
        Delete: { Objects: [deleteObjectParams] },
      });
      await s3Client.send(deleteCommand);

      return { success: true };
    }),
});
