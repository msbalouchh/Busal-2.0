import { Bot, PlusCircle, Sparkles, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DASHBOARD_QUICK_ACTIONS,
  DASHBOARD_WIDGETS,
} from "@/modules/dashboard/constants/navigation";
import { resolveBusinessName, resolveDisplayName } from "@/modules/dashboard/lib/dashboard-display";
import type { BusinessProfileData } from "@/types/business-profile";

interface DashboardHomeProps {
  business: BusinessProfileData;
  userFullName: string;
}

const QUICK_ACTION_ICONS = [PlusCircle, UserPlus, PlusCircle, Bot] as const;

export function DashboardHome({ business, userFullName }: DashboardHomeProps) {
  const ownerName = resolveDisplayName(business.ownerName, userFullName);
  const businessName = resolveBusinessName(business.businessName);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Welcome back, {ownerName} 👋</CardTitle>
          <CardDescription className="text-base">
            Busal is ready to help you run {businessName}.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="text-primary h-5 w-5" />
            AI Daily Brief
          </CardTitle>
          <CardDescription>Good morning!</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Here&apos;s your business summary.</p>
          <p className="text-muted-foreground mt-2 text-sm italic">(No data available yet.)</p>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {DASHBOARD_QUICK_ACTIONS.map((action, index) => {
            const Icon = QUICK_ACTION_ICONS[index] ?? PlusCircle;

            return (
              <Button
                key={action}
                type="button"
                variant="outline"
                className="h-11 justify-start"
                disabled
              >
                <Icon className="h-4 w-4" />
                {action}
              </Button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {DASHBOARD_WIDGETS.map((widget) => (
            <Card key={widget}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{widget}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">No data yet.</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
