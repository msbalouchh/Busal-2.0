"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveBusinessInterviewAction } from "@/modules/onboarding/actions/onboarding-actions";
import {
  BUSINESS_INTERVIEW_QUESTION_COUNT,
  BUSINESS_INTERVIEW_QUESTIONS,
  BUSINESS_TYPE_OPTIONS,
  createInitialInterviewAnswers,
  isInterviewAnswerProvided,
  type BusinessInterviewAnswers,
  type BusinessInterviewField,
} from "@/modules/onboarding/lib/business-interview-questions";
import { mapInterviewAnswersThroughIndex } from "@/modules/onboarding/lib/business-interview-mapper";
import type { OnboardingStepProps } from "@/modules/onboarding/types/onboarding-step";
import { cn } from "@/lib/utils";

function updateAnswer(
  answers: BusinessInterviewAnswers,
  field: BusinessInterviewField,
  value: string,
): BusinessInterviewAnswers {
  return { ...answers, [field]: value };
}

export function BusinessInterviewStep({ business, onNext }: OnboardingStepProps) {
  const [isPending, startTransition] = useTransition();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<BusinessInterviewAnswers>(() =>
    createInitialInterviewAnswers(business),
  );

  const currentQuestion = BUSINESS_INTERVIEW_QUESTIONS[questionIndex]!;
  const currentValue = answers[currentQuestion.field];
  const canProceed = isInterviewAnswerProvided(currentValue);
  const isLastQuestion = questionIndex === BUSINESS_INTERVIEW_QUESTION_COUNT - 1;

  const handleAnswerChange = (value: string) => {
    setAnswers((previous) => updateAnswer(previous, currentQuestion.field, value));
  };

  const persistAnswers = async (throughIndex: number) => {
    await saveBusinessInterviewAction(mapInterviewAnswersThroughIndex(answers, throughIndex));
  };

  const handleBack = () => {
    if (questionIndex > 0) {
      setQuestionIndex((index) => index - 1);
    }
  };

  const handleNext = () => {
    if (!canProceed) {
      return;
    }

    startTransition(async () => {
      await persistAnswers(questionIndex);

      if (isLastQuestion) {
        await onNext();
        return;
      }

      setQuestionIndex((index) => index + 1);
    });
  };

  return (
    <div className="space-y-8">
      <p className="text-muted-foreground text-center text-sm">
        Question {questionIndex + 1} of {BUSINESS_INTERVIEW_QUESTION_COUNT}
      </p>

      <div className="space-y-3">
        <Label htmlFor={currentQuestion.field} className="text-base font-medium">
          {currentQuestion.question}
        </Label>

        {currentQuestion.inputType === "select" ? (
          <select
            id={currentQuestion.field}
            value={currentValue}
            disabled={isPending}
            onChange={(event) => handleAnswerChange(event.target.value)}
            className={cn(
              "border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            <option value="">{currentQuestion.placeholder}</option>
            {BUSINESS_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : null}

        {currentQuestion.inputType === "text" ? (
          <Input
            id={currentQuestion.field}
            type="text"
            placeholder={currentQuestion.placeholder}
            value={currentValue}
            disabled={isPending}
            onChange={(event) => handleAnswerChange(event.target.value)}
          />
        ) : null}

        {currentQuestion.inputType === "textarea" ? (
          <textarea
            id={currentQuestion.field}
            rows={4}
            placeholder={currentQuestion.placeholder}
            value={currentValue}
            disabled={isPending}
            onChange={(event) => handleAnswerChange(event.target.value)}
            className={cn(
              "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[100px] w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            )}
          />
        ) : null}
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1"
          disabled={isPending || questionIndex === 0}
          onClick={handleBack}
        >
          Back
        </Button>
        <Button
          type="button"
          className="h-11 flex-1"
          disabled={isPending || !canProceed}
          onClick={handleNext}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isLastQuestion ? "Continue" : "Next"}
        </Button>
      </div>
    </div>
  );
}
