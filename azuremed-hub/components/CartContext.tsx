"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageContext";

export interface CartItem {
  id: number; // cart_items.id
  medicineId: number;
  name: string;
  category: string;
  image_url: string | null;
  price: number;
  quantity: number;
  stock_qty: number;
  reserved_qty: number;
  // MySQL DATETIME string ("YYYY-MM-DD HH:MM:SS"), or null for rows created
  // before this feature shipped. When this passes, the item's hold on stock
  // has lapsed server-side — see lib/cartReservation.ts.
  reservedUntil: string | null;
}

export interface WishlistItem {
  id: number; // medicine id
  name: string;
  category: string;
  image_url: string | null;
  price: number;
  quantity: number;
}

interface CartContextValue {
  cartItems: CartItem[];
  cartCount: number;
  wishlistItems: WishlistItem[];
  wishlistCount: number;
  activePanel: "cart" | "wishlist" | null;
  toast: string | null;
  openCart: () => void;
  openWishlist: () => void;
  closePanel: () => void;
  addToCart: (product: { id: number; name: string; category: string; image_url: string | null; price: number }, qty?: number) => Promise<void>;
  updateCartQty: (medicineId: number, qty: number) => Promise<void>;
  removeFromCart: (medicineId: number) => Promise<void>;
  /** Re-fetches the cart from the server — exposed so a lapsed reservation
   *  countdown (CartPanel) can drop its own item without waiting for the
   *  next unrelated cart mutation to trigger a refresh. */
  refreshCart: () => Promise<void>;
  toggleFavorite: (product: { id: number; name: string; category: string; image_url: string | null; price: number }) => void;
  isFavorite: (id: number) => boolean;
  removeFromWishlist: (id: number) => void;
  clearWishlist: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function wishlistKey(userId: string) {
  return `azuremed:wishlist:${userId}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const userId = session?.user?.id;

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [activePanel, setActivePanel] = useState<"cart" | "wishlist" | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 1800);
  }, []);

  const refreshCart = useCallback(async () => {
    if (!userId) {
      setCartItems([]);
      return;
    }
    // Called on every mount, after every mutation, AND once a second by
    // ReservationCountdown's onExpire in CartPanel — a bare fetch() here
    // means any transient network hiccup (dev-server hot-reload dropping an
    // in-flight request, a brief connectivity blip) throws an unhandled
    // rejection straight up to Next's dev error overlay ("TypeError:
    // NetworkError when attempting to fetch resource"). Failing to refresh
    // isn't fatal — the cart just stays as it was — so this degrades
    // silently instead of crashing the page.
    try {
      const result = await fetch("/api/cart").then((r) => r.json());
      if (result.success) setCartItems(result.data.items);
    } catch (error) {
      console.error("[cart] refresh failed:", error);
    }
  }, [userId]);

  useEffect(() => {
    refreshCart();
    if (userId) {
      const raw = localStorage.getItem(wishlistKey(userId));
      setWishlistItems(raw ? JSON.parse(raw) : []);
    } else {
      setWishlistItems([]);
    }
  }, [userId, refreshCart]);

  useEffect(() => {
    if (userId) localStorage.setItem(wishlistKey(userId), JSON.stringify(wishlistItems));
  }, [wishlistItems, userId]);

  const addToCart = useCallback(
    async (product: { id: number; name: string; category: string; image_url: string | null; price: number }, qty = 1) => {
      if (!userId) {
        router.push("/login");
        return;
      }
      let result;
      try {
        result = await fetch("/api/cart/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: product.id, qty }),
        }).then((r) => r.json());
      } catch {
        showToast(t("toast.networkErrorAddToCart"));
        return;
      }

      if (!result.success) {
        showToast(result.message ?? t("toast.couldNotAddToCart"));
        return;
      }
      showToast(t("toast.itemAddedToCart"));
      await refreshCart();
      // Product listing/detail pages are Server Components — they fetch
      // stock_qty/reserved_qty once per page load and have no way to know a
      // client-side cart mutation just changed reserved_qty server-side.
      // router.refresh() re-runs them against the current URL without a full
      // reload, so "available" counts/out-of-stock state update immediately
      // instead of only on the next real navigation.
      router.refresh();
    },
    [userId, router, refreshCart, showToast, t]
  );

  const updateCartQty = useCallback(
    async (medicineId: number, qty: number) => {
      try {
        if (qty <= 0) {
          await fetch(`/api/cart/items/${medicineId}`, { method: "DELETE" });
        } else {
          const result = await fetch(`/api/cart/items/${medicineId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ qty }),
          }).then((r) => r.json());
          // Not fatal either way — refreshCart() below re-syncs the true DB
          // state regardless, but without this the user gets no explanation
          // when a quantity bump silently gets rejected or clamped (e.g. stock
          // ran out or dropped below what they asked for after page load).
          if (!result.success) {
            showToast(result.message ?? t("toast.couldNotUpdateQuantity"));
          } else if (result.data?.qty && result.data.qty < qty) {
            showToast(t("toast.onlyInStock").replace("{qty}", String(result.data.qty)));
          }
        }
      } catch {
        showToast(t("toast.networkErrorUpdateQuantity"));
      }
      await refreshCart();
      router.refresh();
    },
    [refreshCart, router, showToast, t]
  );

  const removeFromCart = useCallback(
    async (medicineId: number) => {
      try {
        await fetch(`/api/cart/items/${medicineId}`, { method: "DELETE" });
      } catch {
        showToast(t("toast.networkErrorRemoveItem"));
      }
      await refreshCart();
      router.refresh();
    },
    [refreshCart, router, showToast, t]
  );

  const isFavorite = useCallback((id: number) => wishlistItems.some((item) => item.id === id), [wishlistItems]);

  const toggleFavorite = useCallback(
    (product: { id: number; name: string; category: string; image_url: string | null; price: number }) => {
      if (!userId) {
        router.push("/login");
        return;
      }
      setWishlistItems((prev) => {
        const exists = prev.some((item) => item.id === product.id);
        if (exists) {
          showToast(t("toast.removedFromFavorites"));
          return prev.filter((item) => item.id !== product.id);
        }
        showToast(t("toast.addedToFavorites"));
        return [...prev, { ...product, quantity: 1 }];
      });
    },
    [userId, router, showToast, t]
  );

  const removeFromWishlist = useCallback((id: number) => {
    setWishlistItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearWishlist = useCallback(() => setWishlistItems([]), []);

  const value: CartContextValue = {
    cartItems,
    cartCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    wishlistItems,
    wishlistCount: wishlistItems.length,
    activePanel,
    toast,
    openCart: () => setActivePanel("cart"),
    openWishlist: () => setActivePanel("wishlist"),
    closePanel: () => setActivePanel(null),
    addToCart,
    updateCartQty,
    removeFromCart,
    refreshCart,
    toggleFavorite,
    isFavorite,
    removeFromWishlist,
    clearWishlist,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
