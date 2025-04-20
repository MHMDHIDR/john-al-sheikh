import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import OpenAI from "openai";
import { type ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { toFile } from "openai/uploads";
import { z } from "zod";
import { env } from "@/env";
import { isActualEnglishSpeech } from "@/lib/check-is-actual-english-speech";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { speakingTests } from "@/server/db/schema";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const DEFAULT_BAND_SCORE = 4.0;

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

function containsArabicText(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

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
        if (!base64Data || base64Data.length < 1000) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Audio data is too short or empty",
          });
        }

        // Convert base64 to buffer
        const buffer = Buffer.from(base64Data, "base64");

        // Ensure audio is substantial
        if (buffer.length < 10 * 1024) {
          return {
            success: true,
            text: "", // Return empty text for very small audio
          };
        }

        // Create a unique filename for the audio
        const filename = `audio-${Date.now()}.webm`;
        const audioFile = await toFile(buffer, filename);

        // First try to detect if there's any non-English speech
        const initialTranscription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: "whisper-1",
          temperature: 0,
          response_format: "text",
        });

        // If we detect any Arabic text, immediately return empty
        if (containsArabicText(initialTranscription)) {
          return {
            success: true,
            text: "",
          };
        }

        // Now try to transcribe with strict English-only setting
        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: "whisper-1",
          language: "en",
          temperature: 0,
          response_format: "text",
          prompt:
            "Transcribe English speech only. If you hear any non-English speech, return an empty string. Do not translate.",
        });

        // Clean and validate the transcribed text
        const { isValid, cleanText } = isActualEnglishSpeech(transcription.trim());

        // Double-check for any Arabic text in the transcription
        if (containsArabicText(cleanText)) {
          return {
            success: true,
            text: "",
          };
        }

        // Only return text if it contains valid English speech
        return {
          success: true,
          text: isValid ? cleanText : "",
        };
      } catch (error) {
        console.error("Transcription error:", error);
        if (error instanceof TRPCError) throw error;
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
        // Verify we have actual English speech to analyze
        const { isValid, cleanText } = isActualEnglishSpeech(input.transcription);
        if (!isValid) {
          return {
            success: false,
            error: "No valid English speech detected in the recording.",
          };
        }

        // First, validate the content is English and relevant to the prompt
        const validationResponse = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          temperature: 0,
          messages: [
            {
              role: "system",
              content: `You are a content validator for IELTS speaking responses.
              Given a prompt and a response, determine if:
              1. The response is in English
              2. The response is relevant to the prompt
              3. The response contains meaningful content (not just filler words or incomplete thoughts)

              Return a JSON response in this format:
              {
                "isValid": boolean,
                "reason": "explanation if invalid"
              }`,
            },
            {
              role: "user",
              content: `Prompt: "${input.prompt}"
              Response: "${cleanText}"`,
            },
          ],
        });

        const validationResult = JSON.parse(
          validationResponse.choices[0]?.message.content ?? "{}",
        ) as {
          isValid: boolean;
          reason: string;
        };

        if (!validationResult.isValid) {
          return {
            success: false,
            error: "المحتوى غير مرتبط بموضوع المحادثة أو غير مكتمل",
          };
        }

        // Use a timeout to ensure we don't exceed Vercel's limits
        // const timeoutPromise = new Promise<never>((_, reject) => {
        //   setTimeout(() => {
        //     reject(new Error("Request timeout - operation took too long"));
        //   }, 8000); // Set timeout to 8 seconds to stay under Vercel's 10s limit
        // });

        // Create the OpenAI request
        const openaiPromise = openai.chat.completions.create({
          // Use GPT-3.5-turbo for faster responses its cheaper and faster
          model: "gpt-3.5-turbo",
          // Balanced temperature for creative yet consistent responses
          temperature: 0,
          // Set max tokens to allow for detailed feedback
          max_tokens: 800,
          messages: [
            {
              role: "system",
              content: `You are an expert IELTS examiner evaluating a student's speaking response to the topic: "${input.prompt}".

              Analyze the speaking response based on the official IELTS speaking assessment criteria:
              1. Fluency and Coherence
              2. Lexical Resource (vocabulary)
              3. Grammatical Range and Accuracy
              4. Pronunciation

              Provide a detailed assessment and feedback in Arabic language.
              Return your feedback in the following JSON format with no additional text:
              {
                "band": "Give a number from 1 to 9 (like 4.5) representing the overall speaking score, always give a lower band score than the actual score",
                "overallSummary": "A comprehensive analysis (3-4 sentences) explaining why the candidate received this band score, highlighting their overall performance across all criteria",
                "strengthPoints": [
                  "Specific strength point 1 related to a criterion",
                  "Specific strength point 2 related to another criterion"
                ],
                "improvementArea": [
                  {
                    "originalText": "The exact problematic phrase/sentence from the transcript",
                    "mistake": "Description of what's wrong with this specific usage",
                    "correction": "Give the same original text in English, but with a better way to express the same idea with proper grammar/vocabulary/pronunciation"
                  }
                ],
                "tips": [
                  "Specific and practical tip 1",
                  "Specific and practical tip 2"
                ]
              }

              Important Notes:
              1. The overallSummary should be different from strengthPoints, providing a comprehensive analysis
              2. For improvementArea, always quote the exact problematic text from the transcript
              3. Corrections should demonstrate how to better express the same idea

              The response MUST be in Arabic language for all feedback points. Be concise and specific with actionable feedback. Provide only the JSON response with no additional text.`,
            },
            {
              role: "user",
              content: input.transcription,
            },
          ],
        });

        try {
          // Race the OpenAI request against the timeout
          // const response = await Promise.race([openaiPromise, timeoutPromise]);
          const response = await openaiPromise;
          const analysisText = response.choices[0]?.message.content ?? "";

          try {
            // Try to parse the JSON response
            const parsed = JSON.parse(analysisText.trim()) as {
              band: string;
              overallSummary: string;
              strengthPoints: string[];
              improvementArea: { originalText: string; mistake: string; correction: string }[];
              tips: string[];
            };

            // Create the feedback object from the parsed JSON
            const feedback: IELTSFeedback = {
              band: parseFloat(parsed.band) || DEFAULT_BAND_SCORE,
              strengths: {
                summary:
                  parsed.overallSummary ??
                  "أظهر المتحدث مستوى جيد من الكفاءة في التحدث باللغة الإنجليزية مع قدرة على التعبير عن الأفكار بشكل واضح",
                points: Array.isArray(parsed.strengthPoints)
                  ? parsed.strengthPoints
                  : ["أظهر المتحدث قدرة جيدة على التواصل"],
              },
              areasToImprove: {
                errors: Array.isArray(parsed.improvementArea)
                  ? parsed.improvementArea.map(item => ({
                      mistake:
                        item.originalText && item.mistake
                          ? `${item.originalText} - ${item.mistake}`
                          : "بعض الأخطاء النحوية البسيطة",
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

  startSpeakingTest: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        type: z.enum(["MOCK", "PRACTICE", "OFFICIAL"]),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: `You are John Al-Sheikh, an experienced IELTS examiner. Start by introducing yourself and ask the candidate to introduce themselves. Keep your responses concise and professional.`,
            },
          ],
        });

        const examinerResponse = response.choices[0]?.message.content;
        if (!examinerResponse) throw new Error("Failed to get examiner response");

        // Generate a temporary test ID
        const testId = crypto.randomUUID();

        // Convert examiner's text to speech
        const speech = await openai.audio.speech.create({
          model: "tts-1",
          voice: "echo",
          input: examinerResponse,
        });

        const speechBuffer = Buffer.from(await speech.arrayBuffer());
        const base64Audio = speechBuffer.toString("base64");

        return {
          success: true,
          testId,
          examinerResponse,
          audioBase64: base64Audio,
        };
      } catch (error) {
        console.error("Start speaking test error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to start speaking test",
        });
      }
    }),

  continueSpeakingTest: publicProcedure
    .input(
      z.object({
        testId: z.string(),
        audioBase64: z.string(),
        section: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        // Transcribe user's audio
        const audioFile = await toFile(Buffer.from(input.audioBase64, "base64"), "audio.webm");
        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: "whisper-1",
          language: "en",
        });

        // Get examiner's next response based on section
        const examinerResponse = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: `You are John Al-Sheikh, an IELTS examiner. Current section: ${input.section}
              If section 1: Engage in casual conversation about the candidate's life
              If section 2: Give a topic and 1-minute preparation time
              If section 3: Ask follow-up questions about their previous response

              Keep responses natural and professional. Stay in character.`,
            },
            {
              role: "user",
              content: transcription.text,
            },
          ],
        });

        const response = examinerResponse.choices[0]?.message.content;
        if (!response) throw new Error("Failed to get examiner response");

        // Convert examiner's text to speech
        const speech = await openai.audio.speech.create({
          model: "tts-1",
          voice: "echo",
          input: response,
        });

        const speechBuffer = Buffer.from(await speech.arrayBuffer());
        const base64Audio = speechBuffer.toString("base64");

        return {
          success: true,
          transcription: transcription.text,
          examinerResponse: response,
          audioBase64: base64Audio,
        };
      } catch (error) {
        console.error("Continue speaking test error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to continue speaking test",
        });
      }
    }),

  finalizeSpeakingTest: publicProcedure
    .input(
      z.object({
        testId: z.string(),
        messages: z.array(
          z.object({
            role: z.enum(["examiner", "user"]),
            content: z.string(),
            timestamp: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Generate final analysis and band score
        const analysis = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: `You are an IELTS speaking examiner. Analyze the complete test conversation and provide:
              1. Overall band score (1-9)
              2. Detailed feedback on:
                - Fluency and Coherence
                - Lexical Resource
                - Grammatical Range and Accuracy
                - Pronunciation
              3. Specific examples from the conversation
              4. Areas for improvement

              Return the analysis in a structured JSON format.`,
            },
            {
              role: "user",
              content: JSON.stringify(input.messages),
            },
          ],
        });

        const feedback = JSON.parse(analysis.choices[0]?.message.content ?? "{}");

        // Save test results to database
        await ctx.db.insert(speakingTests).values({
          id: input.testId,
          userId: ctx.session?.user.id!,
          type: "MOCK",
          transcription: { messages: input.messages },
          topic: "IELTS Speaking Test",
          band: feedback.band,
          feedback: feedback,
        });

        return {
          success: true,
          feedback,
        };
      } catch (error) {
        console.error("Finalize speaking test error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to finalize speaking test",
        });
      }
    }),
});

// Helper function to provide a fallback response
function provideFallbackResponse() {
  return {
    success: true,
    feedback: {
      band: DEFAULT_BAND_SCORE,
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
