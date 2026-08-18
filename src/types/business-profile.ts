export type BusinessDna = Record<string, unknown>;

export interface BusinessProfileData {
  id: string;
  ownerId: string;
  ownerName: string | null;
  businessName: string | null;
  businessType: string | null;
  country: string | null;
  timezone: string | null;
  aiName: string | null;
  aiPersonality: string | null;
  aiAvatarUrl: string | null;
  aiGreeting: string | null;
  aiTone: string | null;
  businessGoal: string | null;
  businessDna: BusinessDna;
  businessCode: string | null;
  industry: string | null;
  currency: string | null;
  phone: string | null;
  businessEmail: string | null;
  businessSetupCompleted: boolean;
  businessSetupStep: number;
  onboardingCompleted: boolean;
  onboardingStep: number;
  createdAt: Date;
  updatedAt: Date;
}
