import Link from "next/link";

import { cn } from "@/lib/utils";

interface NotificationCardProps {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  status: string;
  href?: string;
  className?: string;
}

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function NotificationCard({
  title,
  body,
  createdAt,
  status,
  href,
  className,
}: NotificationCardProps) {
  const content = (
    <div className={cn("space-y-1 rounded-lg border p-3", className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium">{title}</p>
        <span className="text-muted-foreground text-xs uppercase">{status}</span>
      </div>
      <p className="text-muted-foreground line-clamp-2 text-sm">{body}</p>
      <time className="text-muted-foreground text-xs" dateTime={createdAt}>
        {formatTimestamp(createdAt)}
      </time>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
