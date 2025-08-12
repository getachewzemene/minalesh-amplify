import { Container } from "@/components/ui/container";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useShop } from "@/context/shop-context";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Minus, Plus, X } from "lucide-react";

export default function Cart() {
  const { cart, removeFromCart, updateCartQuantity } = useShop();
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
    
    // TODO: Stripe Checkout integration with Supabase Edge Function
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
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => updateCartQuantity(item.id, (item.quantity || 1) - 1)}
                      disabled={(item.quantity || 1) <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input 
                      type="number" 
                      value={item.quantity || 1} 
                      onChange={(e) => updateCartQuantity(item.id, parseInt(e.target.value) || 1)}
                      className="w-16 text-center"
                      min="1"
                    />
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => updateCartQuantity(item.id, (item.quantity || 1) + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => removeFromCart(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
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
