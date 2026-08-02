import { CONTACT_OFFICE } from "@/modules/marketing/content/site-copy";

export function OfficeMap() {
  return (
    <div className="border-marketing-line overflow-hidden rounded-3xl border">
      <iframe
        title="Busal Ltd office location on OpenStreetMap"
        src={CONTACT_OFFICE.mapEmbedUrl}
        className="h-52 w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="bg-marketing-panel flex items-center justify-between gap-3 px-4 py-3">
        <p className="text-marketing-muted text-xs">Covent Garden, London</p>
        <a
          href={CONTACT_OFFICE.mapLinkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-marketing-accent text-xs font-semibold underline-offset-4 hover:underline"
        >
          Open map
        </a>
      </div>
    </div>
  );
}
