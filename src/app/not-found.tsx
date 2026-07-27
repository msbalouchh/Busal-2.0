import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle className="text-6xl font-bold">404</CardTitle>
          <CardDescription>Page not found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6 text-sm">
            The page you are looking for does not exist or has been moved.
          </p>
          <Button asChild>
            <Link href={ROUTES.home}>Return home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
