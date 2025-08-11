import { Container } from "@/components/ui/container";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useShop } from "@/context/shop-context";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { FormEvent } from "react";

export default function Cart() {
  const { cart, removeFromCart } = useShop();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const total = cart.reduce((sum, i) => sum + i.price * (i.quantity || 1), 0);

  const handleBuy = (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to purchase items");
      navigate("/auth/login");
      return;
    }
    
    // In a real application, this would integrate with a payment system
    toast.success("Order placed successfully!");
    // Clear cart after purchase
    cart.forEach(item => removeFromCart(item.id));
  };

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
                      <p className="text-sm">Quantity: {item.quantity || 1}</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => removeFromCart(item.id)}>Remove</Button>
                </div>
              ))}
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="font-semibold">Total</p>
                <p className="font-bold text-primary">{total.toLocaleString()} ETB</p>
              </div>
              <div className="flex justify-end">
                <Button className="bg-primary hover:bg-primary/90" onClick={handleBuy}>
                  Proceed to Checkout
                </Button>
              </div>
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </div>
  );
}
