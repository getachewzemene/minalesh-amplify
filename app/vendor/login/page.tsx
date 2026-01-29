'use client'

import { FormEvent, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Container } from "@/components/ui/container"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Eye, EyeOff, Loader2, Store } from "lucide-react"
import { toast } from "sonner"

export default function VendorLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Validate redirect URL to prevent open redirect vulnerabilities
  const isValidRedirectUrl = (url: string | null): boolean => {
    if (!url) return false
    // Must start with / but not //, and not contain ://
    return url.startsWith('/') && !url.startsWith('//') && !url.includes('://')
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Login failed')
        setIsLoading(false)
        return
      }

      // Check if user is a vendor or admin (admins can access vendor area)
      if (data.user.role !== 'vendor' && data.user.role !== 'admin') {
        toast.error('Access denied. This login is for vendors only. Please use customer login.')
        setIsLoading(false)
        return
      }

      // Store token in localStorage (matches existing auth pattern)
      localStorage.setItem('auth_token', data.token)
      
      toast.success("Vendor login successful!")
      
      // Redirect to the originally requested page or default to vendor dashboard
      const next = searchParams.get('next')
      // Allow redirect to vendor routes, or for admins to any valid route
      const isValidNext = isValidRedirectUrl(next) && 
        (next.startsWith('/vendor') || (data.user.role === 'admin' && !next.startsWith('/auth')))
      const redirectUrl = isValidNext ? next : '/vendor/dashboard'
      
      // Use window.location.href for immediate redirect after cookie is set
      // This ensures middleware can validate the cookie on the next page load
      window.location.href = redirectUrl
    } catch (error) {
      console.error('Login error:', error)
      toast.error("An error occurred during login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-16">
        <Container className="max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Store className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Vendor Portal</h1>
            <p className="text-muted-foreground">Sign in to access your vendor dashboard</p>
          </div>
          
          <form onSubmit={onSubmit} className="space-y-6" aria-label="Vendor login form">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email Address
              </label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="vendor@example.com"
                className="w-full"
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
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  placeholder="Enter your password"
                  className="w-full pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <Store className="mr-2 h-4 w-4" />
                  Sign In as Vendor
                </>
              )}
            </Button>

            <div className="text-center space-y-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have a vendor account?{" "}
                <Link 
                  href="/auth/register-vendor" 
                  className="text-primary hover:text-primary/80 font-medium underline"
                >
                  Register as vendor
                </Link>
              </p>
              <p className="text-sm text-muted-foreground">
                Customer?{" "}
                <Link 
                  href="/auth/login" 
                  className="text-primary hover:text-primary/80 font-medium underline"
                >
                  Customer login
                </Link>
              </p>
            </div>
          </form>
        </Container>
      </main>
      <Footer />
    </div>
  )
}
