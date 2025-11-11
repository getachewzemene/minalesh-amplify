'use client'

import { Container } from "@/components/ui/container";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useShop } from "@/context/shop-context";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { Minus, Plus, X } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PAYMENT_METHODS, PAYMENT_INSTRUCTIONS, PaymentMethod } from "@/types/payment";
import { formatCurrency } from "@/lib/utils";

export default function Cart() {
  const { cart, removeFromCart, updateCartQuantity } = useShop();
  const { user } = useAuth();
  const router = useRouter();
  
  const total = cart.reduce((sum, i) => sum + i.price * (i.quantity || 1), 0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [teleBirrPhone, setTeleBirrPhone] = useState('');
  const [teleBirrReference, setTeleBirrReference] = useState('');

  const handleBuy = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to purchase items");
      router.push("/auth/login");
      return;
    }
    try {
      // Basic payload for order creation (server will compute authoritative totals)
      const payload = {
        items: cart.map(i => ({ id: i.id, quantity: i.quantity || 1, price: i.price })),
        paymentMethod,
        paymentMeta: paymentMethod === 'TeleBirr' ? {
          phone: teleBirrPhone,
          reference: teleBirrReference,
        } : undefined,
        // Placeholder shipping/billing, extend later
        shippingAddress: null,
        billingAddress: null,
      };
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to create order');
        return;
      }
      toast.success(`Order created with ${paymentMethod}. ${paymentMethod === 'COD' ? 'Please prepare payment on delivery.' : 'Follow payment instructions.'}`);
      // Clear cart after successful order creation
      cart.forEach(item => removeFromCart(item.id));
      router.push('/orders');
    } catch (err) {
      console.error('Checkout error', err);
      toast.error('Checkout failed');
    }
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
                      <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
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
                <p className="font-bold text-primary">{formatCurrency(total)}</p>
              </div>
              {/* Payment Method Selection */}
              <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                <h2 className="text-lg font-semibold mb-2">Payment Method</h2>
                <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)} className="grid gap-3 md:grid-cols-2">
                  {PAYMENT_METHODS.map(pm => (
                    <label key={pm.key} className="flex items-start gap-3 p-3 rounded-md border bg-background hover:bg-muted cursor-pointer">
                      <RadioGroupItem value={pm.key} />
                      <span className="text-sm">
                        <span className="font-medium block">{pm.label}</span>
                        {pm.description && <span className="text-muted-foreground text-xs">{pm.description}</span>}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
                <div className="mt-4 text-xs text-muted-foreground whitespace-pre-line">
                  {PAYMENT_INSTRUCTIONS[paymentMethod]}
                </div>
                {paymentMethod === 'TeleBirr' && (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">TeleBirr Phone</label>
                      <Input
                        placeholder="09XXXXXXXX"
                        value={teleBirrPhone}
                        onChange={(e) => setTeleBirrPhone(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Payment Reference</label>
                      <Input
                        placeholder="Reference code"
                        value={teleBirrReference}
                        onChange={(e) => setTeleBirrReference(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-4">
                <Button className="bg-primary hover:bg-primary/90" onClick={handleBuy}>
                  Place Order
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
