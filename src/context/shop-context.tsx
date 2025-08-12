import { createContext, useContext, useEffect, useMemo, useState } from "react";

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category?: string;
  vendor?: string;
  hasAR?: boolean;
  quantity?: number; // Add quantity property
}

interface ShopContextValue {
  cart: ShopItem[];
  wishlist: ShopItem[];
  addToCart: (item: ShopItem) => void;
  removeFromCart: (id: string) => void;
  updateCartQuantity: (id: string, quantity: number) => void; // Add function to update quantity
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
    setCart((prev) => {
      const existingItem = prev.find((i) => i.id === item.id);
      if (existingItem) {
        // If item already exists, increment quantity
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: (i.quantity || 1) + 1 } : i
        );
      } else {
        // If new item, add with quantity 1
        return [...prev, { ...item, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };
  
  const updateCartQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const addToWishlist = (item: ShopItem) => {
    setWishlist((prev) => (prev.find((i) => i.id === item.id) ? prev : [...prev, item]));
  };

  const removeFromWishlist = (id: string) => {
    setWishlist((prev) => prev.filter((i) => i.id !== id));
  };

  const value = useMemo(
    () => ({ cart, wishlist, addToCart, removeFromCart, updateCartQuantity, addToWishlist, removeFromWishlist }),
    [cart, wishlist]
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export const useShop = () => {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used within ShopProvider");
  return ctx;
};
