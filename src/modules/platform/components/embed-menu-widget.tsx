"use client";

import { useEffect, useState } from "react";

interface EmbedMenuWidgetProps {
  businessId: string;
  token: string;
}

export function EmbedMenuWidget({ businessId, token }: EmbedMenuWidgetProps) {
  const [items, setItems] = useState<Array<{ id: string; name: string; pricePence?: number }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMenu() {
      try {
        const response = await fetch(
          `/api/embed/menu?businessId=${encodeURIComponent(businessId)}&token=${encodeURIComponent(token)}`,
        );
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error ?? "Unable to load menu");
        }
        setItems(payload.data?.items ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load menu");
      } finally {
        setLoading(false);
      }
    }

    void loadMenu();
  }, [businessId, token]);

  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading menu…</p>;
  }

  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">No menu items available.</p>
      ) : (
        items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
            <span className="font-medium">{item.name}</span>
            {item.pricePence != null ? (
              <span className="text-muted-foreground text-sm">
                £{(item.pricePence / 100).toFixed(2)}
              </span>
            ) : null}
          </div>
        ))
      )}
    </div>
  );
}
