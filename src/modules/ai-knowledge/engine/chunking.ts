import {
  KNOWLEDGE_CHUNK_OVERLAP,
  KNOWLEDGE_CHUNK_SIZE,
} from "@/modules/ai-knowledge/constants/routes";
import { estimateTokenCount } from "@/modules/ai-knowledge/engine/document-processor";

export interface TextChunk {
  chunkIndex: number;
  content: string;
  tokenCount: number;
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function splitTextIntoChunks(
  text: string,
  chunkSize = KNOWLEDGE_CHUNK_SIZE,
  overlap = KNOWLEDGE_CHUNK_OVERLAP,
): TextChunk[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return [];
  }

  const paragraphs = splitParagraphs(normalized);
  const chunks: TextChunk[] = [];
  let buffer = "";

  for (const paragraph of paragraphs) {
    const candidate = buffer ? `${buffer}\n\n${paragraph}` : paragraph;

    if (candidate.length <= chunkSize) {
      buffer = candidate;
      continue;
    }

    if (buffer) {
      chunks.push({
        chunkIndex: chunks.length,
        content: buffer,
        tokenCount: estimateTokenCount(buffer),
      });
    }

    if (paragraph.length <= chunkSize) {
      buffer = paragraph;
      continue;
    }

    let start = 0;
    while (start < paragraph.length) {
      const end = Math.min(start + chunkSize, paragraph.length);
      const slice = paragraph.slice(start, end).trim();

      if (slice) {
        chunks.push({
          chunkIndex: chunks.length,
          content: slice,
          tokenCount: estimateTokenCount(slice),
        });
      }

      if (end >= paragraph.length) {
        break;
      }

      start = Math.max(end - overlap, start + 1);
    }

    buffer = "";
  }

  if (buffer) {
    chunks.push({
      chunkIndex: chunks.length,
      content: buffer,
      tokenCount: estimateTokenCount(buffer),
    });
  }

  return chunks;
}
