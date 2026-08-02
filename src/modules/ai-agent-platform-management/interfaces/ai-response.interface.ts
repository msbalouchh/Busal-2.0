export interface IAIResponse {
  content: string;
  metadata?: Record<string, unknown>;
  toolResults?: Array<{ toolKey: string; output: Record<string, unknown> }>;
}
