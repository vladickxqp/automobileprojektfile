import { prisma } from "./prisma";

export interface KnowledgeHit {
  id: string;
  title: string;
  source: string;
  text: string;
}

/**
 * Retrieve the most relevant knowledge chunks for a query via Postgres full-text search.
 * Uses the 'simple' config (language-agnostic) so DTC codes and RU/EN/DE terms match literally.
 * Planned upgrade: pgvector + embeddings for semantic recall.
 */
export async function retrieveKnowledge(query: string, limit = 5): Promise<KnowledgeHit[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // plainto_tsquery ANDs every word, which kills recall on natural-language questions
  // ("Можно ли ехать с ошибкой P0401?" would require every word to be present). We turn it into
  // an OR query (swap & for |) and let ts_rank surface the chunks that match the most terms.
  return prisma.$queryRaw<KnowledgeHit[]>`
    WITH q AS (
      SELECT replace(plainto_tsquery('simple', ${trimmed})::text, '&', '|')::tsquery AS query
    )
    SELECT k.id, k.title, k.source, k.text
    FROM knowledge_chunks k, q
    WHERE to_tsvector('simple', k.title || ' ' || k.text) @@ q.query
    ORDER BY ts_rank(to_tsvector('simple', k.title || ' ' || k.text), q.query) DESC
    LIMIT ${limit}
  `;
}
