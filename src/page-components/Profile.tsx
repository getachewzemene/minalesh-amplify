'use client'

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Container } from "@/components/ui/container"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Upload, User, Mail, Phone, MapPin, FileText, Package, MapPinned,
  Heart, Clock, Star, ShoppingBag, Bell, Shield, Store, Eye,
  TrendingUp, Search, CreditCard, Gift, History, Settings, GitCompare,
  Download, Trash2, Database, Share2, Bookmark
} from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { LoyaltyRewards } from "@/components/user/LoyaltyRewards"
import { ProductComparison } from "@/components/user/ProductComparison"
import { ReferralModal } from "@/components/user/ReferralModal"
import { PriceAlertsList } from "@/components/user/PriceAlertsList"
import { SavedSearchesList } from "@/components/user/SavedSearches"
import { BrowsingHistoryPrivacyControl } from "@/components/user/BrowsingHistoryPrivacyControl"
import { STORAGE_KEYS } from "@/lib/product-constants"
import { isBrowsingHistoryEnabled } from "@/components/product/RecentlyViewedProducts"

interface ProductRecommendation {
  id: string
  name: string
  slug: string
  price: number
  salePrice?: number
  images?: string[]
  ratingAverage: number
  category?: { name: string; slug: string }
  vendor?: { displayName?: string }
}

interface RecentOrder {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  createdAt: string
}

interface WishlistItem {
  id: string
  createdAt: string
  product?: {
    id: string
    name: string
    slug: string
    price: number
  }
}

interface ViewedProduct {
  id?: string
  name: string
  slug: string
  price: number
}

export default function Profile() {
  const { user, profile, logout, updateProfile, requestVendorVerification } = useAuth()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    displayName: profile?.displayName || "",
    firstName: profile?.firstName || "",
    lastName: profile?.lastName || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
    tradeLicense: profile?.tradeLicense || "",
    tinNumber: profile?.tinNumber || ""
  })

  // State for advanced features
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<ViewedProduct[]>([])
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loadingRecommendations, setLoadingRecommendations] = useState(true)
  const [loadingRecentlyViewed, setLoadingRecentlyViewed] = useState(true)
  const [referralModalOpen, setReferralModalOpen] = useState(false)
  
  // Gift cards state
  const [purchasedGiftCards, setPurchasedGiftCards] = useState<Array<{
    id: string
    code: string
    amount: number
    balance: number
    status: string
    message?: string | null
    recipientEmail?: string | null
    createdAt: string
    expiresAt: string
    transactions?: Array<{
      id: string
      amount: number
      type: string
      createdAt: string
    }>
  }>>([])
  const [receivedGiftCards, setReceivedGiftCards] = useState<Array<{
    id: string
    code: string
    amount: number
    balance: number
    status: string
    message?: string | null
    createdAt: string
    expiresAt: string
    purchaser?: {
      email: string
    }
    transactions?: Array<{
      id: string
      amount: number
      type: string
      createdAt: string
    }>
  }>>([])
  const [loadingGiftCards, setLoadingGiftCards] = useState(true)

  // Fetch recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await fetch('/api/products/recommendations?limit=6')
        if (response.ok) {
          const data = await response.json()
          setRecommendations(data.products || [])
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error)
      } finally {
        setLoadingRecommendations(false)
      }
    }

    fetchRecommendations()
  }, [])

  // Fetch recently viewed products from localStorage
  useEffect(() => {
    try {
      // Check if browsing history is enabled
      if (!isBrowsingHistoryEnabled()) {
        setLoadingRecentlyViewed(false)
        return
      }
      
      const viewed = localStorage.getItem(STORAGE_KEYS.RECENTLY_VIEWED)
      if (viewed) {
        const viewedProducts = JSON.parse(viewed).slice(0, 6)
        setRecentlyViewed(viewedProducts)
      }
    } catch (error) {
      console.error('Error loading recently viewed:', error)
      // Clear corrupted data
      localStorage.removeItem(STORAGE_KEYS.RECENTLY_VIEWED)
      toast.error('Failed to load recently viewed products. Data has been reset.')
    } finally {
      setLoadingRecentlyViewed(false)
    }
  }, [])

  // Fetch recent orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders')
        if (response.ok) {
          const data = await response.json()
          setRecentOrders((data.orders || []).slice(0, 5))
        }
      } catch (error) {
        console.error('Error fetching orders:', error)
      }
    }

    if (user) {
      fetchOrders()
    }
  }, [user])

  // Fetch wishlist
  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const response = await fetch('/api/wishlist')
        if (response.ok) {
          const data = await response.json()
          setWishlistItems((data.items || []).slice(0, 6))
        }
      } catch (error) {
        console.error('Error fetching wishlist:', error)
      }
    }

    if (user) {
      fetchWishlist()
    }
  }, [user])

  // Fetch gift cards
  useEffect(() => {
    const fetchGiftCards = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        const response = await fetch('/api/gift-cards/my-cards', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          const data = await response.json()
          setPurchasedGiftCards(data.purchased || [])
          setReceivedGiftCards(data.received || [])
        }
      } catch (error) {
        console.error('Error fetching gift cards:', error)
      } finally {
        setLoadingGiftCards(false)
      }
    }

    if (user) {
      fetchGiftCards()
    } else {
      setLoadingGiftCards(false)
    }
  }, [user])

  const handleSave = () => {
    updateProfile(profileData)
    toast.success("Profile updated successfully")
    setEditing(false)
  }

  const handleLogout = () => {
    logout()
    router.push("/auth/login")
  }

  const handleVerifyVendor = () => {
    if (profileData.tradeLicense && profileData.tinNumber) {
      requestVendorVerification(profileData.tradeLicense, profileData.tinNumber)
      toast.info("Verification request sent to admin")
    } else {
      toast.error("Please provide both Trade License and TIN Number")
    }
  }

  const handleQuickReorder = (orderId: string) => {
    toast.info("Adding items to cart...")
    // Navigate to order details or add to cart
    router.push(`/orders/${orderId}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-8">
        <Container>
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold">My Account</h1>
                <p className="text-muted-foreground mt-1">
                  Welcome back, {profile?.displayName || user?.email?.split('@')[0]}!
                </p>
              </div>
              <Button variant="outline" onClick={handleLogout}>Logout</Button>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Link href="/orders">
                <Card className="bg-gradient-card shadow-card hover:shadow-lg transition-all cursor-pointer hover:scale-105">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Orders</p>
                        <p className="text-2xl font-bold">{recentOrders.length}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/wishlist">
                <Card className="bg-gradient-card shadow-card hover:shadow-lg transition-all cursor-pointer hover:scale-105">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Wishlist Items</p>
                        <p className="text-2xl font-bold">{wishlistItems.length}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center">
                        <Heart className="h-6 w-6 text-pink-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/addresses">
                <Card className="bg-gradient-card shadow-card hover:shadow-lg transition-all cursor-pointer hover:scale-105">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Saved Addresses</p>
                        <p className="text-2xl font-bold">-</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <MapPinned className="h-6 w-6 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Card className="bg-gradient-card shadow-card hover:shadow-lg transition-all cursor-pointer hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Viewed Products</p>
                      <p className="text-2xl font-bold">{recentlyViewed.length}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <Eye className="h-6 w-6 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-8 lg:w-auto">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="recommendations">For You</TabsTrigger>
                <TabsTrigger value="rewards">Rewards</TabsTrigger>
                <TabsTrigger value="gift-cards">Gift Cards</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="privacy">Privacy</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Orders */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Recent Orders
                      </CardTitle>
                      <CardDescription>Your latest purchases</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {recentOrders.length > 0 ? (
                        <div className="space-y-4">
                          {recentOrders.map((order: any) => (
                            <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                              <div className="flex-1">
                                <p className="font-medium">Order #{order.orderNumber}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                                <Badge variant="outline" className="mt-1">
                                  {order.status}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">{order.totalAmount} ETB</p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="mt-2"
                                  onClick={() => handleQuickReorder(order.id)}
                                >
                                  <ShoppingBag className="h-4 w-4 mr-1" />
                                  Reorder
                                </Button>
                              </div>
                            </div>
                          ))}
                          <Button variant="outline" className="w-full" asChild>
                            <Link href="/orders">View All Orders</Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No orders yet</p>
                          <Button className="mt-4" asChild>
                            <Link href="/products">Start Shopping</Link>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Wishlist Preview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5" />
                        Wishlist
                      </CardTitle>
                      <CardDescription>Items you love</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {wishlistItems.length > 0 ? (
                        <div className="space-y-4">
                          {wishlistItems.map((item: any) => (
                            <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                              <div className="flex-1">
                                <p className="font-medium line-clamp-1">{item.product?.name}</p>
                                <p className="text-sm font-bold text-primary">
                                  {item.product?.price} ETB
                                </p>
                              </div>
                              <Button size="sm" asChild>
                                <Link href={`/product/${item.product?.slug}`}>View</Link>
                              </Button>
                            </div>
                          ))}
                          <Button variant="outline" className="w-full" asChild>
                            <Link href="/wishlist">View All Wishlist</Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No items in wishlist</p>
                          <Button className="mt-4" asChild>
                            <Link href="/products">Browse Products</Link>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Recently Viewed */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Recently Viewed
                    </CardTitle>
                    <CardDescription>Products you've checked out</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingRecentlyViewed ? (
                      <div className="text-center py-8">Loading...</div>
                    ) : recentlyViewed.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {recentlyViewed.map((product: any, index: number) => (
                          <Link
                            key={index}
                            href={`/product/${product.slug}`}
                            className="group"
                          >
                            <div className="border rounded-lg p-4 hover:shadow-lg transition-all">
                              <div className="aspect-square bg-muted rounded-md mb-2 flex items-center justify-center">
                                <Package className="h-8 w-8 text-muted-foreground" />
                              </div>
                              <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                                {product.name}
                              </p>
                              <p className="text-sm font-bold text-primary mt-1">
                                {product.price} ETB
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No recently viewed products</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Price Alerts */}
                <PriceAlertsList />

                {/* Saved Searches */}
                <SavedSearchesList />
              </TabsContent>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Profile Card */}
                  <Card className="lg:col-span-1">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center">
                        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                          <User className="h-12 w-12 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold text-center">
                          {profile?.displayName || user?.email}
                        </h2>
                        <p className="text-sm text-muted-foreground text-center">{user?.email}</p>
                        <div className="mt-4">
                          <Badge variant={profile?.isVendor ? "secondary" : "outline"}>
                            {profile?.isVendor ? "VENDOR" : "CUSTOMER"}
                          </Badge>
                        </div>
                        
                        {profile?.isVendor && (
                          <div className="mt-4 w-full">
                            <Separator className="mb-4" />
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Status:</span>
                              {profile?.vendorStatus === 'approved' ? (
                                <Badge className="bg-green-500">Verified</Badge>
                              ) : profile?.vendorStatus === 'pending' ? (
                                <Badge className="bg-yellow-500">Pending</Badge>
                              ) : (
                                <Badge variant="destructive">Not Verified</Badge>
                              )}
                            </div>
                            {profile?.vendorStatus !== 'approved' && profile?.vendorStatus !== 'pending' && (
                              <Button 
                                className="w-full mt-4"
                                onClick={handleVerifyVendor}
                              >
                                Request Verification
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Profile Form */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <span>Profile Information</span>
                        {!editing ? (
                          <Button variant="outline" onClick={() => setEditing(true)}>
                            Edit Profile
                          </Button>
                        ) : (
                          <div className="space-x-2">
                            <Button variant="outline" onClick={() => setEditing(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleSave}>Save Changes</Button>
                          </div>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="displayName">Display Name</Label>
                          <Input 
                            id="displayName" 
                            value={profileData.displayName} 
                            onChange={(e) => setProfileData({...profileData, displayName: e.target.value})} 
                            disabled={!editing}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="firstName">First Name</Label>
                            <Input 
                              id="firstName" 
                              value={profileData.firstName} 
                              onChange={(e) => setProfileData({...profileData, firstName: e.target.value})} 
                              disabled={!editing}
                            />
                          </div>
                          <div>
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input 
                              id="lastName" 
                              value={profileData.lastName} 
                              onChange={(e) => setProfileData({...profileData, lastName: e.target.value})} 
                              disabled={!editing}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input 
                            id="phone" 
                            type="tel" 
                            value={profileData.phone} 
                            onChange={(e) => setProfileData({...profileData, phone: e.target.value})} 
                            disabled={!editing}
                          />
                        </div>
                        <div>
                          <Label htmlFor="address">Address</Label>
                          <Input 
                            id="address" 
                            value={profileData.address} 
                            onChange={(e) => setProfileData({...profileData, address: e.target.value})} 
                            disabled={!editing}
                            placeholder="Enter your address"
                          />
                        </div>
                        
                        {profile?.isVendor && (
                          <>
                            <Separator className="my-4" />
                            <h3 className="font-semibold">Vendor Information</h3>
                            <div>
                              <Label htmlFor="tradeLicense">Trade License Number</Label>
                              <Input 
                                id="tradeLicense" 
                                value={profileData.tradeLicense} 
                                onChange={(e) => setProfileData({...profileData, tradeLicense: e.target.value})} 
                                disabled={!editing}
                                placeholder="Enter trade license number"
                              />
                            </div>
                            <div>
                              <Label htmlFor="tinNumber">TIN Number</Label>
                              <Input 
                                id="tinNumber" 
                                value={profileData.tinNumber} 
                                onChange={(e) => setProfileData({...profileData, tinNumber: e.target.value})} 
                                disabled={!editing}
                                placeholder="Enter TIN number"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Account Activity
                    </CardTitle>
                    <CardDescription>Your shopping journey</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-4">
                        {recentOrders.slice(0, 3).map((order: any, index: number) => (
                          <div key={order.id} className="flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">Order Placed</p>
                              <p className="text-sm text-muted-foreground">
                                Order #{order.orderNumber} • {order.totalAmount} ETB
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(order.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        
                        {wishlistItems.slice(0, 3).map((item: any, index: number) => (
                          <div key={item.id} className="flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center flex-shrink-0">
                              <Heart className="h-5 w-5 text-pink-500" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">Added to Wishlist</p>
                              <p className="text-sm text-muted-foreground">
                                {item.product?.name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(item.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}

                        {recentOrders.length === 0 && wishlistItems.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No activity yet</p>
                            <p className="text-sm mt-2">Start shopping to see your activity here</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Recommendations Tab */}
              <TabsContent value="recommendations" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Recommended For You
                    </CardTitle>
                    <CardDescription>Products you might like based on your browsing history</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingRecommendations ? (
                      <div className="text-center py-8">Loading recommendations...</div>
                    ) : recommendations.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {recommendations.map((product: any) => (
                          <Link
                            key={product.id}
                            href={`/product/${product.slug}`}
                            className="group"
                          >
                            <div className="border rounded-lg p-4 hover:shadow-lg transition-all hover:scale-105">
                              <div className="aspect-square bg-muted rounded-md mb-2 flex items-center justify-center overflow-hidden">
                                {product.images && product.images.length > 0 ? (
                                  <img
                                    src={product.images[0]}
                                    alt={product.name}
                                    className="object-cover w-full h-full"
                                  />
                                ) : (
                                  <Package className="h-8 w-8 text-muted-foreground" />
                                )}
                              </div>
                              <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                                {product.name}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <p className="text-sm font-bold text-primary">
                                  {product.price} ETB
                                </p>
                                {product.ratingAverage > 0 && (
                                  <div className="flex items-center">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs ml-1">{product.ratingAverage}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No recommendations available yet</p>
                        <p className="text-sm mt-2">Browse products to get personalized recommendations</p>
                        <Button className="mt-4" asChild>
                          <Link href="/products">Browse Products</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Account Security
                      </CardTitle>
                      <CardDescription>Manage your security settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Email Verification</p>
                          <p className="text-sm text-muted-foreground">
                            {user?.emailVerified ? 'Verified' : 'Not verified'}
                          </p>
                        </div>
                        <Badge variant={user?.emailVerified ? "default" : "outline"}>
                          {user?.emailVerified ? 'Verified' : 'Pending'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Password</p>
                          <p className="text-sm text-muted-foreground">Last changed recently</p>
                        </div>
                        <Button variant="outline" size="sm">Change</Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notification Preferences
                      </CardTitle>
                      <CardDescription>Manage how you receive updates</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Order Updates</p>
                          <p className="text-sm text-muted-foreground">Email & In-app</p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/profile/notifications">Manage</Link>
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Promotions</p>
                          <p className="text-sm text-muted-foreground">Get deals & offers</p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/profile/notifications">Manage</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Rewards Tab */}
              <TabsContent value="rewards" className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <LoyaltyRewards userId={user?.id} />
                  
                  {/* Referral Program Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5" />
                        Referral Program
                      </CardTitle>
                      <CardDescription>
                        Invite friends and earn rewards when they make their first purchase
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Share your unique referral code with friends
                          </p>
                          <p className="text-sm font-medium">
                            Earn 200 bonus points for each successful referral
                          </p>
                        </div>
                        <Button onClick={() => setReferralModalOpen(true)}>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share Referral Code
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Gift Cards Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Gift className="h-5 w-5" />
                        Gift Cards
                      </CardTitle>
                      <CardDescription>
                        Purchase gift cards for yourself or others
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Send the perfect gift with Minalesh gift cards
                          </p>
                          <p className="text-sm font-medium">
                            Available in amounts from 50 to 10,000 ETB
                          </p>
                        </div>
                        <Link href="/gift-cards">
                          <Button>
                            <Gift className="h-4 w-4 mr-2" />
                            Manage Gift Cards
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>

                  <ProductComparison />
                </div>
              </TabsContent>

              {/* Gift Cards Tab */}
              <TabsContent value="gift-cards" className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  {/* Purchased Gift Cards */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Gift className="h-5 w-5" />
                        Gift Cards I Purchased
                      </CardTitle>
                      <CardDescription>
                        Gift cards you bought for yourself or others
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadingGiftCards ? (
                        <p className="text-sm text-muted-foreground">Loading...</p>
                      ) : purchasedGiftCards.length > 0 ? (
                        <div className="space-y-4">
                          {purchasedGiftCards.map((card: any) => (
                            <div key={card.id} className="p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-blue-50">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-medium text-lg">{card.code}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {card.recipientEmail ? `Sent to: ${card.recipientEmail}` : 'For yourself'}
                                  </p>
                                </div>
                                <Badge variant={
                                  card.status === 'active' ? 'default' :
                                  card.status === 'redeemed' ? 'secondary' :
                                  'outline'
                                }>
                                  {card.status}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-4 mt-3">
                                <div>
                                  <p className="text-xs text-muted-foreground">Original Amount</p>
                                  <p className="font-semibold">{Number(card.amount).toFixed(2)} ETB</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Balance</p>
                                  <p className="font-semibold">{Number(card.balance).toFixed(2)} ETB</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 mt-2">
                                <div>
                                  <p className="text-xs text-muted-foreground">Purchased</p>
                                  <p className="text-sm">{new Date(card.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Expires</p>
                                  <p className="text-sm">{new Date(card.expiresAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                              {card.message && (
                                <div className="mt-3 p-2 bg-white rounded">
                                  <p className="text-xs text-muted-foreground">Message</p>
                                  <p className="text-sm italic">&quot;{card.message}&quot;</p>
                                </div>
                              )}
                              {card.transactions && card.transactions.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-xs text-muted-foreground mb-2">Recent Transactions</p>
                                  <div className="space-y-1">
                                    {card.transactions.map((txn: any) => (
                                      <div key={txn.id} className="flex items-center justify-between text-xs">
                                        <span className="capitalize">{txn.type}</span>
                                        <span>{Number(txn.amount).toFixed(2)} ETB</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No gift cards purchased yet</p>
                          <Link href="/gift-cards">
                            <Button variant="outline" className="mt-4">
                              Purchase Gift Card
                            </Button>
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Received Gift Cards */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Gift className="h-5 w-5 text-green-600" />
                        Gift Cards I Received
                      </CardTitle>
                      <CardDescription>
                        Gift cards sent to you by others
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadingGiftCards ? (
                        <p className="text-sm text-muted-foreground">Loading...</p>
                      ) : receivedGiftCards.length > 0 ? (
                        <div className="space-y-4">
                          {receivedGiftCards.map((card: any) => (
                            <div key={card.id} className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-medium text-lg">{card.code}</p>
                                  <p className="text-sm text-muted-foreground">
                                    From: {card.purchaser?.email || 'Unknown'}
                                  </p>
                                </div>
                                <Badge variant={
                                  card.status === 'active' ? 'default' :
                                  card.status === 'redeemed' ? 'secondary' :
                                  'outline'
                                }>
                                  {card.status}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-4 mt-3">
                                <div>
                                  <p className="text-xs text-muted-foreground">Original Amount</p>
                                  <p className="font-semibold">{Number(card.amount).toFixed(2)} ETB</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Balance</p>
                                  <p className="font-semibold">{Number(card.balance).toFixed(2)} ETB</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 mt-2">
                                <div>
                                  <p className="text-xs text-muted-foreground">Received</p>
                                  <p className="text-sm">{new Date(card.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Expires</p>
                                  <p className="text-sm">{new Date(card.expiresAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                              {card.message && (
                                <div className="mt-3 p-2 bg-white rounded">
                                  <p className="text-xs text-muted-foreground">Personal Message</p>
                                  <p className="text-sm italic">&quot;{card.message}&quot;</p>
                                </div>
                              )}
                              {card.transactions && card.transactions.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-xs text-muted-foreground mb-2">Recent Transactions</p>
                                  <div className="space-y-1">
                                    {card.transactions.map((txn: any) => (
                                      <div key={txn.id} className="flex items-center justify-between text-xs">
                                        <span className="capitalize">{txn.type}</span>
                                        <span>{Number(txn.amount).toFixed(2)} ETB</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No gift cards received yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5" />
                        Gift Card Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Link href="/gift-cards" className="flex-1">
                          <Button className="w-full" variant="default">
                            <Gift className="h-4 w-4 mr-2" />
                            Purchase Gift Card
                          </Button>
                        </Link>
                        <Link href="/cart" className="flex-1">
                          <Button className="w-full" variant="outline">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Use Gift Card at Checkout
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Privacy & Data Tab */}
              <TabsContent value="privacy" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        Data Export
                      </CardTitle>
                      <CardDescription>
                        Download a copy of your personal data
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Request a complete export of all your data including profile information, 
                        orders, reviews, and more. Exports are available in JSON or CSV format.
                      </p>
                      <div className="pt-4">
                        <Button asChild className="w-full">
                          <Link href="/profile/settings/data-export">
                            <Database className="h-4 w-4 mr-2" />
                            Manage Data Exports
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-red-200 dark:border-red-900">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-500">
                        <Trash2 className="h-5 w-5" />
                        Delete Account
                      </CardTitle>
                      <CardDescription>
                        Permanently delete your account and data
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all associated data. This action 
                        cannot be undone. Please make sure you want to proceed.
                      </p>
                      <div className="pt-4">
                        <Button variant="destructive" asChild className="w-full">
                          <Link href="/profile/settings/delete-account">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete My Account
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Browsing History Privacy Control */}
                <BrowsingHistoryPrivacyControl />

                {/* Privacy Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Your Privacy Rights</CardTitle>
                    <CardDescription>
                      We respect your privacy and give you control over your data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-foreground">Right to Access</p>
                          <p>You can request and download all your personal data at any time.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-foreground">Right to Deletion</p>
                          <p>You can request deletion of your account and personal data.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-foreground">Right to Rectification</p>
                          <p>You can update your personal information through your profile settings.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-foreground">Data Portability</p>
                          <p>Export your data in standard formats (JSON, CSV) that you can use elsewhere.</p>
                        </div>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Learn more about how we handle your data
                      </p>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/legal/privacy">Privacy Policy</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </Container>
      </main>
      <Footer />
      <ReferralModal open={referralModalOpen} onOpenChange={setReferralModalOpen} />
    </div>
  )
}