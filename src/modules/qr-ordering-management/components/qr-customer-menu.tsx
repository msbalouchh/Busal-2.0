"use client";

import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { parseStoredCart, serializeCart } from "@/modules/qr-ordering-management/lib/qr-cart-utils";
import {
  getQrCartStorageKey,
  QR_PUBLIC_ROUTES,
} from "@/modules/qr-ordering-management/constants/routes";
import {
  QrCartDrawer,
  QrFloatingCartButton,
} from "@/modules/qr-ordering-management/components/qr-cart-drawer";
import { QrCategoryNav } from "@/modules/qr-ordering-management/components/qr-category-nav";
import { QrProductCard } from "@/modules/qr-ordering-management/components/qr-product-card";
import { QrProductDetail } from "@/modules/qr-ordering-management/components/qr-product-detail";
import { QrServiceActions } from "@/modules/qr-ordering-management/components/qr-service-actions";
import type {
  QrCartItem,
  QrMenuCategory,
  QrMenuProduct,
  QrSessionRecord,
} from "@/modules/qr-ordering-management/types/qr-ordering-types";

interface QrCustomerMenuProps {
  tableToken: string;
  session: QrSessionRecord;
  categories: QrMenuCategory[];
  products: QrMenuProduct[];
}

function readInitialCart(tableToken: string): QrCartItem[] {
  if (typeof window === "undefined") return [];
  return parseStoredCart(localStorage.getItem(getQrCartStorageKey(tableToken))).items;
}

function persistCart(tableToken: string, items: QrCartItem[]) {
  localStorage.setItem(
    getQrCartStorageKey(tableToken),
    serializeCart({ items, updatedAt: new Date().toISOString() }),
  );
}

export function QrCustomerMenu({ tableToken, session, categories, products }: QrCustomerMenuProps) {
  const [cartItems, setCartItems] = useState<QrCartItem[]>(() => readInitialCart(tableToken));
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<QrMenuProduct | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [, startTransition] = useTransition();

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = !activeCategoryId || product.categoryId === activeCategoryId;
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.shortDescription?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategoryId, search]);

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const updateCart = (updater: (items: QrCartItem[]) => QrCartItem[]) => {
    startTransition(() => {
      setCartItems((current) => {
        const next = updater(current);
        persistCart(tableToken, next);
        return next;
      });
    });
  };

  return (
    <div className="bg-background mx-auto min-h-screen max-w-lg pb-28">
      <header className="bg-background/95 sticky top-0 z-30 border-b px-4 py-4 backdrop-blur">
        <p className="text-muted-foreground text-xs">{session.branchName}</p>
        <h1 className="text-xl font-semibold">{session.businessName}</h1>
        <p className="text-muted-foreground text-sm">{session.tableLabel}</p>
        <div className="mt-3 flex gap-2">
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href={QR_PUBLIC_ROUTES.orders(tableToken)}>
              <ClipboardList className="mr-2 h-4 w-4" />
              Orders
            </Link>
          </Button>
          {itemCount > 0 ? (
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href={QR_PUBLIC_ROUTES.cart(tableToken)}>View cart ({itemCount})</Link>
            </Button>
          ) : null}
        </div>
      </header>

      <main className="space-y-6 px-4 py-4">
        <QrServiceActions
          sessionToken={session.token}
          waiterRequestedAt={session.waiterRequestedAt}
          billRequestedAt={session.billRequestedAt}
        />

        <QrCategoryNav
          categories={categories}
          activeCategoryId={activeCategoryId}
          search={search}
          onCategoryChange={setActiveCategoryId}
          onSearchChange={setSearch}
        />

        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <QrProductCard key={product.id} product={product} onSelect={setSelectedProduct} />
          ))}
          {filteredProducts.length === 0 ? (
            <p className="text-muted-foreground text-center text-sm">No items match your search.</p>
          ) : null}
        </div>
      </main>

      <QrFloatingCartButton itemCount={itemCount} onClick={() => setCartOpen(true)} />

      <QrCartDrawer
        tableToken={tableToken}
        items={cartItems}
        open={cartOpen}
        onOpenChange={setCartOpen}
        onIncrease={(itemId) =>
          updateCart((items) =>
            items.map((item) =>
              item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item,
            ),
          )
        }
        onDecrease={(itemId) =>
          updateCart((items) =>
            items
              .map((item) =>
                item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item,
              )
              .filter((item) => item.quantity > 0),
          )
        }
        onRemove={(itemId) => updateCart((items) => items.filter((item) => item.id !== itemId))}
      />

      <QrProductDetail
        product={selectedProduct}
        open={Boolean(selectedProduct)}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
        onAdd={(item) => updateCart((items) => [...items, item])}
      />
    </div>
  );
}
