import crypto from "crypto";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { z } from "zod";
import { env } from "@/env";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { speakingTests, users } from "@/server/db/schema";
import type {
  EnhancedFeedback,
  GrammarAnalysis,
  LegacyFeedback,
  NativenessAnalysis,
  ProgressionMetrics,
  VocabularyAnalysis,
  WordAnalysis,
} from "@/server/db/schema";

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

// Define the success type for analyzeFullIELTSConversation
type AnalyzeFullIELTSSuccess = {
  success: true;
  feedback: {
    band: number;
    feedback: EnhancedFeedback | LegacyFeedback;
    wordUsage: Record<string, WordAnalysis>;
  };
};

// Define the error type for analyzeFullIELTSConversation
type AnalyzeFullIELTSError = {
  success: false;
  error: string;
};

// Union type for all possible responses
type AnalyzeFullIELTSResponse = AnalyzeFullIELTSSuccess | AnalyzeFullIELTSError;

// Define types for API responses
interface GrammarAPIResponse {
  analysis?: Array<{
    error: string;
    correction: string;
    explanation: string;
    category: string;
    context: string;
    arabicExplanation: string;
  }>;
  score?: string | number;
}

interface VocabularyAPIResponse {
  wordUsage?: Record<string, WordAnalysis>;
  commonPatterns?: Array<{
    pattern: string;
    frequency: number;
    suggestions: string[];
    arabicExplanation: string;
  }>;
  diversityScore?: string | number;
  overallScore?: string | number;
}

interface NativenessAPIResponse {
  expressions?: Array<{
    original: string;
    britishAlternative: string;
    context: string;
    arabicExplanation: string;
    category: string;
  }>;
  overallNativenessScore?: string | number;
}

// Helper function to safely extract JSON from OpenAI response
function extractJSONFromResponse(content: string): Record<string, unknown> {
  try {
    // Clean up the content first
    const cleanContent = content
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
      .replace(/\\+"/g, '\\"') // Fix escaped quotes
      .trim();

    // First, try to parse the entire content as JSON
    return JSON.parse(cleanContent) as Record<string, unknown>;
  } catch {
    // If that fails, try to extract JSON from the content
    const jsonRegex = /\{[\s\S]*\}/;
    const jsonMatch = jsonRegex.exec(content);
    if (jsonMatch) {
      try {
        const cleanJson = jsonMatch[0]
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
          .replace(/\\+"/g, '\\"') // Fix escaped quotes
          .trim();
        return JSON.parse(cleanJson) as Record<string, unknown>;
      } catch {
        // If JSON extraction fails, return a default structure
        console.warn("Failed to parse JSON from OpenAI response:", content);
        return {};
      }
    }
    // If no JSON found, return empty object
    return {};
  }
}

// Enhanced analysis functions for modular processing
async function analyzeGrammar(
  content: string,
  openai: OpenAI,
): Promise<{ grammarAnalysis: GrammarAnalysis[]; grammarScore: number }> {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `You are an expert English grammar analyzer for SPOKEN language. You are analyzing a transcribed speaking test, NOT written text. Focus ONLY on spoken grammar errors like verb tenses, sentence structure, and word order. DO NOT analyze punctuation, capitalization, or written text formatting as these are transcription artifacts. Analyze the following SPOKEN text for grammatical errors and provide detailed feedback in Arabic.
          Return a JSON object with the following structure:
          {
            "analysis": [{
              "error": "The exact error text",
              "correction": "The corrected version",
              "explanation": "Technical explanation in English",
              "category": "tense|structure|articles|prepositions",
              "context": "The full sentence or phrase containing the error",
              "arabicExplanation": "Detailed explanation in Arabic"
            }],
            "score": "Grammar score out of 10"
          }`,
      },
      {
        role: "user",
        content,
      },
    ],
  });

  const result = extractJSONFromResponse(
    response.choices[0]?.message.content ?? "{}",
  ) as GrammarAPIResponse;

  // Ensure grammarScore is a number
  let grammarScore = 5;
  if (result.score) {
    if (typeof result.score === "string") {
      // Extract number from strings like "5 out of 10" or "5"
      const numberRegex = /(\d+(?:\.\d+)?)/;
      const match = numberRegex.exec(result.score);
      grammarScore = match?.[1] ? parseFloat(match[1]) : 5;
    } else if (typeof result.score === "number") {
      grammarScore = result.score;
    }
  }

  return {
    grammarAnalysis: (result.analysis ?? []) as GrammarAnalysis[],
    grammarScore,
  };
}

async function analyzeVocabulary(
  content: string,
  previousWordUsage: Record<string, WordAnalysis> | null,
  openai: OpenAI,
): Promise<{ vocabularyAnalysis: VocabularyAnalysis; vocabularyScore: number }> {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `You are an expert vocabulary analyzer for SPOKEN language. You are analyzing a transcribed speaking test, NOT written text. Focus on spoken vocabulary usage, word choice, repetition, and range of vocabulary. DO NOT consider punctuation or written formatting. Analyze the following SPOKEN text for vocabulary usage and provide suggestions for improvement.
          ${
            previousWordUsage
              ? "Consider the user's previous word usage history for personalized recommendations."
              : ""
          }
          Return a JSON object with the following structure:
          {
            "wordUsage": {
              "word": {
                "frequency": "number of occurrences",
                "contexts": ["sentences where the word appears"],
                "alternatives": ["suggested alternative words"],
                "category": "basic|intermediate|advanced"
              }
            },
            "commonPatterns": [{
              "pattern": "identified pattern",
              "frequency": "number of occurrences",
              "suggestions": ["alternative expressions"],
              "arabicExplanation": "explanation in Arabic"
            }],
            "diversityScore": "vocabulary diversity score out of 10",
            "overallScore": "vocabulary richness score out of 10"
          }`,
      },
      {
        role: "user",
        content: JSON.stringify({ text: content, previousWordUsage }),
      },
    ],
  });

  const result = extractJSONFromResponse(
    response.choices[0]?.message.content ?? "{}",
  ) as VocabularyAPIResponse;

  // Extract numeric scores from string format
  const extractScore = (scoreValue: unknown): number => {
    if (!scoreValue) return 5;
    if (typeof scoreValue === "string" && scoreValue.length > 0) {
      const numberRegex = /(\d+(?:\.\d+)?)/;
      const match = numberRegex.exec(scoreValue);
      return match?.[1] ? parseFloat(match[1]) : 5;
    } else if (typeof scoreValue === "number") {
      return scoreValue;
    }
    return 5;
  };

  return {
    vocabularyAnalysis: {
      wordUsage: result.wordUsage ?? {}, //as Record<string, WordAnalysis>,
      commonPatterns: (result.commonPatterns ?? []) as VocabularyAnalysis["commonPatterns"],
      diversityScore: extractScore(result.diversityScore),
    },
    vocabularyScore: extractScore(result.overallScore),
  };
}

async function analyzeNativeness(
  content: string,
  openai: OpenAI,
): Promise<{ nativenessAnalysis: NativenessAnalysis; nativenessScore: number }> {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `You are an expert in British English for SPOKEN language. You are analyzing a transcribed speaking test, NOT written text. Focus on natural spoken expressions, colloquialisms, and pronunciation patterns typical of native British speakers. DO NOT analyze punctuation or written formatting. Analyze the following SPOKEN text for nativeness and provide suggestions for more natural British English expressions.
          Return a JSON object with the following structure:
          {
            "expressions": [{
              "original": "original phrase",
              "britishAlternative": "more natural British expression",
              "context": "full context",
              "arabicExplanation": "explanation in Arabic",
              "category": "formal|informal|idiom|colloquial"
            }],
            "overallNativenessScore": "score out of 10"
          }`,
      },
      {
        role: "user",
        content,
      },
    ],
  });

  const result = extractJSONFromResponse(
    response.choices[0]?.message.content ?? "{}",
  ) as NativenessAPIResponse;

  // Extract numeric score from string format
  const extractScore = (scoreValue: unknown): number => {
    if (!scoreValue) return 5;
    if (typeof scoreValue === "string" && scoreValue.length > 0) {
      const numberRegex = /(\d+(?:\.\d+)?)/;
      const match = numberRegex.exec(scoreValue);
      return match?.[1] ? parseFloat(match[1]) : 5;
    } else if (typeof scoreValue === "number") {
      return scoreValue;
    }
    return 5;
  };

  const nativenessScore = extractScore(result.overallNativenessScore);

  return {
    nativenessAnalysis: {
      expressions: (result.expressions ?? []) as NativenessAnalysis["expressions"],
      overallNativenessScore: nativenessScore,
    },
    nativenessScore,
  };
}

async function calculateProgressionMetrics(
  currentAnalysis: {
    grammarScore: number;
    vocabularyScore: number;
    nativenessScore: number;
  },
  previousTests: Array<{
    id: string;
    grammarScore: number;
    vocabularyScore: number;
    nativenessScore: number;
  }>,
): Promise<ProgressionMetrics> {
  const previousTest = previousTests[0];

  const metrics: ProgressionMetrics = {
    vocabularyDiversity: currentAnalysis.vocabularyScore,
    grammarAccuracy: currentAnalysis.grammarScore,
    expressionComplexity:
      Math.round(((currentAnalysis.vocabularyScore + currentAnalysis.nativenessScore) / 2) * 10) /
      10,
    nativelikeSpeaking: currentAnalysis.nativenessScore,
    historicalComparison: {
      improvement: 0,
      comparisonPoints: [],
    },
  };

  if (previousTest) {
    metrics.historicalComparison = {
      improvement:
        (currentAnalysis.grammarScore +
          currentAnalysis.vocabularyScore +
          currentAnalysis.nativenessScore -
          (previousTest.grammarScore +
            previousTest.vocabularyScore +
            previousTest.nativenessScore)) /
        3,
      previousTestId: previousTest.id,
      comparisonPoints: [
        {
          aspect: "Grammar",
          previous: previousTest.grammarScore,
          current: currentAnalysis.grammarScore,
          change: currentAnalysis.grammarScore - previousTest.grammarScore,
        },
        {
          aspect: "Vocabulary",
          previous: previousTest.vocabularyScore,
          current: currentAnalysis.vocabularyScore,
          change: currentAnalysis.vocabularyScore - previousTest.vocabularyScore,
        },
        {
          aspect: "Nativeness",
          previous: previousTest.nativenessScore,
          current: currentAnalysis.nativenessScore,
          change: currentAnalysis.nativenessScore - previousTest.nativenessScore,
        },
      ],
    };
  }

  return metrics;
}

export const openaiRouter = createTRPCRouter({
  /** ==> Only used for Quick Speaking Test Proceedure */
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

  /** ==> Only used for Quick Speaking Test Proceedure */
  analyzeIELTSSpeaking: publicProcedure
    .input(
      z.object({
        transcription: z.string(),
        prompt: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
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
               Response: "${input.transcription}"`,
            },
          ],
        });

        const validationResult = JSON.parse(
          validationResponse.choices[0]?.message.content ?? "{}",
        ) as { isValid: boolean; reason: string };
        const validationReason = validationResult.reason;

        // if (!validationResult.isValid) {
        //   console.error("Invalid content:", validationResult.reason);
        //   // throw new TRPCError({   code: "BAD_REQUEST", message: validationResult.reason });
        //   return {
        //     success: false,
        //     error: "المحتوى غير مرتبط بموضوع المحادثة أو غير مكتمل",
        //   };
        // }

        // Create the OpenAI request with a system message that changes based on validation result
        const systemMessage = !validationResult.isValid
          ? `You are an expert IELTS examiner evaluating a student's speaking response which failed validation for the following reason: "${validationReason}".

             The response was not valid because either:
             - It was not in English
             - It was not relevant to the prompt
             - It did not contain meaningful content

             As this is an invalid response, you should:
             1. Give a very low band score (between 2.0-3.0)
             2. Not provide any strength points
             3. Clearly explain the issue with the response
             4. Provide helpful tips for improvement

             Return your feedback in the following JSON format with no additional text:
             {
               "band": "Give a number between 2.0 and 3.0 representing the very low speaking score",
               "overallSummary": "A comprehensive analysis (in Arabic) explaining why the response is invalid and received this low band score",
               "strengthPoints": [],
               "improvementArea": [
                 {
                   "originalText": "The exact problematic phrase/sentence from the transcript if applicable",
                   "mistake": "Description of what's wrong with the overall response",
                   "correction": "Suggest speaking clearly in English and addressing the given topic"
                 }
               ],
               "tips": [
                 "Speak clearly in English",
                 "Make sure to address the given topic",
                 "Provide meaningful content with complete thoughts",
                 "Practice basic English speaking skills"
               ]
             }

             The response MUST be in Arabic language for all feedback points except for any English examples in originalText and correction fields.`
          : `You are an expert IELTS examiner evaluating a student's SPOKEN response to the topic: "${input.prompt}". This is a transcribed speaking test, NOT written text.

             Analyze the SPOKEN response based on the official IELTS speaking assessment criteria, focusing on SPOKEN language features:
             1. Fluency and Coherence
             2. Lexical Resource (vocabulary)
             3. Grammatical Range and Accuracy
             4. Pronunciation
             DO NOT analyze punctuation, capitalization, or written text formatting as these are transcription artifacts. Focus only on spoken language features.

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

             The response MUST be in Arabic language for all feedback points. Be concise and specific with actionable feedback. Provide only the JSON response with no additional text.`;

        // Create the OpenAI request
        const openaiPromise = openai.chat.completions.create({
          // Use GPT-3.5-turbo for faster responses its cheaper and faster
          model: "gpt-3.5-turbo",
          // Balanced temperature for creative yet consistent responses
          temperature: 0.2,
          // Set max tokens to allow for detailed feedback
          max_tokens: 700,
          messages: [
            {
              role: "system",
              content: systemMessage,
            },
            {
              role: "user",
              content: input.transcription,
            },
          ],
        });

        try {
          // Race the OpenAI request against the timeout
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
        feedback: z.record(z.string(), z.unknown()).optional(), // More specific than `any`
        callId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { feedback } = input;
        const validBand =
          input.band && !isNaN(parseFloat(input.band.toString())) ? input.band : 5.0;

        // Keep it simple - just use the input data as-is
        console.log("Saving speaking test with minimal processing...");

        return await ctx.db.transaction(async tx => {
          // Simple insert - just save the essential data
          const [result] = await tx
            .insert(speakingTests)
            .values({
              id: crypto.randomUUID(),
              userId: input.userId,
              type: input.type,
              transcription: input.transcription,
              topic: input.topic,
              band: validBand,
              feedback: feedback,
              callId: input.callId,
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

  analyzeFullEnglishConversation: publicProcedure
    .input(
      z.object({
        conversation: z.array(
          z.object({
            role: z.enum(["examiner", "candidate"]),
            content: z.string(),
            timestamp: z.string(),
          }),
        ),
        mode: z.enum(["mock-test", "general-english"]).default("mock-test"),
        userId: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }): Promise<AnalyzeFullIELTSResponse> => {
      try {
        // Extract and validate conversation data
        const candidateResponses = input.conversation
          .filter(msg => msg.role === "candidate")
          .map(msg => msg.content.trim())
          .filter(content => content.length > 0);

        // Examiner questions are extracted but not used - keeping for potential future use
        // const _examinerQuestions = input.conversation
        //   .filter(msg => msg.role === "examiner")
        //   .map(msg => msg.content.trim());

        // Validate conversation quality
        const totalCandidateText = candidateResponses.join(" ");
        const wordCount = totalCandidateText.split(/\s+/).filter(word => word.length > 0).length;

        if (candidateResponses.length < 3 || wordCount < 30) {
          return {
            success: false as const,
            error: "المحادثة قصيرة جداً أو غير مكتملة للتحليل",
          };
        }

        // Get previous tests for comparison if userId is provided
        let previousTests: Array<{
          id: string;
          grammarScore: number;
          vocabularyScore: number;
          nativenessScore: number;
          wordUsageHistory: Record<string, WordAnalysis>;
        }> = [];

        if (input.userId) {
          const tests = await ctx.db.query.speakingTests.findMany({
            where: eq(speakingTests.userId, input.userId),
            orderBy: [desc(speakingTests.createdAt)],
            limit: 5,
            columns: {
              id: true,
              grammarScore: true,
              vocabularyScore: true,
              nativenessScore: true,
              wordUsageHistory: true,
            },
          });

          previousTests = tests
            .filter(
              (
                test,
              ): test is typeof test & {
                grammarScore: number;
                vocabularyScore: number;
                nativenessScore: number;
              } =>
                test.grammarScore !== null &&
                test.vocabularyScore !== null &&
                test.nativenessScore !== null,
            )
            .map(test => ({
              id: test.id,
              grammarScore: test.grammarScore,
              vocabularyScore: test.vocabularyScore,
              nativenessScore: test.nativenessScore,
              wordUsageHistory: test.wordUsageHistory ?? {}, //as Record<string, WordAnalysis>,
            }));
        }

        // Get combined previous word usage for personalized analysis
        const previousWordUsage = previousTests.reduce(
          (acc, test) => ({ ...acc, ...test.wordUsageHistory }),
          {} as Record<string, WordAnalysis>,
        );

        // Perform parallel analysis using different specialized functions
        const [grammarResult, vocabularyResult, nativenessResult] = await Promise.all([
          analyzeGrammar(totalCandidateText, openai),
          analyzeVocabulary(totalCandidateText, previousWordUsage, openai),
          analyzeNativeness(totalCandidateText, openai),
        ]);

        // Calculate progression metrics
        const progressionMetrics = await calculateProgressionMetrics(
          {
            grammarScore: grammarResult.grammarScore,
            vocabularyScore: vocabularyResult.vocabularyScore,
            nativenessScore: nativenessResult.nativenessScore,
          },
          previousTests,
        );

        // Calculate unique and new words
        const currentWords = new Set(
          totalCandidateText
            .toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 2),
        );
        const previousWordsSet = new Set(Object.keys(previousWordUsage));
        const newWords = Array.from(currentWords).filter(word => !previousWordsSet.has(word));

        // Build enhanced feedback structure
        const enhancedFeedback: EnhancedFeedback = {
          originalText: totalCandidateText,
          grammarAnalysis: grammarResult.grammarAnalysis,
          vocabularyAnalysis: vocabularyResult.vocabularyAnalysis,
          nativenessAnalysis: nativenessResult.nativenessAnalysis,
          progressionMetrics,
          overallFeedback: {
            strengths: [
              `أظهرت قدرة جيدة على التواصل بـ ${currentWords.size} كلمة فريدة`,
              `استخدمت ${newWords.length} كلمة جديدة لم تستخدمها من قبل`,
              grammarResult.grammarScore > 7 ? "دقة نحوية ممتازة" : "دقة نحوية جيدة",
            ],
            areasToImprove: [
              grammarResult.grammarScore < 6
                ? "يحتاج تحسين في القواعد النحوية"
                : "تحسين طفيف في القواعد مطلوب",
              vocabularyResult.vocabularyScore < 6
                ? "زيادة تنوع المفردات"
                : "استخدام مفردات أكثر تقدماً",
              nativenessResult.nativenessScore < 6
                ? "تحسين الطبيعية في التعبير"
                : "استخدام تعبيرات بريطانية أكثر",
            ],
            nextSteps: [
              "ممارسة المحادثة يومياً لمدة 15 دقيقة",
              "قراءة النصوص البريطانية والاستماع للبودكاست",
              "التركيز على استخدام مرادفات للكلمات المتكررة",
              "مراجعة القواعد النحوية الأساسية",
            ],
            arabicSummary: `لقد أظهرت مستوى ${
              (grammarResult.grammarScore +
                vocabularyResult.vocabularyScore +
                nativenessResult.nativenessScore) /
                3 >
              6
                ? "جيد"
                : "متوسط"
            } في اللغة الإنجليزية. استخدمت ${currentWords.size} كلمة فريدة منها ${newWords.length} كلمة جديدة. ${
              previousTests.length > 0
                ? progressionMetrics.historicalComparison.improvement > 0
                  ? "لقد تحسن أداؤك مقارنة بالاختبار السابق."
                  : "أداؤك مستقر مقارنة بالاختبار السابق."
                : "هذا اختبارك الأول، استمر في الممارسة!"
            }`,
          },
        };

        // Calculate overall band score
        const overallScore =
          (grammarResult.grammarScore +
            vocabularyResult.vocabularyScore +
            nativenessResult.nativenessScore) /
          3;
        const band = Math.max(1, Math.min(9, overallScore * 0.9)); // Convert to IELTS band scale

        return {
          success: true as const,
          feedback: {
            band: Math.round(band * 2) / 2, // Round to nearest 0.5
            feedback: enhancedFeedback,
            wordUsage: vocabularyResult.vocabularyAnalysis.wordUsage,
          },
        };
      } catch (error) {
        console.error("Analysis error:", error);
        return {
          success: false as const,
          error: "حدث خطأ أثناء تحليل المحادثة. يرجى المحاولة مرة أخرى.",
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
