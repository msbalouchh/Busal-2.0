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
      <ul className="mx-auto mt-6 flex max-w-5xl flex-wrap items-center justify-center gap-x-6 gap-y-4 px-4">
        {CUSTOMER_LOGOS.map((logo) => (
          <li key={logo.name} className="flex items-center gap-2.5">
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[0.625rem] font-bold text-white"
              style={{ background: logo.gradient }}
              aria-hidden="true"
            >
              {logo.mark}
            </span>
            <span className="font-marketing-display text-marketing-ink/75 text-base tracking-tight sm:text-lg">
              {logo.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
