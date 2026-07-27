"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Application Error</CardTitle>
            <CardDescription>A critical error occurred. Please try again.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button onClick={reset}>Try again</Button>
            <Button variant="outline" asChild>
              <Link href={ROUTES.home}>Go home</Link>
            </Button>
          </CardContent>
        </Card>
      </body>
    </html>
  );
}
