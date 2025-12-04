'use client'

/**
 * AdvancedSearch Component
 * 
 * Manages search/filter parameters and updates URL query string.
 * The products page listens to URL changes and fetches filtered results
 * from the backend API at /api/products/search.
 */

import { useState, useEffect, useCallback } from "react";
import { Filter, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NullableSelect, ALL } from "@/components/ui/nullable-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useRouter, usePathname } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { SearchWithAutocomplete } from "./SearchWithAutocomplete";

interface SearchFilters {
  query: string;
  category: string;
  brand: string;
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
  brand: "",
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
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Parse URL parameters on component mount (client-side only)
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const query = searchParams.get("search") || "";
      setFilters(prev => ({ ...prev, query }));
    }
  }, []);

  const countAppliedFilters = useCallback(() => {
    let count = 0;
    if (filters.category !== "all" && filters.category !== "") count++; // legacy + new pattern
    if (filters.brand) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 200000) count++;
    if (filters.rating > 0) count++;
    if (filters.vendor) count++;
    if (filters.location) count++;
    if (filters.inStock) count++;
    if (filters.hasAR) count++;
    if (filters.isVerified) count++;
    if (filters.sortBy !== "relevance") count++;
    setAppliedFiltersCount(count);
  }, [filters]);

  useEffect(() => {
    countAppliedFilters();
  }, [countAppliedFilters]);


  type FilterValue<K extends keyof SearchFilters> =
    K extends 'query' | 'category' | 'brand' | 'vendor' | 'location' ? string :
    K extends 'priceRange' ? [number, number] :
    K extends 'rating' ? number :
    K extends 'inStock' | 'hasAR' | 'isVerified' ? boolean :
    K extends 'sortBy' ? SearchFilters['sortBy'] :
    never;

  const updateFilter = <K extends keyof SearchFilters>(key: K, value: FilterValue<K>) => {
    setFilters(prev => ({ ...prev, [key]: value } as SearchFilters));
  };

  const handleSearch = () => {
    const searchParams = new URLSearchParams();
    
    if (filters.query) searchParams.set("search", filters.query);
    if (filters.category !== "all") searchParams.set("category", filters.category);
    if (filters.brand) searchParams.set("brand", filters.brand);
    if (filters.priceRange[0] > 0) searchParams.set("min_price", filters.priceRange[0].toString());
    if (filters.priceRange[1] < 200000) searchParams.set("max_price", filters.priceRange[1].toString());
    if (filters.rating > 0) searchParams.set("rating", filters.rating.toString());
    if (filters.vendor) searchParams.set("vendor", filters.vendor);
    if (filters.location) searchParams.set("location", filters.location);
    if (filters.inStock) searchParams.set("in_stock", "true");
    if (filters.hasAR) searchParams.set("has_ar", "true");
    if (filters.isVerified) searchParams.set("verified", "true");
    if (filters.sortBy !== "relevance") searchParams.set("sort", filters.sortBy);

    router.push(`/products?${searchParams.toString()}`);
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
      case "brand":
        updateFilter("brand", "");
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

  const handleSearchSubmit = (query: string) => {
    updateFilter("query", query);
    handleSearch();
  };

  return (
    <div className="space-y-4">
      {/* Main Search Bar with Autocomplete */}
      <div className="flex gap-2">
        <SearchWithAutocomplete
          value={filters.query}
          onChange={(value) => updateFilter("query", value)}
          onSearch={handleSearchSubmit}
          onSuggestionSelect={handleSearchSubmit}
          placeholder="Search for products, brands, or categories..."
          className="flex-1"
          inputClassName="h-12"
          showButton={true}
          buttonText="Search"
        />
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

              {/* Brand */}
              <div>
                <label className="text-sm font-medium mb-2 block">Brand</label>
                <Input
                  placeholder="Search by brand name..."
                  value={filters.brand}
                  onChange={(e) => updateFilter("brand", e.target.value)}
                />
              </div>

              {/* Price Range */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Price Range: {formatCurrency(filters.priceRange[0])} - {formatCurrency(filters.priceRange[1])}
                </label>
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) =>
                    updateFilter(
                      "priceRange",
                      [value[0] ?? 0, value[1] ?? 200000] as [number, number]
                    )
                  }
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
                <NullableSelect
                  value={filters.location}
                  onValueChange={(value) => updateFilter("location", value)}
                  placeholder="Select location"
                  sentinel={ALL}
                  sentinelLabel="All Locations"
                >
                  {locations
                    .filter((location) => location !== "All Locations")
                    .map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                </NullableSelect>
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
                    onCheckedChange={(checked) => updateFilter("inStock", checked === true)}
                  />
                  <label htmlFor="inStock" className="text-sm">In Stock Only</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasAR"
                    checked={filters.hasAR}
                    onCheckedChange={(checked) => updateFilter("hasAR", checked === true)}
                  />
                  <label htmlFor="hasAR" className="text-sm">AR Try-On Available</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isVerified"
                    checked={filters.isVerified}
                    onCheckedChange={(checked) => updateFilter("isVerified", checked === true)}
                  />
                  <label htmlFor="isVerified" className="text-sm">Verified Vendors Only</label>
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => updateFilter("sortBy", value as SearchFilters['sortBy'])}
                >
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
          {filters.brand && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Brand: {filters.brand}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("brand")} />
            </Badge>
          )}
          {(filters.priceRange[0] > 0 || filters.priceRange[1] < 200000) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Price: {formatCurrency(filters.priceRange[0])} - {formatCurrency(filters.priceRange[1])}
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