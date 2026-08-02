"use client";

import { Bot } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AI_PLATFORM_ROUTES } from "@/modules/ai-platform/constants/ai-platform";

export function AiAssistantButton() {
  return (
    <Button asChild variant="outline" size="sm" className="hidden gap-2 md:inline-flex">
      <Link href={AI_PLATFORM_ROUTES.assistant} aria-label="Open AI assistant">
        <Bot className="h-4 w-4" />
        AI Assistant
      </Link>
    </Button>
  );
}
