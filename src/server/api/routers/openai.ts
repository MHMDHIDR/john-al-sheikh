import fs from "fs";
import path from "path";
import { TRPCError } from "@trpc/server";
import OpenAI from "openai";
import { z } from "zod";
import { env } from "@/env";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

type IELTSFeedback = {
  band: number;
  strengths: {
    summary: string;
    points: string[];
  };
  areasToImprove: {
    errors: Array<{
      mistake: string;
      correction: string;
    }>;
  };
  improvementTips: string[];
};

export const openaiRouter = createTRPCRouter({
  transcribeAudio: publicProcedure
    .input(
      z.object({
        audioBase64: z.string().min(100, "Audio data is too short or empty"),
        fileType: z.string().default("audio/webm"),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        // Check for empty audio data
        const base64Data = input.audioBase64.split(",")[1];
        if (!base64Data || base64Data.length < 50) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Audio data is empty or too short",
          });
        }

        // Convert base64 to buffer
        const buffer = Buffer.from(base64Data, "base64");

        // Create temp directory if it doesn't exist
        const tempDir = path.join(process.cwd(), "tmp");
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        // Save buffer to temp file
        const tempFilePath = path.join(tempDir, `audio-${Date.now()}.webm`);
        fs.writeFileSync(tempFilePath, buffer);

        try {
          console.log("Sending file to OpenAI, size:", buffer.length, "bytes");

          // Use OpenAI SDK to transcribe the audio file
          const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(tempFilePath),
            model: "gpt-4o-transcribe",
            language: "en",
          });

          // Clean up the temp file
          fs.unlinkSync(tempFilePath);

          return {
            success: true,
            text: transcription.text || "",
          };
        } finally {
          // Make sure we clean up in case of error
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }
        }
      } catch (error) {
        console.error("Transcription error:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to transcribe audio",
        });
      }
    }),

  analyzeIELTSSpeaking: publicProcedure
    .input(
      z.object({
        transcription: z.string(),
        prompt: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: `أنت مقيم معتمد لاختبار المحادثة IELTS. قم بتقييم إجابة المتقدم على الموضوع التالي:
              "${input.prompt}"

              قم بتحليل الإجابة وتقديم تقييم مفصل يتضمن:
              1. نطاق (band) IELTS من 1 إلى 9 (يمكن استخدام 0.5 مثل 6.5)
              2. نقاط القوة (ملخص عام و 3 نقاط محددة)
              3. مجالات تحتاج إلى تحسين (خطأين مع تصحيحهما)
              4. 4 نصائح للتحسين

              قيّم المتحدث بناءً على معايير IELTS الرسمية:
              - الطلاقة والتماسك
              - المفردات
              - القواعد النحوية
              - النطق

              ملاحظة مهمة: نظراً لقصر مدة التسجيل (15 ثانية فقط)، يرجى مراعاة ذلك في تقييمك.

              قدم التقييم باللغة العربية.`,
            },
            {
              role: "user",
              content: input.transcription,
            },
          ],
          temperature: 0.7,
        });

        const analysisText = response.choices[0]?.message.content || "";

        // Parse the response from OpenAI to extract structured feedback

        let band = 0;
        const bandMatch = analysisText.match(/نطاق\s*(?:\(?band\)?)?[:\s]+(\d+\.?\d*)/i);
        if (bandMatch && bandMatch[1]) {
          band = parseFloat(bandMatch[1]);
        }

        // Extract strengths summary (first paragraph after "نقاط القوة")
        let strengthsSummary = "";
        const strengthsMatch = analysisText.match(
          /نقاط القوة[:\s]+([\s\S]+?)(?=\n\s*-|\n\s*\d+\.|\n\s*مجالات)/i,
        );
        if (strengthsMatch && strengthsMatch[1]) {
          strengthsSummary = strengthsMatch[1].trim();
        }

        // Extract strength points (bullet points after strengths summary)
        const strengthPoints: string[] = [];
        const strengthPointsMatch = analysisText.match(/نقاط القوة[\s\S]+?((?:-[^\n]+\n?)+)/i);
        if (strengthPointsMatch && strengthPointsMatch[1]) {
          const points = strengthPointsMatch[1].match(/-([^\n]+)/g);
          if (points) {
            points.forEach((point: string) => {
              strengthPoints.push(point.replace(/^-\s*/, "").trim());
            });
          }
        }

        // Extract areas to improve
        const areasToImprove: { mistake: string; correction: string }[] = [];
        const improvementMatch = analysisText.match(
          /مجالات[^:]*التحسين[:\s]+([\s\S]+?)(?=\n\s*نصائح|\n\s*\d+\.|\n\s*$)/i,
        );

        if (improvementMatch && improvementMatch[1]) {
          const improvementText = improvementMatch[1];
          const mistakeMatches = improvementText.match(/[✗×]([^\n]+)/g);
          const correctionMatches = improvementText.match(/[✓]([^\n]+)/g);

          if (mistakeMatches && correctionMatches) {
            const len = Math.min(mistakeMatches.length, correctionMatches.length);
            for (let i = 0; i < len; i++) {
              const mistake = mistakeMatches[i];
              const correction = correctionMatches[i];

              if (mistake && correction) {
                areasToImprove.push({
                  mistake: mistake.replace(/^[✗×]\s*/, "").trim(),
                  correction: correction.replace(/^[✓]\s*/, "").trim(),
                });
              }
            }
          }
        }

        // Extract improvement tips
        const improvementTips: string[] = [];
        const tipsMatch = analysisText.match(/نصائح[^:]*تحسين[:\s]+([\s\S]+)/i);
        if (tipsMatch && tipsMatch[1]) {
          const tipsText = tipsMatch[1];
          const tips = tipsText.match(/(?:-|\d+\.)\s*([^\n]+)/g);
          if (tips) {
            tips.forEach((tip: string) => {
              improvementTips.push(tip.replace(/^(?:-|\d+\.)\s*/, "").trim());
            });
          }
        }

        const feedback: IELTSFeedback = {
          band,
          strengths: {
            summary: strengthsSummary,
            points: strengthPoints.slice(0, 3), // Limit to 3 points
          },
          areasToImprove: {
            errors: areasToImprove.slice(0, 2), // Limit to 2 errors
          },
          improvementTips: improvementTips.slice(0, 4), // Limit to 4 tips
        };

        return {
          success: true,
          feedback,
          rawAnalysis: analysisText,
        };
      } catch (error) {
        console.error("Analysis error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "فشل في تحليل الإجابة",
        };
      }
    }),
});
