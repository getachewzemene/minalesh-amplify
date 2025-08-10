import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { ProductGrid } from "@/components/product-grid"
import { Footer } from "@/components/footer"

const Index = () => {
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
