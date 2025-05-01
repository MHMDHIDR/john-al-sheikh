import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { z } from "zod";
import { env } from "@/env";
import { isActualEnglishSpeech } from "@/lib/check-is-actual-english-speech";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { speakingTests, users } from "@/server/db/schema";

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

type analyzeFullIELTSConversationFeedback = {
  overall: string;
  fluencyAndCoherence: string;
  lexicalResource: string;
  grammaticalRangeAndAccuracy: string;
  pronunciation: string;
  band: IELTSFeedback["band"];
  feedback: {
    overall: string;
    fluencyAndCoherence: string;
    lexicalResource: string;
    grammaticalRangeAndAccuracy: string;
    pronunciation: string;
  };
  strengths: IELTSFeedback["strengths"];
  areasToImprove: IELTSFeedback["areasToImprove"];
  improvementTips: IELTSFeedback["improvementTips"];
};

function containsArabicText(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

export const openaiRouter = createTRPCRouter({
  transcribeAudio: publicProcedure
    .input(
      z.object({
        audioBase64: z.string().min(1, "Audio data cannot be empty"),
        fileType: z.string().default("audio/webm"),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        // Check for empty audio data
        if (!input.audioBase64 || input.audioBase64.length < 100) {
          console.warn("Audio data too short:", input.audioBase64.length);
          return {
            success: true,
            text: "", // Return empty text for very small audio
          };
        }

        // Convert base64 to buffer
        const buffer = Buffer.from(input.audioBase64, "base64");

        // Ensure audio is substantial
        if (buffer.length < 10 * 1024) {
          console.warn("Audio buffer too small:", buffer.length);
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

  saveSpeakingTest: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        type: z.enum(["MOCK", "PRACTICE", "OFFICIAL"]).default("MOCK"),
        transcription: z.object({
          messages: z.array(
            z.object({
              role: z.enum(["examiner", "user"]),
              content: z.string(),
              timestamp: z.string(),
            }),
          ),
        }),
        topic: z.string(),
        band: z.number().optional(),
        feedback: z
          .object({
            strengths: z.object({
              summary: z.string(),
              points: z.array(z.string()),
            }),
            areasToImprove: z.object({
              errors: z.array(
                z.object({
                  mistake: z.string(),
                  correction: z.string(),
                }),
              ),
            }),
            improvementTips: z.array(z.string()),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.db.transaction(async tx => {
          // Insert the speaking test into the database
          const [result] = await tx
            .insert(speakingTests)
            .values({
              userId: input.userId,
              type: input.type,
              transcription: input.transcription,
              topic: input.topic,
              band: input.band,
              feedback: input.feedback,
            })
            .returning();

          if (!result) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to save speaking test: no result returned",
            });
          }

          // update the user's new band score
          await tx
            .update(users)
            .set({ currentBand: result.band })
            .where(eq(users.id, input.userId));

          return { success: true, id: result.id };
        });
      } catch (error) {
        console.error("Failed to save speaking test:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save speaking test",
        });
      }
    }),

  analyzeFullIELTSConversation: publicProcedure
    .input(
      z.object({
        conversation: z.array(
          z.object({
            role: z.enum(["examiner", "candidate"]),
            content: z.string(),
            timestamp: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        // Extract candidate responses and examiner questions
        const candidateResponses = input.conversation
          .filter(msg => msg.role === "candidate")
          .map(msg => msg.content)
          .join("\n\n");

        // Ensure we have enough content to analyze
        if (!candidateResponses || candidateResponses.trim().length < 50) {
          return {
            success: false,
            error: "الإجابات غير كافية للتحليل",
          };
        }

        // Prepare the full conversation for analysis
        const conversationText = input.conversation
          .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
          .join("\n\n");

        // Set up timeout to ensure we don't exceed Vercel's limits
        const timeoutPromise = new Promise<{ success: false; error: string }>(resolve => {
          setTimeout(() => {
            resolve({
              success: false,
              error: "تجاوز المدة المسموحة للتحليل",
            });
          }, 8000); // 8 seconds to stay under Vercel's 10s limit
        });

        // Create a more streamlined analysis request
        const analysisPromise = openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0,
          max_tokens: 500, // Reduced from 800 it was 500
          response_format: { type: "json_object" }, // Force JSON format for faster parsing
          messages: [
            {
              role: "system",
              content: `You are an expert IELTS speaking examiner. Analyze the following IELTS speaking test conversation.

              First, understand the structure of the conversation - identify the three IELTS speaking test sections:
              1. Introduction and general questions
              2. Individual long turn (usually a topic the candidate must speak about)
              3. Two-way discussion related to the topic

              Then evaluate the candidate's performance based on the official IELTS criteria:
              1. Fluency and Coherence (how smoothly they speak, whether they use connectives, ability to speak at length)
              2. Lexical Resource (vocabulary range and accuracy)
              3. Grammatical Range and Accuracy (variety of structures and grammatical accuracy)
              4. Pronunciation (clarity, intonation, accent)

              Provide your feedback in Arabic language in the following JSON format:
              {
                "band": number, // Overall score (1-9, decimals allowed)
                "fluencyAndCoherence": number,
                "lexicalResource": number,
                "grammaticalRangeAndAccuracy": number,
                "pronunciation": number,
                "feedback": {
                  "overall": "إجمالي التقييم العام (3-4 جمل)",
                  "fluencyAndCoherence": "تحليل الطلاقة والتماسك (جملة أو جملتين)",
                  "lexicalResource": "تحليل الثروة اللغوية (جملة أو جملتين)",
                  "grammaticalRangeAndAccuracy": "تحليل الدقة النحوية (جملة أو جملتين)",
                  "pronunciation": "تحليل النطق (جملة أو جملتين)"
                },
                "strengths": {
                  "summary": "ملخص نقاط القوة باللغة العربية",
                  "points": ["نقطة قوة 1", "نقطة قوة 2", "نقطة قوة 3"]
                },
                "areasToImprove": {
                  "errors": [
                    {
                      "mistake": "الخطأ أو المشكلة في الكلام مع أمثلة محددة من المحادثة",
                      "correction": "التصحيح أو النصيحة لتحسين هذه النقطة"
                    },
                    {
                      "mistake": "مثال آخر على خطأ أو مشكلة",
                      "correction": "كيفية تحسين هذه النقطة"
                    }
                  ]
                },
                "improvementTips": ["نصيحة 1 للتحسين", "نصيحة 2 للتحسين", "نصيحة 3 للتحسين"]
              }

              Be fair but critical in your assessment. The feedback should be helpful and specific.
              Make sure to include at least 2-3 specific examples of errors with corrections, and 3-4 improvement tips.
              Include quotes from the candidate's responses to illustrate the errors.
              The JSON must be properly formatted with no extra text or explanation outside the JSON structure.`,
            },
            {
              role: "user",
              content: `IELTS Speaking Test Conversation:\n\n${conversationText}\n\nPlease analyze this IELTS speaking test based on the criteria.`,
            },
          ],
        });

        // Race the analysis against the timeout
        const result = await Promise.race([analysisPromise, timeoutPromise]);

        // If we got a timeout result
        if ("error" in result) {
          return provideFallbackIELTSAnalysis(candidateResponses);
        }

        const analysisText = result.choices[0]?.message.content ?? "";

        try {
          // Parse the JSON response
          const feedback = JSON.parse(analysisText.trim()) as analyzeFullIELTSConversationFeedback;

          return {
            success: true,
            feedback,
          };
        } catch (parseError) {
          console.error("Failed to parse JSON response:", parseError);
          return provideFallbackIELTSAnalysis(candidateResponses);
        }
      } catch (error) {
        console.error("Analysis error:", error);
        return {
          success: false,
          error: "حدث خطأ أثناء تحليل المحادثة",
        };
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

// New helper function for IELTS conversation analysis fallback
function provideFallbackIELTSAnalysis(candidateText: string) {
  // Simple heuristic: estimate based on text length and complexity
  let estimatedBand = 5.5; // Default mid-range score

  // Very simple scoring heuristic based on text length
  if (candidateText.length > 500) estimatedBand += 0.5;
  if (candidateText.length > 1000) estimatedBand += 0.5;

  // Check for complex vocabulary (very simplified)
  const complexWords = ["therefore", "however", "nevertheless", "consequently", "furthermore"];
  complexWords.forEach(word => {
    if (candidateText.toLowerCase().includes(word)) estimatedBand += 0.1;
  });

  // Cap at reasonable bounds
  estimatedBand = Math.min(Math.max(estimatedBand, 4.0), 7.5);

  return {
    success: true,
    feedback: {
      band: estimatedBand,
      fluencyAndCoherence: estimatedBand,
      lexicalResource: estimatedBand,
      grammaticalRangeAndAccuracy: estimatedBand,
      pronunciation: estimatedBand,
      feedback: {
        overall: "تقييم أولي بناءً على بيانات محدودة",
        fluencyAndCoherence: "طلاقة متوسطة",
        lexicalResource: "مفردات مناسبة",
        grammaticalRangeAndAccuracy: "دقة نحوية متوسطة",
        pronunciation: "نطق مقبول",
      },
      strengths: {
        summary: "أظهر المتحدث قدرة على التواصل باللغة الإنجليزية",
        points: ["القدرة على التعبير عن الأفكار الأساسية", "استخدام مفردات مناسبة للموضوع"],
      },
      areasToImprove: {
        errors: [
          {
            mistake: "بعض الأخطاء النحوية",
            correction: "مراجعة قواعد الأزمنة والجمل المركبة",
          },
        ],
      },
      improvementTips: [
        "تنويع المفردات والتعبيرات",
        "ممارسة النطق بشكل أكثر وضوحاً",
        "تطوير مهارات الربط بين الجمل",
      ],
    },
  };
}
