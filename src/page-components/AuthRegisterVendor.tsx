'use client'

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Container } from "@/components/ui/container";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Loader2, Store, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function AuthRegisterVendor() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    tradeLicense: "",
    tinNumber: "",
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!formData.acceptTerms) {
      toast.error("Please accept the terms and conditions");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/register-vendor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          tradeLicense: formData.tradeLicense,
          tinNumber: formData.tinNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Registration failed');
        setIsLoading(false);
        return;
      }

      // Store token
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }

      toast.success(data.message || 'Vendor registration successful! Your account is pending verification.');
      router.push("/dashboard");
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordsMatch = formData.password === formData.confirmPassword;
  const isFormValid = formData.firstName && formData.lastName && formData.email && 
                     formData.password && formData.confirmPassword && 
                     passwordsMatch && formData.acceptTerms &&
                     formData.tradeLicense && formData.tinNumber;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-16">
        <Container className="max-w-2xl">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Store className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Create Vendor Account</h1>
            <p className="text-muted-foreground">Join our marketplace as a vendor and start selling</p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Verification Required</p>
                <p className="text-blue-700 dark:text-blue-300">
                  Your vendor account will be reviewed by our admin team. You can list products immediately, 
                  but they will be marked as "unverified" until your account is approved.
                </p>
              </div>
            </div>
          </div>
          
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="firstName">
                  First Name <span className="text-destructive">*</span>
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
                  Last Name <span className="text-destructive">*</span>
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
                Email Address <span className="text-destructive">*</span>
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
                Phone Number
              </label>
              <Input 
                id="phone"
                type="tel" 
                value={formData.phone} 
                onChange={(e) => handleInputChange('phone', e.target.value)} 
                placeholder="+251 91 234 5678"
                disabled={isLoading}
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Business Information</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="tradeLicense">
                    Trade License Number <span className="text-destructive">*</span>
                  </label>
                  <Input 
                    id="tradeLicense"
                    type="text" 
                    value={formData.tradeLicense} 
                    onChange={(e) => handleInputChange('tradeLicense', e.target.value)} 
                    required 
                    placeholder="Enter your trade license number"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="tinNumber">
                    TIN Number <span className="text-destructive">*</span>
                  </label>
                  <Input 
                    id="tinNumber"
                    type="text" 
                    value={formData.tinNumber} 
                    onChange={(e) => handleInputChange('tinNumber', e.target.value)} 
                    required 
                    placeholder="Enter your TIN number"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Security</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="password">
                    Password <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Input 
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password} 
                      onChange={(e) => handleInputChange('password', e.target.value)} 
                      required 
                      placeholder="Create a secure password (min. 8 characters)"
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
                    Confirm Password <span className="text-destructive">*</span>
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
              </div>
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
                  Creating Vendor Account...
                </>
              ) : (
                "Create Vendor Account"
              )}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Want to register as a customer?{" "}
                <Link 
                  href="/auth/register" 
                  className="text-primary hover:text-primary/80 font-medium underline"
                >
                  Register here
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
