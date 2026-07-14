/**
 * IELTS Reading Paragraph — Data Types
 *
 * These interfaces define the expected shape of content data.
 * Actual content files will be supplied separately and placed in /public/data/.
 */

/** A single question option (e.g. A / B / C / D) */
export interface QuestionOption {
  label: string;
  text: string;
}

/** A single comprehension question tied to a paragraph */
export interface Question {
  id: string;
  /** The question prompt text */
  prompt: string;
  /** Available choices */
  options: QuestionOption[];
  /** Index of the correct option (0-based) */
  answerIndex: number;
  /** Optional explanation shown after answering */
  explanation?: string;
}

/** A reading passage with its paragraph and associated questions */
export interface ReadingPassage {
  /** Unique identifier for the passage */
  id: string;
  /** Title of the passage */
  title: string;
  /** The full reading text (may contain multiple paragraphs separated by \n\n) */
  content: string;
  /** Comprehension questions for this passage */
  questions: Question[];
  /** Optional difficulty tag (e.g. "Band 6", "Band 7") */
  difficulty?: string;
  /** Optional topic category */
  topic?: string;
}

/** Result of a user's answer submission */
export interface AnswerResult {
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
}

/** Overall score summary */
export interface ScoreSummary {
  total: number;
  correct: number;
  incorrect: number;
  percentage: number;
}
