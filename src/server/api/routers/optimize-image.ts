import sharp from "sharp";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const optimizeImageRouter = createTRPCRouter({
  optimizeImage: protectedProcedure
    .input(z.object({ base64: z.string(), quality: z.number() }))
    .mutation(async ({ input }) => {
      const { base64, quality } = input;

      const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      const optimizedBuffer = await sharp(buffer).rotate().webp({ quality }).toBuffer();

      return `data:image/webp;base64,${optimizedBuffer.toString("base64")}`;
    }),

  getBlurPlaceholder: protectedProcedure
    .input(z.object({ imageSrc: z.string() }))
    .mutation(async ({ input }) => {
      const response = await fetch(input.imageSrc);
      if (response.status !== 200) return null;

      const buffer = await response.arrayBuffer();
      const { data, info } = await sharp(buffer)
        .rotate()
        .resize(10, 10, { fit: "inside" })
        .toBuffer({ resolveWithObject: true });

      const base64 = `data:image/${info.format};base64,${data.toString("base64")}`;
      return base64;
    }),
});
