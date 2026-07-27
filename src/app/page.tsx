import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { ROUTES } from "@/constants/routes";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">{siteConfig.name}</CardTitle>
          <CardDescription>{siteConfig.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center gap-4">
          <Button asChild>
            <Link href={ROUTES.dashboard}>Go to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
