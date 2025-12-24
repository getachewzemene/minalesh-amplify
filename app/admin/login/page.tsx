'use client'

import { FormEvent, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Container } from "@/components/ui/container"
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

export default function AdminLogin() {
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

      // Check if user is admin
      if (data.user.role !== 'admin') {
        toast.error('Access denied. Admin credentials required.')
        setIsLoading(false)
        return
      }

      // Store token in localStorage (matches existing auth pattern)
      // Note: HttpOnly cookie is also set by server for SSR/middleware
      localStorage.setItem('auth_token', data.token)
      
      toast.success("Admin login successful!")
      
      // Refresh router to ensure cookies are synced
      router.refresh()
      
      // Redirect to the originally requested page or default to admin dashboard
      const next = searchParams.get('next')
      const redirectUrl = 
        isValidRedirectUrl(next) && next.startsWith('/admin') 
          ? next 
          : '/admin/dashboard'
      router.push(redirectUrl)
    } catch (error) {
      console.error('Login error:', error)
      toast.error("An error occurred during login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Container className="max-w-md">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <ShieldCheck className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2 text-slate-900">Admin Portal</h1>
            <p className="text-slate-600">Sign in to access the admin dashboard</p>
          </div>
          
          <form onSubmit={onSubmit} className="space-y-6" aria-label="Admin login form">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="email">
                Email Address
              </label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="admin@example.com"
                className="w-full"
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  placeholder="Enter admin password"
                  className="w-full pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Sign In as Admin
                </>
              )}
            </Button>

            <div className="text-center text-sm text-slate-500 pt-4 border-t">
              <Link 
                href="/auth/login" 
                className="text-primary hover:text-primary/80 font-medium"
              >
                ← Back to customer login
              </Link>
            </div>
          </form>
        </div>
      </Container>
    </div>
  )
}
