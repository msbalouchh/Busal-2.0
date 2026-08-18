import { KNOWLEDGE_EMBEDDING_DIMENSION } from "@/modules/ai-knowledge/constants/routes";

export type EmbeddingProvider = "local" | "openai";

function resolveEmbeddingProvider(): EmbeddingProvider {
  if (process.env.OPENAI_API_KEY?.trim()) {
    return process.env.AI_EMBEDDING_PROVIDER === "local" ? "local" : "openai";
  }
  return "local";
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

async function createLocalEmbedding(text: string): Promise<number[]> {
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

async function createOpenAiEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return createLocalEmbedding(text);
  }

  const model = process.env.AI_EMBEDDING_MODEL?.trim() || "text-embedding-3-small";

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, input: text.slice(0, 8000) }),
    });

    if (!response.ok) {
      return createLocalEmbedding(text);
    }

    const payload = (await response.json()) as {
      data?: Array<{ embedding?: number[] }>;
    };

    const embedding = payload.data?.[0]?.embedding;
    if (!embedding?.length) {
      return createLocalEmbedding(text);
    }

    return embedding;
  } catch {
    return createLocalEmbedding(text);
  }
}

/** Creates embeddings using configured provider (OpenAI when available, local hash fallback). */
export async function createEmbedding(text: string): Promise<number[]> {
  const provider = resolveEmbeddingProvider();
  if (provider === "openai") {
    return createOpenAiEmbedding(text);
  }
  return createLocalEmbedding(text);
}

export function parseEmbedding(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is number => typeof entry === "number");
}

export function getActiveEmbeddingProvider(): EmbeddingProvider {
  return resolveEmbeddingProvider();
}
