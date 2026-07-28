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
  businessGoal: string | null;
  businessDna: BusinessDna;
  onboardingCompleted: boolean;
  onboardingStep: number;
  createdAt: Date;
  updatedAt: Date;
}
