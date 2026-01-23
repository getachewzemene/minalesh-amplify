'use client'

import { Container } from "@/components/ui/container";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useShop } from "@/context/shop-context";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Minus, Plus, X, Gift } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PAYMENT_METHODS, PAYMENT_INSTRUCTIONS, PaymentMethod } from "@/types/payment";
import { formatCurrency } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

export default function Cart() {
  const { cart, removeFromCart, updateCartQuantity } = useShop();
  const { user } = useAuth();
  const router = useRouter();
  
  const total = cart.reduce((sum, i) => sum + i.price * (i.quantity || 1), 0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [teleBirrPhone, setTeleBirrPhone] = useState('');
  const [teleBirrReference, setTeleBirrReference] = useState('');
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);

  // Fetch loyalty account when user is logged in
  useEffect(() => {
    if (user) {
      fetchLoyaltyAccount();
    }
  }, [user]);

  const fetchLoyaltyAccount = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/loyalty/account', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLoyaltyPoints(data.points || 0);
      }
    } catch (error) {
      console.error('Failed to fetch loyalty account:', error);
    }
  };

  // Calculate discount when points change
  useEffect(() => {
    if (usePoints && pointsToRedeem > 0) {
      // 100 points = 10 ETB, so 1 point = 0.1 ETB
      const discount = pointsToRedeem * 0.1;
      setLoyaltyDiscount(Math.min(discount, total)); // Can't discount more than total
    } else {
      setLoyaltyDiscount(0);
    }
  }, [usePoints, pointsToRedeem, total]);

  const finalTotal = Math.max(0, total - loyaltyDiscount);

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
        loyaltyPointsToRedeem: usePoints ? pointsToRedeem : undefined,
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
              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Subtotal</p>
                  <p className="text-sm">{formatCurrency(total)}</p>
                </div>
                {loyaltyDiscount > 0 && (
                  <div className="flex items-center justify-between text-green-600">
                    <p className="text-sm">Loyalty Discount</p>
                    <p className="text-sm">-{formatCurrency(loyaltyDiscount)}</p>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t">
                  <p className="font-semibold">Total</p>
                  <p className="font-bold text-primary">{formatCurrency(finalTotal)}</p>
                </div>
              </div>

              {/* Loyalty Points Redemption */}
              {user && loyaltyPoints > 0 && (
                <div className="p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-blue-50">
                  <div className="flex items-center gap-2 mb-3">
                    <Gift className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold">Loyalty Rewards</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    You have <span className="font-bold text-purple-600">{loyaltyPoints}</span> points available
                    (Worth {formatCurrency(loyaltyPoints * 0.1)})
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <Checkbox 
                      id="usePoints" 
                      checked={usePoints}
                      onCheckedChange={(checked) => {
                        setUsePoints(checked as boolean);
                        if (!checked) {
                          setPointsToRedeem(0);
                        }
                      }}
                    />
                    <label htmlFor="usePoints" className="text-sm font-medium cursor-pointer">
                      Use loyalty points for this order
                    </label>
                  </div>
                  {usePoints && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Points to redeem</label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max={Math.min(loyaltyPoints, Math.floor(total * 10))}
                          value={pointsToRedeem}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            const maxPoints = Math.min(loyaltyPoints, Math.floor(total * 10));
                            setPointsToRedeem(Math.min(value, maxPoints));
                          }}
                          className="flex-1"
                          placeholder="Enter points"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const maxPoints = Math.min(loyaltyPoints, Math.floor(total * 10));
                            setPointsToRedeem(maxPoints);
                          }}
                        >
                          Max
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        100 points = {formatCurrency(10)} discount
                      </p>
                    </div>
                  )}
                </div>
              )}

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
