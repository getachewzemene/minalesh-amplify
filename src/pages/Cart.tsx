import { Container } from "@/components/ui/container";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useShop } from "@/context/shop-context";
import { Button } from "@/components/ui/button";

export default function Cart() {
  const { cart, removeFromCart } = useShop();
  const total = cart.reduce((sum, i) => sum + i.price, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-10">
        <Container>
          <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
          {cart.length === 0 ? (
            <p className="text-muted-foreground">Your cart is empty.</p>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-card rounded-lg shadow-card">
                  <div className="flex items-center gap-4">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" loading="lazy" />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.price.toLocaleString()} ETB</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => removeFromCart(item.id)}>Remove</Button>
                </div>
              ))}
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="font-semibold">Total</p>
                <p className="font-bold text-primary">{total.toLocaleString()} ETB</p>
              </div>
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </div>
  );
}
