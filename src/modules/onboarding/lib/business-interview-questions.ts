export const BUSINESS_TYPE_OPTIONS = [
  { value: "RESTAURANT", label: "Restaurant" },
  { value: "CAFE", label: "Cafe" },
  { value: "BAKERY", label: "Bakery" },
  { value: "GROCERY", label: "Grocery" },
  { value: "RETAIL", label: "Retail" },
  { value: "SALON", label: "Salon" },
  { value: "CLINIC", label: "Clinic" },
  { value: "HOTEL", label: "Hotel" },
  { value: "GYM", label: "Gym" },
  { value: "PHARMACY", label: "Pharmacy" },
  { value: "SERVICES", label: "Services" },
  { value: "OTHER", label: "Other" },
] as const;

export type BusinessTypeValue = (typeof BUSINESS_TYPE_OPTIONS)[number]["value"];

export const BUSINESS_INTERVIEW_QUESTION_COUNT = 8;

export type BusinessInterviewField =
  | "businessName"
  | "businessType"
  | "productsServices"
  | "staffSize"
  | "country"
  | "customerChannels"
  | "currentSoftware"
  | "businessGoal";

export interface BusinessInterviewQuestion {
  field: BusinessInterviewField;
  question: string;
  placeholder: string;
  inputType: "text" | "textarea" | "select";
}

export const BUSINESS_INTERVIEW_QUESTIONS: BusinessInterviewQuestion[] = [
  {
    field: "businessName",
    question: "What's your business called?",
    placeholder: "e.g. Acme Coffee Co.",
    inputType: "text",
  },
  {
    field: "businessType",
    question: "What kind of business is it?",
    placeholder: "Select your business type",
    inputType: "select",
  },
  {
    field: "productsServices",
    question: "What do you sell?",
    placeholder: "Describe your products or services",
    inputType: "textarea",
  },
  {
    field: "staffSize",
    question: "How many people work with you?",
    placeholder: "e.g. Just me, 5 employees",
    inputType: "text",
  },
  {
    field: "country",
    question: "Where are you located?",
    placeholder: "e.g. United Kingdom",
    inputType: "text",
  },
  {
    field: "customerChannels",
    question: "How do customers usually contact you?",
    placeholder: "e.g. Phone, walk-ins, Instagram",
    inputType: "text",
  },
  {
    field: "currentSoftware",
    question: "What software do you currently use?",
    placeholder: "e.g. Excel, Square, WhatsApp",
    inputType: "textarea",
  },
  {
    field: "businessGoal",
    question: "What's the biggest challenge you face every day?",
    placeholder: "Tell us about your main daily challenge",
    inputType: "textarea",
  },
];

export interface BusinessInterviewAnswers {
  businessName: string;
  businessType: string;
  productsServices: string;
  staffSize: string;
  country: string;
  customerChannels: string;
  currentSoftware: string;
  businessGoal: string;
}

export function createInitialInterviewAnswers(business: {
  businessName: string | null;
  businessType: string | null;
  country: string | null;
  businessGoal: string | null;
  businessDna: Record<string, unknown>;
}): BusinessInterviewAnswers {
  const dna = business.businessDna;

  return {
    businessName: business.businessName?.trim() ?? "",
    businessType: business.businessType?.trim() ?? "",
    productsServices: typeof dna.productsServices === "string" ? dna.productsServices : "",
    staffSize: typeof dna.staffSize === "string" ? dna.staffSize : "",
    country: business.country?.trim() ?? "",
    customerChannels: typeof dna.customerChannels === "string" ? dna.customerChannels : "",
    currentSoftware: typeof dna.currentSoftware === "string" ? dna.currentSoftware : "",
    businessGoal: business.businessGoal?.trim() ?? "",
  };
}

export function isInterviewAnswerProvided(value: string): boolean {
  return value.trim().length > 0;
}

export function isBusinessTypeValue(value: string): value is BusinessTypeValue {
  return BUSINESS_TYPE_OPTIONS.some((option) => option.value === value);
}
