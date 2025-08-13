import { useState } from "react"
import { Star, ShoppingCart, Eye, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Container } from "@/components/ui/container"
import { Navigate, useNavigate, useLocation } from "react-router-dom"
import { useShop } from "@/context/shop-context"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import phoneImg from "@/assets/products/phone.jpg"
import sunglassesImg from "@/assets/products/sunglasses.jpg"
import earbudsImg from "@/assets/products/earbuds.jpg"
import capImg from "@/assets/products/cap.jpg"
import laptopImg from "@/assets/products/laptop.jpg"
import headphonesImg from "@/assets/products/headphones.jpg"
import shoesImg from "@/assets/products/shoes.jpg"
import jeansImg from "@/assets/products/jeans.jpg"

interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  rating: number
  reviews: number
  image: string
  category: string
  hasAR?: boolean
  vendor: string
  isVerifiedVendor?: boolean
}

const mockProducts: Product[] = [
  {
    id: "1",
    name: "iPhone 15 Pro Max",
    price: 89999,
    originalPrice: 94999,
    rating: 4.8,
    reviews: 256,
    image: phoneImg,
    category: "Smartphones",
    vendor: "TechStore ET",
    isVerifiedVendor: true
  },
  {
    id: "2",
    name: "Ray-Ban Aviator Sunglasses",
    price: 2499,
    rating: 4.6,
    reviews: 128,
    image: sunglassesImg,
    category: "Fashion",
    hasAR: true,
    vendor: "Fashion Hub",
    isVerifiedVendor: false
  },
  {
    id: "3",
    name: "Samsung Galaxy Buds Pro",
    price: 3299,
    originalPrice: 3799,
    rating: 4.7,
    reviews: 342,
    image: earbudsImg,
    category: "Audio",
    vendor: "Audio World",
    isVerifiedVendor: true
  },
  {
    id: "4",
    name: "Nike Baseball Cap",
    price: 899,
    rating: 4.5,
    reviews: 89,
    image: capImg,
    category: "Fashion",
    hasAR: true,
    vendor: "Sports Zone",
    isVerifiedVendor: false
  },
  {
    id: "5",
    name: "MacBook Pro 16-inch",
    price: 129999,
    originalPrice: 139999,
    rating: 4.9,
    reviews: 421,
    image: laptopImg,
    category: "Computers",
    vendor: "Apple Store ET",
    isVerifiedVendor: true
  },
  {
    id: "6",
    name: "Sony WH-1000XM4 Headphones",
    price: 4999,
    rating: 4.7,
    reviews: 187,
    image: headphonesImg,
    category: "Audio",
    hasAR: true,
    vendor: "Audio World",
    isVerifiedVendor: true
  },
  {
    id: "7",
    name: "Adidas Ultraboost 22",
    price: 2499,
    originalPrice: 2999,
    rating: 4.6,
    reviews: 94,
    image: shoesImg,
    category: "Footwear",
    vendor: "Sports Zone",
    isVerifiedVendor: false
  },
  {
    id: "8",
    name: "Levi's 501 Original Fit Jeans",
    price: 1299,
    rating: 4.4,
    reviews: 76,
    image: jeansImg,
    category: "Fashion",
    vendor: "Fashion Hub",
    isVerifiedVendor: false
  }
]

export default function Products() {
  const navigate = useNavigate()
  const location = useLocation()
  const { addToCart, addToWishlist } = useShop()
  const { user } = useAuth()
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null)
  
  // Redirect admin/vendor to their dashboards
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }
  
  if (user?.role === 'vendor') {
    return <Navigate to="/dashboard" replace />
  }
// Get search query from URL
  const searchParams = new URLSearchParams(location.search)
  const searchQuery = searchParams.get('search') || ''
  
  // Filter categories based on search query
  const filteredProducts = searchQuery 
    ? mockProducts.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.vendor.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : mockProducts
  const [category, setCategory] = useState<string>("All")
  const categories = ["All", ...Array.from(new Set(filteredProducts.map(p => p.category)))]
  const products = category === "All" ? filteredProducts : filteredProducts.filter(p => p.category === category)

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      vendor: product.vendor,
      hasAR: product.hasAR
    })
    toast.success("Item added to cart")
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-16">
        <Container>
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-4">
              {searchQuery ? `Search Results for "${searchQuery}"` : "All Products"}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {searchQuery
                ? `Found ${products.length} product(s) matching your search`
                : "Browse our complete collection of electronics and trending items from verified vendors across Ethiopia"}
            </p>
            <div className="mt-6 flex items-center justify-center">
              <label htmlFor="category" className="sr-only">Filter by category</label>
              <select
                id="category"
                className="px-3 py-2 rounded-md border bg-background"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Filter products by category"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-card rounded-lg shadow-card border transition-all duration-300 hover:shadow-gold hover:scale-105 cursor-pointer"
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseLeave={() => setHoveredProduct(null)}
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover transition-transform duration-300 hover:scale-110"
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {product.hasAR && (
                      <Badge className="bg-primary text-primary-foreground">
                        AR Try-On
                      </Badge>
                    )}
                    {product.originalPrice && (
                      <Badge variant="destructive">
                        Sale
                      </Badge>
                    )}
                  </div>

                  {/* Hover actions */}
                  {hoveredProduct === product.id && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 transition-opacity duration-300">
                    <Button size="icon" variant="secondary" onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.id}`) }} aria-label="View product">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      className="bg-primary hover:bg-primary/90" 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      aria-label="Add to cart"
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="mb-2">
                    <Badge variant="outline" className="text-xs">
                      {product.category}
                    </Badge>
                  </div>
                  
                  <h3 className="font-semibold text-card-foreground mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < Math.floor(product.rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      ({product.reviews})
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">
                        {product.price.toLocaleString()} ETB
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          {product.originalPrice.toLocaleString()} ETB
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      by {product.vendor}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddToCart(product);
                      }}
                    >
                      Add to Cart
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      addToWishlist({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                        category: product.category,
                        vendor: product.vendor,
                        hasAR: product.hasAR
                      })
                      toast.success("Item added to wishlist")
                    }}
                      aria-label="Add to wishlist"
                    >
                      <Heart className="h-4 w-4 mr-1" /> Wishlist
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  )
}