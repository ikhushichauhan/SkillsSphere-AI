import { z } from 'zod';

/**
 * Zod validation schemas for interview module endpoints.
 *
 * These mirror the constraints defined in the InterviewSession Mongoose model
 * (`server/src/database/models/InterviewSession.js`) to enforce validation at
 * the HTTP boundary — before any DB operations run.
 */

// --- Start Interview ---

export const startInterviewSchema = z.object({
  topic: z
    .string({ required_error: "Topic is required to start an interview" })
    .trim()
    .min(1, "Topic must not be empty")
    .max(100, "Topic must be 100 characters or fewer"),
  difficulty: z
    .enum(["easy", "medium", "hard"], {
      errorMap: () => ({ message: "Difficulty must be one of: easy, medium, hard" }),
    })
    .optional(),
  persona: z
    .string()
    .trim()
    .max(50, "Persona must be 50 characters or fewer")
    .optional(),
});

// --- Submit Answer ---

export const submitAnswerSchema = z.object({
  transcript: z
    .string()
    .max(50000, "Transcript must be 50,000 characters or fewer")
    .optional(),
});

// --- Tutor Feedback ---

const tutorScoresSchema = z
  .object({
    technical: z.number().min(0).max(100).optional(),
    communication: z.number().min(0).max(100).optional(),
    relevance: z.number().min(0).max(100).optional(),
  })
  .strict()
  .optional();

const answerFeedbackItemSchema = z.object({
  questionId: z.string({ required_error: "questionId is required" }).min(1),
  tutorScores: tutorScoresSchema,
  tutorFeedback: z
    .string()
    .max(2000, "Per-answer tutor feedback must be 2,000 characters or fewer")
    .optional(),
});

export const submitTutorFeedbackSchema = z.object({
  tutorOverallScore: z
    .number({ invalid_type_error: "tutorOverallScore must be a number" })
    .min(0, "Score must be at least 0")
    .max(100, "Score must be at most 100")
    .optional(),
  tutorOverallFeedback: z
    .string()
    .max(5000, "Overall tutor feedback must be 5,000 characters or fewer")
    .optional(),
  answersFeedback: z
    .array(answerFeedbackItemSchema)
    .max(20, "answersFeedback may contain at most 20 items")
    .optional(),
});

// --- Bookmark Question ---

export const bookmarkQuestionSchema = z.object({
  bookmarked: z.boolean({ invalid_type_error: "bookmarked must be a boolean" }).optional(),
});
