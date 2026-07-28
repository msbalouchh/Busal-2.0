import type { FileAiProcessingType } from "@prisma/client";

export interface AiJobPlan {
  jobType: FileAiProcessingType;
  status: "QUEUED";
  result: Record<string, unknown> | null;
}

export function planAiProcessingJob(jobType: FileAiProcessingType): AiJobPlan {
  return {
    jobType,
    status: "QUEUED",
    result: null,
  };
}

export function simulateAiProcessingResult(jobType: FileAiProcessingType): Record<string, unknown> {
  switch (jobType) {
    case "OCR":
      return { text: "", pages: 0, architectureReady: true };
    case "CLASSIFICATION":
      return { category: "document", confidence: 0, architectureReady: true };
    case "METADATA_EXTRACTION":
      return { fields: {}, architectureReady: true };
    case "SUMMARY":
      return { summary: "", architectureReady: true };
    case "EMBEDDINGS":
      return { dimensions: 0, architectureReady: true };
    default:
      return { architectureReady: true };
  }
}
