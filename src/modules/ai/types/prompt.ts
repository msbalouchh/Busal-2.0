export interface AiPromptTemplate {
  id: string;
  slug: string;
  name: string;
  template: string;
  variables: string[];
}

export interface AiPromptContext {
  agentName: string;
  agentDescription: string;
  businessName?: string;
  workspaceName?: string;
  userName?: string;
  memorySummary?: string;
  toolSummary?: string;
  customVariables?: Record<string, string>;
}

export interface AiComposedPrompt {
  systemPrompt: string;
  userPrompt?: string;
  templateSlug: string;
}
