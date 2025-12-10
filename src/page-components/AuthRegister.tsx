'use client'

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Container } from "@/components/ui/container";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function AuthRegister() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      return; // Error already shown by validation
    }

    if (!formData.acceptTerms) {
      return; // Error already shown by validation
    }

    setIsLoading(true);
    
    const success = await register(formData.email, formData.password, {
      firstName: formData.firstName,
      lastName: formData.lastName,
      displayName: `${formData.firstName} ${formData.lastName}`.trim(),
    });
    
    if (success) {
      router.push("/auth/login");
    }
    
    setIsLoading(false);
  };

  const passwordsMatch = formData.password === formData.confirmPassword;
  const isFormValid = formData.firstName && formData.lastName && formData.email && 
                     formData.password && formData.confirmPassword && 
                     passwordsMatch && formData.acceptTerms;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-16">
        <Container className="max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Create Account</h1>
            <p className="text-muted-foreground">Join our marketplace today</p>
          </div>
          
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="firstName">
                  First Name
                </label>
                <Input 
                  id="firstName"
                  type="text" 
                  value={formData.firstName} 
                  onChange={(e) => handleInputChange('firstName', e.target.value)} 
                  required 
                  placeholder="John"
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="lastName">
                  Last Name
                </label>
                <Input 
                  id="lastName"
                  type="text" 
                  value={formData.lastName} 
                  onChange={(e) => handleInputChange('lastName', e.target.value)} 
                  required 
                  placeholder="Doe"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email Address
              </label>
              <Input 
                id="email"
                type="email" 
                value={formData.email} 
                onChange={(e) => handleInputChange('email', e.target.value)} 
                required 
                placeholder="john@example.com"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="phone">
                Phone Number (Optional)
              </label>
              <Input 
                id="phone"
                type="tel" 
                value={formData.phone} 
                onChange={(e) => handleInputChange('phone', e.target.value)} 
                placeholder="+1 (555) 123-4567"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Input 
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password} 
                  onChange={(e) => handleInputChange('password', e.target.value)} 
                  required 
                  placeholder="Create a secure password"
                  className="pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="relative">
                <Input 
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword} 
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)} 
                  required 
                  placeholder="Confirm your password"
                  className={`pr-10 ${formData.confirmPassword && !passwordsMatch ? 'border-destructive' : ''}`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {formData.confirmPassword && !passwordsMatch && (
                <p className="text-sm text-destructive">Passwords do not match</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="acceptTerms"
                checked={formData.acceptTerms}
                onCheckedChange={(checked) => handleInputChange('acceptTerms', checked as boolean)}
                disabled={isLoading}
              />
              <label htmlFor="acceptTerms" className="text-sm">
                I agree to the{" "}
                <Link href="/terms" className="text-primary hover:text-primary/80 underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary hover:text-primary/80 underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Want to sell on our marketplace?{" "}
                <Link 
                  href="/auth/register-vendor" 
                  className="text-primary hover:text-primary/80 font-medium underline"
                >
                  Register as a vendor
                </Link>
              </p>
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link 
                  href="/auth/login" 
                  className="text-primary hover:text-primary/80 font-medium underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </Container>
      </main>
      <Footer />
    </div>
  );
}