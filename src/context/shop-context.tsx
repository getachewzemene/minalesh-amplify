import { createContext, useContext, useEffect, useMemo, useState } from "react";

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category?: string;
  vendor?: string;
  hasAR?: boolean;
}

interface ShopContextValue {
  cart: ShopItem[];
  wishlist: ShopItem[];
  addToCart: (item: ShopItem) => void;
  removeFromCart: (id: string) => void;
  addToWishlist: (item: ShopItem) => void;
  removeFromWishlist: (id: string) => void;
}

const ShopContext = createContext<ShopContextValue | undefined>(undefined);

export const ShopProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<ShopItem[]>([]);
  const [wishlist, setWishlist] = useState<ShopItem[]>([]);

  useEffect(() => {
    try {
      const c = localStorage.getItem("shop_cart");
      const w = localStorage.getItem("shop_wishlist");
      if (c) setCart(JSON.parse(c));
      if (w) setWishlist(JSON.parse(w));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("shop_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("shop_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  const addToCart = (item: ShopItem) => {
    setCart((prev) => (prev.find((i) => i.id === item.id) ? prev : [...prev, item]));
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const addToWishlist = (item: ShopItem) => {
    setWishlist((prev) => (prev.find((i) => i.id === item.id) ? prev : [...prev, item]));
  };

  const removeFromWishlist = (id: string) => {
    setWishlist((prev) => prev.filter((i) => i.id !== id));
  };

  const value = useMemo(
    () => ({ cart, wishlist, addToCart, removeFromCart, addToWishlist, removeFromWishlist }),
    [cart, wishlist]
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export const useShop = () => {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used within ShopProvider");
  return ctx;
};
