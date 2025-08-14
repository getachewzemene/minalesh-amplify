import { useState, useEffect } from "react";
import { Search, Filter, Star, MapPin, Sliders, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate, useLocation } from "react-router-dom";

interface SearchFilters {
  query: string;
  category: string;
  priceRange: [number, number];
  rating: number;
  vendor: string;
  location: string;
  inStock: boolean;
  hasAR: boolean;
  isVerified: boolean;
  sortBy: "relevance" | "price_low" | "price_high" | "rating" | "newest";
}

const defaultFilters: SearchFilters = {
  query: "",
  category: "all",
  priceRange: [0, 200000],
  rating: 0,
  vendor: "",
  location: "",
  inStock: false,
  hasAR: false,
  isVerified: false,
  sortBy: "relevance"
};

const categories = [
  "All Categories",
  "Smartphones",
  "Audio",
  "Computers",
  "Fashion",
  "Footwear",
  "Home & Garden",
  "Sports & Fitness",
  "Beauty & Health"
];

const locations = [
  "All Locations",
  "Addis Ababa",
  "Dire Dawa",
  "Mekelle",
  "Adama",
  "Awassa",
  "Bahir Dar",
  "Jimma"
];

export function AdvancedSearch() {
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [appliedFiltersCount, setAppliedFiltersCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Parse URL parameters on component mount
    const searchParams = new URLSearchParams(location.search);
    const query = searchParams.get("search") || "";
    setFilters(prev => ({ ...prev, query }));
  }, [location.search]);

  useEffect(() => {
    countAppliedFilters();
  }, [filters]);

  const countAppliedFilters = () => {
    let count = 0;
    if (filters.category !== "all") count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 200000) count++;
    if (filters.rating > 0) count++;
    if (filters.vendor) count++;
    if (filters.location) count++;
    if (filters.inStock) count++;
    if (filters.hasAR) count++;
    if (filters.isVerified) count++;
    if (filters.sortBy !== "relevance") count++;
    setAppliedFiltersCount(count);
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    const searchParams = new URLSearchParams();
    
    if (filters.query) searchParams.set("search", filters.query);
    if (filters.category !== "all") searchParams.set("category", filters.category);
    if (filters.priceRange[0] > 0) searchParams.set("min_price", filters.priceRange[0].toString());
    if (filters.priceRange[1] < 200000) searchParams.set("max_price", filters.priceRange[1].toString());
    if (filters.rating > 0) searchParams.set("rating", filters.rating.toString());
    if (filters.vendor) searchParams.set("vendor", filters.vendor);
    if (filters.location) searchParams.set("location", filters.location);
    if (filters.inStock) searchParams.set("in_stock", "true");
    if (filters.hasAR) searchParams.set("has_ar", "true");
    if (filters.isVerified) searchParams.set("verified", "true");
    if (filters.sortBy !== "relevance") searchParams.set("sort", filters.sortBy);

    navigate(`/products?${searchParams.toString()}`);
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    setFilters({ ...defaultFilters, query: filters.query });
  };

  const removeFilter = (filterKey: keyof SearchFilters) => {
    switch (filterKey) {
      case "category":
        updateFilter("category", "all");
        break;
      case "priceRange":
        updateFilter("priceRange", [0, 200000]);
        break;
      case "rating":
        updateFilter("rating", 0);
        break;
      case "vendor":
        updateFilter("vendor", "");
        break;
      case "location":
        updateFilter("location", "");
        break;
      case "sortBy":
        updateFilter("sortBy", "relevance");
        break;
      default:
        updateFilter(filterKey, false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for products, brands, or categories..."
            value={filters.query}
            onChange={(e) => updateFilter("query", e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10 pr-4 h-12"
          />
        </div>
        <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-12 px-6 relative">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {appliedFiltersCount > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {appliedFiltersCount}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Advanced Filters</span>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Category */}
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select value={filters.category} onValueChange={(value) => updateFilter("category", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category === "All Categories" ? "all" : category.toLowerCase()}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Price Range: {filters.priceRange[0].toLocaleString()} - {filters.priceRange[1].toLocaleString()} ETB
                </label>
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => updateFilter("priceRange", value)}
                  max={200000}
                  min={0}
                  step={1000}
                  className="w-full"
                />
              </div>

              {/* Rating */}
              <div>
                <label className="text-sm font-medium mb-2 block">Minimum Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      variant={filters.rating >= rating ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFilter("rating", rating)}
                      className="flex items-center gap-1"
                    >
                      <Star className="h-3 w-3" />
                      {rating}+
                    </Button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="text-sm font-medium mb-2 block">Location</label>
                <Select value={filters.location} onValueChange={(value) => updateFilter("location", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location === "All Locations" ? "" : location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Vendor Name */}
              <div>
                <label className="text-sm font-medium mb-2 block">Vendor</label>
                <Input
                  placeholder="Search by vendor name..."
                  value={filters.vendor}
                  onChange={(e) => updateFilter("vendor", e.target.value)}
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="inStock"
                    checked={filters.inStock}
                    onCheckedChange={(checked) => updateFilter("inStock", checked)}
                  />
                  <label htmlFor="inStock" className="text-sm">In Stock Only</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasAR"
                    checked={filters.hasAR}
                    onCheckedChange={(checked) => updateFilter("hasAR", checked)}
                  />
                  <label htmlFor="hasAR" className="text-sm">AR Try-On Available</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isVerified"
                    checked={filters.isVerified}
                    onCheckedChange={(checked) => updateFilter("isVerified", checked)}
                  />
                  <label htmlFor="isVerified" className="text-sm">Verified Vendors Only</label>
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <Select value={filters.sortBy} onValueChange={(value) => updateFilter("sortBy", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSearch} className="w-full" size="lg">
                Apply Filters & Search
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Button onClick={handleSearch} className="h-12 px-8 bg-primary hover:bg-primary/90">
          Search
        </Button>
      </div>

      {/* Applied Filters */}
      {appliedFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Applied filters:</span>
          {filters.category !== "all" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Category: {filters.category}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("category")} />
            </Badge>
          )}
          {(filters.priceRange[0] > 0 || filters.priceRange[1] < 200000) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Price: {filters.priceRange[0].toLocaleString()} - {filters.priceRange[1].toLocaleString()} ETB
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("priceRange")} />
            </Badge>
          )}
          {filters.rating > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {filters.rating}+ Stars
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("rating")} />
            </Badge>
          )}
          {filters.vendor && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Vendor: {filters.vendor}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("vendor")} />
            </Badge>
          )}
          {filters.location && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Location: {filters.location}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("location")} />
            </Badge>
          )}
          {filters.inStock && (
            <Badge variant="secondary" className="flex items-center gap-1">
              In Stock
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("inStock")} />
            </Badge>
          )}
          {filters.hasAR && (
            <Badge variant="secondary" className="flex items-center gap-1">
              AR Available
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("hasAR")} />
            </Badge>
          )}
          {filters.isVerified && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Verified Only
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("isVerified")} />
            </Badge>
          )}
          {filters.sortBy !== "relevance" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Sort: {filters.sortBy.replace("_", " ")}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("sortBy")} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}