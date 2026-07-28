import type { KnowledgeDocumentFormat } from "@prisma/client";

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractPdfText(content: string): string {
  const textMatches = content.match(/\((?:\\.|[^\\)])*\)/g) ?? [];
  const extracted = textMatches
    .map((match) => match.slice(1, -1))
    .join(" ")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "")
    .trim();

  if (extracted.length >= 32) {
    return extracted;
  }

  return content
    .replace(/[^\x20-\x7E\n\r\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractDocxText(content: string): string {
  const xmlText = content.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g);
  if (!xmlText) {
    return content.replace(/\s+/g, " ").trim();
  }

  return xmlText
    .map((segment) => segment.replace(/<\/?w:t[^>]*>/g, ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractDocumentText(format: KnowledgeDocumentFormat, rawContent: string): string {
  switch (format) {
    case "HTML":
      return stripHtml(rawContent);
    case "CSV":
      return rawContent
        .split(/\r?\n/)
        .map((line) => line.replace(/,/g, " | "))
        .join("\n")
        .trim();
    case "PDF":
      return extractPdfText(rawContent);
    case "DOCX":
      return extractDocxText(rawContent);
    case "MARKDOWN":
    case "TXT":
    default:
      return rawContent.replace(/\r\n/g, "\n").trim();
  }
}

export function estimateTokenCount(text: string): number {
  return Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.3));
}

export function hashContent(content: string): string {
  let hash = 0;

  for (let index = 0; index < content.length; index += 1) {
    hash = (hash << 5) - hash + content.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(16);
}
