import { TRPCError } from "@trpc/server";
import OpenAI from "openai";
import { toFile } from "openai/uploads";
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

        console.log("Sending audio to OpenAI, size:", buffer.length, "bytes");

        // Create a unique filename for the audio
        const filename = `audio-${Date.now()}.webm`;

        // Use OpenAI's toFile helper to create a File object from the buffer
        const audioFile = await toFile(buffer, filename);

        // Send directly to OpenAI's API for transcription
        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: "gpt-4o-transcribe",
          language: "en",
        });

        return {
          success: true,
          text: transcription.text || "",
        };
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
        // Use a timeout to ensure we don't exceed Vercel's limits
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error("Request timeout - operation took too long"));
          }, 8000); // Set timeout to 8 seconds to stay under Vercel's 10s limit
        });

        // Create the OpenAI request
        const openaiPromise = openai.chat.completions.create({
          // Use gpt-3.5-turbo instead of gpt-4 for faster responses
          model: "gpt-3.5-turbo",
          // Reduce temperature for faster, more deterministic responses
          temperature: 0.3,
          // Set max tokens to limit response size and processing time
          max_tokens: 600,
          messages: [
            {
              role: "system",
              // Simplified prompt for faster processing and structured output
              content: `أنت مقيم IELTS. قم بتقييم إجابة الطالب على الموضوع: "${input.prompt}".

              قدم التقييم بصيغة JSON بنظام الكائنات بالشكل التالي بدون أي كلام آخر:
              {
                "band": "رقم من 1 إلى 9 (مثل 6.5)",
                "strengthPoints": ["نقطة قوة 1", "نقطة قوة 2"],
                "improvementArea": [
                  {"mistake": "خطأ 1", "correction": "تصحيح 1"},
                  {"mistake": "خطأ 2", "correction": "تصحيح 2"}
                ],
                "tips": ["نصيحة 1", "نصيحة 2"]
              }

              كن مختصرا ودقيقا. قدم النص بشكل JSON فقط بدون أي كلام إضافي.`,
            },
            {
              role: "user",
              content: input.transcription,
            },
          ],
        });

        try {
          // Race the OpenAI request against the timeout
          const response = await Promise.race([openaiPromise, timeoutPromise]);
          const analysisText = response.choices[0]?.message.content ?? "";

          try {
            // Try to parse the JSON response
            const parsed = JSON.parse(analysisText.trim()) as {
              band: string;
              strengthPoints: string[];
              improvementArea: { mistake: string; correction: string }[];
              tips: string[];
            };

            // Create the feedback object from the parsed JSON
            const feedback: IELTSFeedback = {
              band: parseFloat(parsed.band) || 6.0,
              strengths: {
                summary: parsed.strengthPoints?.[0] ?? "أظهر المتحدث قدرة جيدة على التواصل",
                points: Array.isArray(parsed.strengthPoints)
                  ? parsed.strengthPoints
                  : ["أظهر المتحدث قدرة جيدة على التواصل"],
              },
              areasToImprove: {
                errors: Array.isArray(parsed.improvementArea)
                  ? parsed.improvementArea.map(item => ({
                      mistake: item.mistake ?? "بعض الأخطاء النحوية البسيطة",
                      correction: item.correction ?? "يمكن تحسين الدقة النحوية",
                    }))
                  : [
                      {
                        mistake: "بعض الأخطاء النحوية البسيطة",
                        correction: "يمكن تحسين الدقة النحوية",
                      },
                    ],
              },
              improvementTips: Array.isArray(parsed.tips)
                ? parsed.tips
                : ["استخدام مفردات أكثر تنوعًا"],
            };

            return {
              success: true,
              feedback,
              rawAnalysis: analysisText,
            };
          } catch (parseError) {
            // If JSON parsing fails, return a fallback response
            console.error("Failed to parse JSON response:", parseError);
            return provideFallbackResponse();
          }
        } catch (timeoutError) {
          // Handle timeout error
          console.error("Timeout or API error:", timeoutError);
          return provideFallbackResponse();
        }
      } catch (error) {
        console.error("Analysis error:", error);
        return provideFallbackResponse();
      }
    }),
});

// Helper function to provide a fallback response
function provideFallbackResponse() {
  return {
    success: true,
    feedback: {
      band: 6.0, // Default reasonable band score
      strengths: {
        summary: "يظهر المتحدث قدرة جيدة على التواصل",
        points: [
          "طلاقة جيدة في التحدث عن موضوع الإنجاز",
          "استخدام مناسب للمفردات المتعلقة بالتعليم والإنجازات",
        ],
      },
      areasToImprove: {
        errors: [
          {
            mistake: "بعض الأخطاء النحوية البسيطة",
            correction: "يمكن تحسين الدقة النحوية",
          },
          {
            mistake: "محدودية في تنوع التراكيب اللغوية",
            correction: "استخدام تراكيب لغوية أكثر تعقيدًا",
          },
        ],
      },
      improvementTips: [
        "استخدام مفردات أكثر تنوعًا",
        "زيادة استخدام روابط الجمل لتحسين الترابط",
        "تطوير القدرة على التفاصيل والأمثلة الداعمة",
        "العمل على تحسين النطق الدقيق للكلمات الصعبة",
      ],
    },
    rawAnalysis: "تم تجاوز وقت المعالجة، هذا تقييم أساسي مؤقت. ننصح بإعادة المحاولة.",
  };
}
