import { FormEvent, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Container } from "@/components/ui/container";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function AuthRegister() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth(); // Mock register -> login for demo
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login(email, password);
    const role = email.includes("admin") ? "admin" : email.includes("vendor") ? "vendor" : "user";
    navigate(role === "admin" ? "/admin" : role === "vendor" ? "/dashboard" : from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-16">
        <Container className="max-w-md">
          <h1 className="text-2xl font-bold mb-6">Create your account</h1>
          <form onSubmit={onSubmit} className="space-y-4" aria-label="Register form">
            <div>
              <label className="block text-sm mb-1" htmlFor="email">Email</label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm mb-1" htmlFor="password">Password</label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">Create Account</Button>
            <p className="text-xs text-muted-foreground">Tip: include the word "admin" or "vendor" in the email to preview those roles.</p>
            <p className="text-sm">Already have an account? <Link className="underline" to="/auth/login">Sign in</Link></p>
          </form>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
