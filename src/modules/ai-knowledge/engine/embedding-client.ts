import { KNOWLEDGE_EMBEDDING_DIMENSION } from "@/modules/ai-knowledge/constants/routes";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export async function createEmbedding(text: string): Promise<number[]> {
  const tokens = tokenize(text);
  const vector = new Array<number>(KNOWLEDGE_EMBEDDING_DIMENSION).fill(0);

  for (const token of tokens) {
    let hash = 0;

    for (let index = 0; index < token.length; index += 1) {
      hash = (hash << 5) - hash + token.charCodeAt(index);
      hash |= 0;
    }

    const bucket = Math.abs(hash) % KNOWLEDGE_EMBEDDING_DIMENSION;
    vector[bucket] = (vector[bucket] ?? 0) + 1;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) {
    return vector;
  }

  return vector.map((value) => value / magnitude);
}

export function parseEmbedding(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is number => typeof entry === "number");
}
