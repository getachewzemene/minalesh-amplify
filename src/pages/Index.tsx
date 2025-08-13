import { Navigate } from "react-router-dom"
import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { ProductGrid } from "@/components/product-grid"
import { Footer } from "@/components/footer"
import { useAuth } from "@/context/auth-context"

const Index = () => {
  const { user } = useAuth()
  
  // Redirect admin/vendor to their dashboards
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }
  
  if (user?.role === 'vendor') {
    return <Navigate to="/dashboard" replace />
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <ProductGrid />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
