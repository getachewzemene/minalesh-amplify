import { useState, useEffect } from "react";
import { Package, AlertTriangle, TrendingUp, TrendingDown, Plus, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  sku: string;
  stock_quantity: number;
  low_stock_threshold: number;
  price: number;
  sale_price?: number;
  category_id?: string;
  is_active: boolean;
  view_count: number;
  sale_count: number;
  created_at: string;
}

interface InventoryStats {
  totalProducts: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
}

export function InventoryManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<InventoryStats>({ totalProducts: 0, lowStockItems: 0, outOfStockItems: 0, totalValue: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    stock_quantity: 0,
    low_stock_threshold: 5,
    price: 0,
    description: "",
  });
  const { user, profile } = useAuth();

  useEffect(() => {
    if (profile?.isVendor) {
      fetchProducts();
    }
  }, [profile]);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, filterStatus]);

  const fetchProducts = async () => {
    if (!profile) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Transform the data to match the expected format
        const transformedData = data.map((product: any) => ({
          ...product,
          stock_quantity: product.stockQuantity,
          low_stock_threshold: product.lowStockThreshold,
          sale_price: product.salePrice,
          category_id: product.categoryId,
          is_active: product.isActive,
          view_count: product.viewCount,
          sale_count: product.saleCount,
          created_at: product.createdAt,
        }));
        setProducts(transformedData);
        calculateStats(transformedData);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const calculateStats = (productList: Product[]) => {
    const totalProducts = productList.length;
    const lowStockItems = productList.filter(p => p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0).length;
    const outOfStockItems = productList.filter(p => p.stock_quantity === 0).length;
    const totalValue = productList.reduce((sum, p) => sum + (p.stock_quantity * p.price), 0);

    setStats({ totalProducts, lowStockItems, outOfStockItems, totalValue });
  };

  const filterProducts = () => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    switch (filterStatus) {
      case "low_stock":
        filtered = filtered.filter(p => p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0);
        break;
      case "out_of_stock":
        filtered = filtered.filter(p => p.stock_quantity === 0);
        break;
      case "active":
        filtered = filtered.filter(p => p.is_active);
        break;
      case "inactive":
        filtered = filtered.filter(p => !p.is_active);
        break;
    }

    setFilteredProducts(filtered);
  };

  const addProduct = async () => {
    if (!profile || !newProduct.name || !newProduct.sku) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const productData = {
        name: newProduct.name,
        sku: newProduct.sku,
        stockQuantity: newProduct.stock_quantity,
        lowStockThreshold: newProduct.low_stock_threshold,
        price: newProduct.price,
        description: newProduct.description,
        slug: newProduct.name.toLowerCase().replace(/\s+/g, '-'),
      };

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        toast.success("Product added successfully!");
        setIsAddDialogOpen(false);
        setNewProduct({ name: "", sku: "", stock_quantity: 0, low_stock_threshold: 5, price: 0, description: "" });
        fetchProducts();
      } else {
        toast.error("Failed to add product");
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error("Failed to add product");
    }
  };

  const updateStock = async (productId: string, newStock: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id: productId, stockQuantity: newStock }),
      });

      if (response.ok) {
        toast.success("Stock updated successfully!");
        fetchProducts();
      } else {
        toast.error("Failed to update stock");
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error("Failed to update stock");
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id: productId, isActive: !currentStatus }),
      });

      if (response.ok) {
        toast.success(`Product ${!currentStatus ? "activated" : "deactivated"} successfully!`);
        fetchProducts();
      } else {
        toast.error("Failed to update product status");
      }
    } catch (error) {
      console.error('Error updating product status:', error);
      toast.error("Failed to update product status");
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.stock_quantity === 0) return { status: "Out of Stock", color: "bg-red-100 text-red-800" };
    if (product.stock_quantity <= product.low_stock_threshold) return { status: "Low Stock", color: "bg-yellow-100 text-yellow-800" };
    return { status: "In Stock", color: "bg-green-100 text-green-800" };
  };

  if (!profile?.isVendor) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">This feature is only available for vendors</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Inventory Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="Enter SKU"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={newProduct.stock_quantity}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="threshold">Low Stock Threshold</Label>
                  <Input
                    id="threshold"
                    type="number"
                    value={newProduct.low_stock_threshold}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, low_stock_threshold: parseInt(e.target.value) || 5 }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="price">Price (ETB)</Label>
                <Input
                  id="price"
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter product description"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={addProduct} className="flex-1">Add Product</Button>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.lowStockItems}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.outOfStockItems}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="low_stock">Low Stock</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-4">Product</th>
                  <th className="text-left p-4">SKU</th>
                  <th className="text-left p-4">Stock</th>
                  <th className="text-left p-4">Price</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Performance</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  return (
                    <tr key={product.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">ID: {product.id.slice(0, 8)}</p>
                        </div>
                      </td>
                      <td className="p-4">{product.sku}</td>
                      <td className="p-4">
                        <div>
                          <Input
                            type="number"
                            value={product.stock_quantity}
                            onChange={(e) => updateStock(product.id, parseInt(e.target.value) || 0)}
                            className="w-20"
                          />
                          <Badge className={`mt-1 ${stockStatus.color}`}>
                            {stockStatus.status}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{formatCurrency(product.price)}</p>
                          {product.sale_price && (
                            <p className="text-sm text-muted-foreground line-through">
                              {formatCurrency(product.sale_price)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={product.is_active ? "default" : "secondary"}>
                          {product.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <p>{product.view_count} views</p>
                          <p>{product.sale_count} sales</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleProductStatus(product.id, product.is_active)}
                          >
                            {product.is_active ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredProducts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No products found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}