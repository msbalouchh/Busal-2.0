import { cn } from "@/lib/utils";

export function MarketingSection({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn("mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8", className)}
    >
      {children}
    </section>
  );
}

export function MarketingEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-marketing-accent mb-3 text-xs font-semibold tracking-[0.18em] uppercase">
      {children}
    </p>
  );
}

export function MarketingHeading({
  children,
  as: Tag = "h2",
  className,
}: {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  return (
    <Tag
      className={cn(
        "font-marketing-display text-marketing-ink max-w-4xl text-pretty",
        Tag === "h1" && "text-4xl leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.25rem]",
        Tag === "h2" && "text-3xl leading-tight tracking-tight sm:text-4xl",
        Tag === "h3" && "text-xl leading-snug tracking-tight sm:text-2xl",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function MarketingLead({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-marketing-muted mt-4 max-w-2xl text-base text-pretty sm:text-lg",
        className,
      )}
    >
      {children}
    </p>
  );
}
