export interface SkillExecutionContext {
  skillId: string;
  skillSlug: string;
  skillName: string;
  input: Record<string, unknown>;
  configuration: Record<string, unknown>;
}

export interface SkillExecutionResult {
  output: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ISkillHandler {
  readonly slug: string;
  execute(context: SkillExecutionContext): Promise<SkillExecutionResult>;
}
