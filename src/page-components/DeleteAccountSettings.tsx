'use client'

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Container } from "@/components/ui/container"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Trash2, AlertTriangle, ArrowLeft, ShieldAlert, 
  UserX, Database, MessageSquare, Heart, Package, Lock
} from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function DeleteAccountSettings() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [activeOrdersCount, setActiveOrdersCount] = useState(0)
  const [loadingOrders, setLoadingOrders] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    fetchActiveOrders()
  }, [user, router])

  const fetchActiveOrders = async () => {
    try {
      setLoadingOrders(true)
      const response = await fetch('/api/orders?status=active')
      if (response.ok) {
        const data = await response.json()
        const activeOrders = (data.orders || []).filter((order: any) => 
          ['pending', 'paid', 'confirmed', 'processing', 'shipped'].includes(order.status)
        )
        setActiveOrdersCount(activeOrders.length)
      }
    } catch (error) {
      console.error('Error fetching active orders:', error)
    } finally {
      setLoadingOrders(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!password || !confirmation) {
      toast.error('Please fill in all required fields')
      return
    }

    if (confirmation !== 'DELETE MY ACCOUNT') {
      toast.error('Please type exactly: DELETE MY ACCOUNT')
      return
    }

    if (!acknowledged) {
      toast.error('Please acknowledge that you understand the consequences')
      return
    }

    setShowConfirmDialog(true)
  }

  const confirmDelete = async () => {
    try {
      setDeleting(true)
      setShowConfirmDialog(false)

      const response = await fetch('/api/user/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password, confirmation })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Account deleted successfully. Redirecting...')
        logout()
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } else if (response.status === 400 && data.activeOrdersCount) {
        toast.error(data.error)
        setActiveOrdersCount(data.activeOrdersCount)
      } else {
        toast.error(data.error || 'Failed to delete account')
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('An error occurred while deleting your account')
    } finally {
      setDeleting(false)
    }
  }

  const canDelete = activeOrdersCount === 0

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-8">
        <Container>
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/profile">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-red-600 dark:text-red-500">Delete Account</h1>
                <p className="text-muted-foreground mt-1">
                  Permanently delete your account and all associated data
                </p>
              </div>
            </div>

            {/* Warning Alert */}
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning: This action is irreversible</AlertTitle>
              <AlertDescription>
                Once you delete your account, there is no going back. Please be certain before proceeding.
              </AlertDescription>
            </Alert>

            {/* Active Orders Warning */}
            {loadingOrders ? (
              <Card className="mb-6">
                <CardContent className="py-6">
                  <div className="text-center text-muted-foreground">
                    Checking for active orders...
                  </div>
                </CardContent>
              </Card>
            ) : activeOrdersCount > 0 ? (
              <Alert className="mb-6 border-orange-500 bg-orange-50 dark:bg-orange-950/20">
                <Package className="h-4 w-4 text-orange-600" />
                <AlertTitle className="text-orange-600 dark:text-orange-500">
                  Active Orders Detected
                </AlertTitle>
                <AlertDescription className="text-orange-600 dark:text-orange-500">
                  You have {activeOrdersCount} active {activeOrdersCount === 1 ? 'order' : 'orders'}. 
                  You must wait for all orders to be completed or cancelled before deleting your account.
                </AlertDescription>
              </Alert>
            ) : null}

            {/* What will be deleted */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  What will be deleted?
                </CardTitle>
                <CardDescription>
                  The following data will be permanently deleted or anonymized
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                    <UserX className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-600 dark:text-red-500">Profile & Personal Information</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your name, email, phone number, addresses, and all profile data will be permanently deleted.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                    <Heart className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-600 dark:text-red-500">Wishlist & Cart</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        All items in your wishlist and shopping cart will be permanently deleted.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900">
                    <MessageSquare className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-orange-600 dark:text-orange-500">Reviews (Anonymized)</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your product reviews will be anonymized but kept to preserve product ratings. 
                        Review content will be replaced with "[User account deleted]".
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                    <Package className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-blue-600 dark:text-blue-500">Order History (Retained for Legal Compliance)</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Order records will be anonymized and retained for 7 years for tax and legal compliance purposes,
                        but will no longer be linked to your account.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                    <Database className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-600 dark:text-red-500">Other Data</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Notifications, preferences, loyalty points, referrals, and all other account data will be permanently deleted.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Before you go */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Before you go...</CardTitle>
                <CardDescription>Consider these alternatives</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <Database className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Export your data</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Download a copy of your data before deleting your account
                    </p>
                    <Button variant="outline" size="sm" className="mt-2" asChild>
                      <Link href="/profile/settings/data-export">Export Data</Link>
                    </Button>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <Lock className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Just need a break?</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      You can simply log out and come back anytime
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delete Form */}
            <Card className={!canDelete ? 'opacity-50' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-500">
                  <ShieldAlert className="h-5 w-5" />
                  Confirm Account Deletion
                </CardTitle>
                <CardDescription>
                  Please confirm that you want to permanently delete your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="password" className="text-base">
                      Enter your password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your current password"
                      disabled={!canDelete || deleting}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmation" className="text-base">
                      Type <span className="font-mono font-bold text-red-600">DELETE MY ACCOUNT</span> to confirm
                    </Label>
                    <Input
                      id="confirmation"
                      type="text"
                      value={confirmation}
                      onChange={(e) => setConfirmation(e.target.value)}
                      placeholder="DELETE MY ACCOUNT"
                      disabled={!canDelete || deleting}
                      className="mt-2 font-mono"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Type exactly as shown above (case-sensitive)
                    </p>
                  </div>

                  <Separator />

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="acknowledge"
                      checked={acknowledged}
                      onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
                      disabled={!canDelete || deleting}
                    />
                    <Label
                      htmlFor="acknowledge"
                      className="text-sm leading-relaxed cursor-pointer"
                    >
                      I understand that this action is permanent and irreversible. All my data will be deleted 
                      and I will not be able to recover my account.
                    </Label>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <Button variant="outline" asChild disabled={deleting}>
                    <Link href="/profile">Cancel</Link>
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={!canDelete || deleting || !password || !confirmation || !acknowledged}
                    className="min-w-[200px]"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleting ? 'Deleting Account...' : 'Delete My Account'}
                  </Button>
                </div>

                {!canDelete && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      You cannot delete your account while you have active orders. 
                      Please wait for all orders to be completed or contact support.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </Container>
      </main>
      <Footer />

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 dark:text-red-500">
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This is your final chance to reconsider. Once you click "Delete Account", 
              your account and all associated data will be permanently deleted. This action 
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Deleting...' : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
