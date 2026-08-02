"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Bot,
  Calendar,
  CreditCard,
  FileText,
  Gift,
  Heart,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Receipt,
  Settings,
  Shield,
  ShoppingBag,
  SlidersHorizontal,
  Star,
  Ticket,
  User,
  Wallet,
  Banknote,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState, useTransition } from "react";

import { SkipToContent } from "@/components/common/skip-to-content";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { CUSTOMER_PORTAL_NAV } from "@/modules/customer-portal/constants/routes";
import { switchCustomerBusinessAction } from "@/modules/customer-portal/actions/customer-portal-actions";
import type { CustomerPortalContextData } from "@/services/customer-portal.service";

const ICONS = {
  "layout-dashboard": LayoutDashboard,
  user: User,
  "shopping-bag": ShoppingBag,
  calendar: Calendar,
  star: Star,
  gift: Gift,
  wallet: Wallet,
  "credit-card": CreditCard,
  ticket: Ticket,
  "map-pin": MapPin,
  banknote: Banknote,
  bell: Bell,
  "message-square": MessageSquare,
  "life-buoy": LifeBuoy,
  bot: Bot,
  receipt: Receipt,
  "file-text": FileText,
  heart: Heart,
  "sliders-horizontal": SlidersHorizontal,
  shield: Shield,
  settings: Settings,
} as const;

interface CustomerPortalShellProps {
  context: CustomerPortalContextData;
  children: ReactNode;
}

interface CustomerPortalNavProps {
  pathname: string;
  onNavigate?: () => void;
}

function CustomerPortalNav({ pathname, onNavigate }: CustomerPortalNavProps) {
  return (
    <ul className="space-y-1">
      {CUSTOMER_PORTAL_NAV.map((item) => {
        const Icon = ICONS[item.icon as keyof typeof ICONS] ?? LayoutDashboard;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "focus-visible:ring-ring flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function BusinessSwitcher({
  context,
  isPending,
  onSwitch,
}: {
  context: CustomerPortalContextData;
  isPending: boolean;
  onSwitch: (businessId: string) => void;
}) {
  if (context.memberships.length <= 1) {
    return null;
  }

  return (
    <select
      className="border-input bg-background focus-visible:ring-ring mt-3 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      value={context.business.id}
      onChange={(event) => onSwitch(event.target.value)}
      disabled={isPending}
      aria-label="Switch business"
    >
      {context.memberships.map((membership) => (
        <option key={membership.businessId} value={membership.businessId}>
          {membership.businessName}
        </option>
      ))}
    </select>
  );
}

export function CustomerPortalShell({ context, children }: CustomerPortalShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const switchBusiness = (businessId: string) => {
    startTransition(async () => {
      await switchCustomerBusinessAction(businessId);
      router.refresh();
    });
  };

  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <div className="bg-muted/20 flex min-h-screen">
      <SkipToContent />

      <aside
        className="bg-background hidden w-72 shrink-0 border-r lg:block"
        aria-label="Customer portal navigation"
      >
        <div className="flex h-full flex-col">
          <div className="border-b p-4">
            <p className="text-sm font-semibold">{context.business.businessName}</p>
            <p className="text-muted-foreground text-xs">Customer Portal</p>
            <BusinessSwitcher context={context} isPending={isPending} onSwitch={switchBusiness} />
          </div>
          <nav className="flex-1 overflow-y-auto p-3">
            <CustomerPortalNav pathname={pathname} />
          </nav>
          <div className="border-t p-4">
            <form action="/api/auth/logout" method="post">
              <Button type="submit" variant="outline" className="w-full justify-start gap-2">
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background flex items-center justify-between gap-3 border-b px-4 py-3 lg:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{context.userFullName}</p>
            <p className="text-muted-foreground truncate text-xs">{context.userEmail}</p>
          </div>

          <Drawer open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <DrawerTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 lg:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="h-4 w-4" aria-hidden="true" />
                Menu
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[85vh]">
              <DrawerHeader className="border-b text-left">
                <DrawerTitle>{context.business.businessName}</DrawerTitle>
                <p className="text-muted-foreground text-sm">Customer Portal</p>
                <BusinessSwitcher
                  context={context}
                  isPending={isPending}
                  onSwitch={switchBusiness}
                />
              </DrawerHeader>
              <nav className="overflow-y-auto p-4" aria-label="Customer portal navigation">
                <CustomerPortalNav pathname={pathname} onNavigate={closeMobileNav} />
              </nav>
              <div className="border-t p-4">
                <form action="/api/auth/logout" method="post">
                  <DrawerClose asChild>
                    <Button type="submit" variant="outline" className="w-full justify-start gap-2">
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      Sign out
                    </Button>
                  </DrawerClose>
                </form>
              </div>
            </DrawerContent>
          </Drawer>
        </header>

        <main id="main-content" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
