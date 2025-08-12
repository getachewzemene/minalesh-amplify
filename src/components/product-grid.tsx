import { useState } from "react"
import { Star, ShoppingCart, Eye, Heart, ShieldCheck, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Container } from "./ui/container"
import { useNavigate } from "react-router-dom"
import { useShop } from "@/context/shop-context"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"

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
  vendorVerified: boolean
}

const mockProducts: Product[] = [
  {
    id: "1",
    name: "iPhone 15 Pro Max",
    price: 89999,
    originalPrice: 94999,
    rating: 4.8,
    reviews: 256,
    image: "/api/placeholder/300/300",
    category: "Smartphones",
    vendor: "TechStore ET",
    vendorVerified: true
  },
  {
    id: "2",
    name: "Ray-Ban Aviator Sunglasses",
    price: 2499,
    rating: 4.6,
    reviews: 128,
    image: "/api/placeholder/300/300",
    category: "Fashion",
    hasAR: true,
    vendor: "Fashion Hub",
    vendorVerified: false
  },
  {
    id: "3",
    name: "Samsung Galaxy Buds Pro",
    price: 3299,
    originalPrice: 3799,
    rating: 4.7,
    reviews: 342,
    image: "/api/placeholder/300/300",
    category: "Audio",
    vendor: "Audio World",
    vendorVerified: true
  },
  {
    id: "4",
    name: "Nike Baseball Cap",
    price: 899,
    rating: 4.5,
    reviews: 89,
    image: "/api/placeholder/300/300",
    category: "Fashion",
    hasAR: true,
    vendor: "Sports Zone",
    vendorVerified: false
  }
]

export function ProductGrid() {
  const navigate = useNavigate()
  const { addToCart, addToWishlist } = useShop()
  const { user } = useAuth()
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null)
  const [category, setCategory] = useState<string>("All")
  const categories = ["All", ...Array.from(new Set(mockProducts.map(p => p.category)))]
  const products = category === "All" ? mockProducts : mockProducts.filter(p => p.category === category)

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

  const handleAddToWishlist = (product: Product) => {
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
  }

  return (
    <section id="products" className="py-16 bg-background">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover the latest electronics and trending items from verified vendors across Ethiopia
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
                  <div className="flex items-center mt-1">
                    <span className="text-xs text-muted-foreground">
                      by {product.vendor}
                    </span>
                    {product.vendorVerified ? (
                      <ShieldCheck className="h-3 w-3 text-green-500 ml-1" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-yellow-500 ml-1" />
                    )}
                  </div>
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
                      handleAddToWishlist(product);
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

        <div className="text-center mt-12">
          <Button variant="outline" size="lg" onClick={(e) => {
            e.preventDefault();
            navigate("/products")
          }}>
            View All Products
          </Button>
        </div>
      </Container>
    </section>
  )
}