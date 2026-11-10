/**
 * Tourism Knowledge Base Schema (for RAG & Question-Answering)
 * Compatible with train_vietnam_tourism.json and valid_vietnam_tourism.json
 * Preserves articles, passages, questions, answers, and strict provenance.
 * NOT to be imported directly as POIs.
 */

export interface KnowledgeArticleMetadata {
  articleId: string;
  title: string;
  sourceUrl?: string;
  sourceName: string;
  category?: string;
  authorOrPublisher?: string;
  publishedDate?: string;
}

export interface KnowledgePassage {
  passageId: string;
  articleId: string;
  passageIndex: number;
  content: string;
  contextEntity?: string; // Entity or destination mentioned in text
}

export interface KnowledgeQuestionAnswer {
  questionId: string;
  passageId: string;
  articleId: string;
  question: string;
  answer: string;
  answerStartOffset?: number;
  isExtractive: boolean;
}

export interface TourismKnowledgeBaseStats {
  totalArticles: number;
  totalPassages: number;
  totalQuestions: number;
  verifiedSourcesCount: number;
  status: 'available' | 'pending_file_upload';
}

