import { FormEvent, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Container } from "@/components/ui/container";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { toast } from "sonner";

export default function AuthLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    
    if (success) {
      const role = email.includes("admin") ? "admin" : email.includes("vendor") ? "vendor" : "user";
      navigate(role === "admin" ? "/admin" : role === "vendor" ? "/dashboard" : from, { replace: true });
    } else {
      toast.error("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-16">
        <Container className="max-w-md">
          <h1 className="text-2xl font-bold mb-6">Sign in</h1>
          <form onSubmit={onSubmit} className="space-y-4" aria-label="Login form">
            <div>
              <label className="block text-sm mb-1" htmlFor="email">Email</label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm mb-1" htmlFor="password">Password</label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">Continue</Button>
            <p className="text-xs text-muted-foreground">Tip: use an email with the word "admin" or "vendor" to preview roles.</p>
            <p className="text-sm">No account? <a className="underline" href="/auth/register">Register</a></p>
          </form>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
