"use client";

import { useState, useTransition } from "react";

import {
  installMarketplacePlatformItemAction,
  purchaseMarketplacePlatformItemAction,
  submitMarketplacePlatformReviewAction,
  uninstallMarketplacePlatformItemAction,
} from "@/modules/marketplace-platform/actions/marketplace-platform-actions";
import type {
  MarketplacePlatformPermissions,
  MarketplaceProductDetailView,
} from "@/modules/marketplace-platform/types/marketplace-platform-types";

interface MarketplaceProductPanelProps {
  product: MarketplaceProductDetailView;
  permissions: MarketplacePlatformPermissions;
}

export function MarketplaceProductPanel({ product, permissions }: MarketplaceProductPanelProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [isPending, startTransition] = useTransition();

  const runAction = (action: () => Promise<unknown>, successMessage: string) => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await action();
        setMessage(successMessage);
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "Action failed");
      }
    });
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[2fr_1fr]">
      <div className="space-y-6">
        <div className="rounded-lg border p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">{product.name}</h2>
              <p className="text-muted-foreground text-sm">
                {product.category.replaceAll("_", " ")} · {product.publisherName}
                {product.publisherVerified ? " · Verified" : ""}
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="font-medium">
                {product.pricingType === "FREE"
                  ? "Free"
                  : `£${(product.priceCents / 100).toFixed(2)}`}
              </p>
              <p>
                {product.averageRating.toFixed(1)} ★ ({product.reviewCount} reviews)
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed">{product.description}</p>

          {product.screenshots.length > 0 ? (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {product.screenshots.map((screenshot) => (
                <div
                  key={screenshot}
                  className="bg-muted flex h-32 items-center justify-center rounded-lg border text-sm"
                >
                  {screenshot}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="rounded-lg border p-6">
          <h3 className="mb-3 font-semibold">Features & compatibility</h3>
          <ul className="space-y-2 text-sm">
            <li>Version: {product.versionLabel ?? "—"}</li>
            <li>License: {product.licenseType}</li>
            <li>Downloads: {product.downloadCount.toLocaleString()}</li>
            {product.compatibility?.minBusalVersion ? (
              <li>Minimum Busal version: {String(product.compatibility.minBusalVersion)}</li>
            ) : null}
            {product.compatibility?.requiresAi === true ? <li>Requires AI features</li> : null}
          </ul>
          {product.dependencies.length > 0 ? (
            <p className="text-muted-foreground mt-3 text-sm">
              Dependencies: {product.dependencies.join(", ")}
            </p>
          ) : null}
          {product.permissionsRequired.length > 0 ? (
            <p className="text-muted-foreground mt-3 text-sm">
              Permissions required: {product.permissionsRequired.join(", ")}
            </p>
          ) : null}
        </div>

        {product.changelog ? (
          <div className="rounded-lg border p-6">
            <h3 className="mb-3 font-semibold">Release notes</h3>
            <p className="text-sm whitespace-pre-wrap">{product.changelog}</p>
          </div>
        ) : null}

        <div className="rounded-lg border p-6">
          <h3 className="mb-3 font-semibold">Reviews</h3>
          {product.reviews.length === 0 ? (
            <p className="text-muted-foreground text-sm">No reviews yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {product.reviews.map((review) => (
                <li key={review.id} className="border-b pb-3 last:border-b-0">
                  <p className="font-medium">
                    {review.rating} ★ {review.title ? `· ${review.title}` : ""}
                  </p>
                  {review.content ? (
                    <p className="text-muted-foreground mt-1">{review.content}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <aside className="space-y-4">
        {message ? (
          <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="text-destructive rounded-lg border p-3 text-sm" role="alert">
            {error}
          </p>
        ) : null}

        <div className="rounded-lg border p-4">
          <h3 className="mb-3 font-semibold">Installation</h3>
          <p className="text-muted-foreground mb-3 text-sm">
            Status: {product.isInstalled ? product.installationStatus : "Not installed"}
          </p>
          <div className="flex flex-col gap-2">
            {permissions.canInstall && !product.isInstalled ? (
              <button
                type="button"
                disabled={isPending}
                className="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm disabled:opacity-50"
                onClick={() =>
                  runAction(
                    () => installMarketplacePlatformItemAction(product.id),
                    "Installation started successfully.",
                  )
                }
              >
                Install
              </button>
            ) : null}
            {permissions.canPurchase && product.pricingType === "PAID" ? (
              <button
                type="button"
                disabled={isPending}
                className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                onClick={() =>
                  runAction(
                    () => purchaseMarketplacePlatformItemAction(product.id),
                    "Purchase completed successfully.",
                  )
                }
              >
                Purchase license
              </button>
            ) : null}
            {permissions.canInstall && product.isInstalled ? (
              <button
                type="button"
                disabled={isPending}
                className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                onClick={() =>
                  runAction(
                    () => uninstallMarketplacePlatformItemAction(product.id),
                    "Item uninstalled successfully.",
                  )
                }
              >
                Uninstall
              </button>
            ) : null}
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="mb-3 font-semibold">Publisher</h3>
          <p className="font-medium">{product.publisherName}</p>
          {product.publisherDescription ? (
            <p className="text-muted-foreground mt-2 text-sm">{product.publisherDescription}</p>
          ) : null}
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="mb-3 font-semibold">Version history</h3>
          {product.versions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No versions published.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {product.versions.map((version) => (
                <li key={version.id}>
                  v{version.versionLabel} · #{version.versionNumber}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="mb-3 font-semibold">Write a review</h3>
          <div className="space-y-3">
            <select
              className="bg-background w-full rounded-md border px-3 py-2 text-sm"
              value={rating}
              onChange={(event) => setRating(Number(event.target.value))}
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value} stars
                </option>
              ))}
            </select>
            <input
              className="bg-background w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Review title"
              value={reviewTitle}
              onChange={(event) => setReviewTitle(event.target.value)}
            />
            <textarea
              className="bg-background min-h-[88px] w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Share your experience"
              value={reviewContent}
              onChange={(event) => setReviewContent(event.target.value)}
            />
            <button
              type="button"
              disabled={isPending}
              className="bg-primary text-primary-foreground w-full rounded-md px-3 py-2 text-sm disabled:opacity-50"
              onClick={() =>
                runAction(
                  () =>
                    submitMarketplacePlatformReviewAction({
                      itemId: product.id,
                      rating,
                      title: reviewTitle || undefined,
                      content: reviewContent || undefined,
                    }),
                  "Review submitted successfully.",
                )
              }
            >
              Submit review
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
