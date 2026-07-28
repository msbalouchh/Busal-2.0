import type { BusinessType } from "@prisma/client";

import {
  BUSINESS_INTERVIEW_QUESTIONS,
  type BusinessInterviewAnswers,
  type BusinessInterviewField,
} from "@/modules/onboarding/lib/business-interview-questions";
import type { BusinessInterviewUpdateInput } from "@/services/business-profile.service";

function mapDnaField(
  field: Extract<
    BusinessInterviewField,
    "productsServices" | "staffSize" | "customerChannels" | "currentSoftware"
  >,
  value: string,
): BusinessInterviewUpdateInput {
  return {
    businessDna: {
      [field]: value.trim(),
    },
  };
}

function mapFieldToUpdateInput(
  field: BusinessInterviewField,
  answers: BusinessInterviewAnswers,
): BusinessInterviewUpdateInput {
  switch (field) {
    case "businessName":
      return { businessName: answers.businessName.trim() };
    case "businessType":
      return { businessType: answers.businessType as BusinessType };
    case "country":
      return { country: answers.country.trim() };
    case "businessGoal":
      return { businessGoal: answers.businessGoal.trim() };
    case "productsServices":
      return mapDnaField("productsServices", answers.productsServices);
    case "staffSize":
      return mapDnaField("staffSize", answers.staffSize);
    case "customerChannels":
      return mapDnaField("customerChannels", answers.customerChannels);
    case "currentSoftware":
      return mapDnaField("currentSoftware", answers.currentSoftware);
  }
}

export function mapInterviewAnswersThroughIndex(
  answers: BusinessInterviewAnswers,
  throughIndex: number,
): BusinessInterviewUpdateInput {
  const questions = BUSINESS_INTERVIEW_QUESTIONS.slice(0, throughIndex + 1);
  const merged: BusinessInterviewUpdateInput = { businessDna: {} };

  for (const question of questions) {
    const partial = mapFieldToUpdateInput(question.field, answers);

    if (partial.businessName !== undefined) {
      merged.businessName = partial.businessName;
    }

    if (partial.businessType !== undefined) {
      merged.businessType = partial.businessType;
    }

    if (partial.country !== undefined) {
      merged.country = partial.country;
    }

    if (partial.businessGoal !== undefined) {
      merged.businessGoal = partial.businessGoal;
    }

    if (partial.businessDna) {
      merged.businessDna = { ...(merged.businessDna ?? {}), ...partial.businessDna };
    }
  }

  if (merged.businessDna && Object.keys(merged.businessDna).length === 0) {
    delete merged.businessDna;
  }

  return merged;
}
