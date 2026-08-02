import { CUSTOMER_LOGOS } from "@/modules/marketing/content/site-copy";

export function LogoCloud({
  title = "Trusted by operators across hospitality and retail",
}: {
  title?: string;
}) {
  return (
    <div className="border-marketing-line border-y py-10">
      <p className="text-marketing-muted text-center text-xs font-semibold tracking-[0.18em] uppercase">
        {title}
      </p>
      <ul className="mx-auto mt-6 flex max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-4 px-4">
        {CUSTOMER_LOGOS.map((name) => (
          <li
            key={name}
            className="font-marketing-display text-marketing-ink/55 text-lg tracking-tight sm:text-xl"
          >
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
}
