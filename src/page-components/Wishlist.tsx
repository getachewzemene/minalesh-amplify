'use client'

import { Container } from "@/components/ui/container";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useShop } from "@/context/shop-context";
import { Button } from "@/components/ui/button";

export default function Wishlist() {
  const { wishlist, removeFromWishlist, addToCart } = useShop();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-10">
        <Container>
          <h1 className="text-2xl font-bold mb-6">Your Wishlist</h1>
          {wishlist.length === 0 ? (
            <p className="text-muted-foreground">No items in wishlist.</p>
          ) : (
            <div className="space-y-4">
              {wishlist.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-card rounded-lg shadow-card">
                  <div className="flex items-center gap-4">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" loading="lazy" />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.price.toLocaleString()} ETB</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => removeFromWishlist(item.id)}>Remove</Button>
                    <Button className="bg-primary hover:bg-primary/90" onClick={() => addToCart(item)}>Add to Cart</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </div>
  );
}
