import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  Truck,
  MapPin,
  Calendar,
  Search,
  Filter,
  Plus,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Ship,
  Plane,
  Car
} from "lucide-react";

const mockShipments = [
  {
    id: "SH001",
    orderId: "ORD-20241201-000001",
    customer: "Abebe Kebede",
    destination: "Addis Ababa, Ethiopia",
    origin: "Hawassa, Ethiopia",
    status: "in_transit",
    carrier: "DHL Express",
    trackingNumber: "1234567890",
    estimatedDelivery: "2024-12-15",
    actualDelivery: null,
    weight: "2.5kg",
    dimensions: "30x20x15cm",
    shippingMethod: "express",
    cost: 450,
    items: [
      { name: "iPhone 15 Pro", quantity: 1, sku: "IP15P-256-BLU" }
    ]
  },
  {
    id: "SH002", 
    orderId: "ORD-20241201-000002",
    customer: "Meron Tadesse",
    destination: "Dire Dawa, Ethiopia",
    origin: "Addis Ababa, Ethiopia",
    status: "delivered",
    carrier: "Ethiopian Postal Service",
    trackingNumber: "EP987654321",
    estimatedDelivery: "2024-12-10",
    actualDelivery: "2024-12-09",
    weight: "0.8kg",
    dimensions: "25x15x5cm",
    shippingMethod: "standard",
    cost: 85,
    items: [
      { name: "Ray-Ban Aviator", quantity: 1, sku: "RB-AVI-GLD" }
    ]
  },
  {
    id: "SH003",
    orderId: "ORD-20241201-000003", 
    customer: "Daniel Hailu",
    destination: "Mekelle, Ethiopia",
    origin: "Adama, Ethiopia",
    status: "pending",
    carrier: "Pending Assignment",
    trackingNumber: "N/A",
    estimatedDelivery: "2024-12-18",
    actualDelivery: null,
    weight: "1.2kg",
    dimensions: "20x20x10cm",
    shippingMethod: "standard",
    cost: 120,
    items: [
      { name: "Samsung Galaxy Buds", quantity: 2, sku: "SGB-PRO-BLK" }
    ]
  }
];

const carriers = [
  { id: "dhl", name: "DHL Express", icon: Plane },
  { id: "eps", name: "Ethiopian Postal Service", icon: Truck },
  { id: "fedex", name: "FedEx", icon: Plane },
  { id: "aramex", name: "Aramex", icon: Ship },
  { id: "local", name: "Local Delivery", icon: Car }
];

export default function ShippingManagement() {
  const [shipments, setShipments] = useState(mockShipments);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [carrierFilter, setCarrierFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Shipping Management — Minalesh";
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-500 hover:bg-green-600';
      case 'in_transit': return 'bg-blue-500 hover:bg-blue-600';
      case 'pending': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'cancelled': return 'bg-red-500 hover:bg-red-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'in_transit': return <Truck className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getCarrierIcon = (carrierName: string) => {
    const carrier = carriers.find(c => carrierName.toLowerCase().includes(c.name.toLowerCase().split(' ')[0]));
    const IconComponent = carrier?.icon || Truck;
    return <IconComponent className="h-4 w-4" />;
  };

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = 
      shipment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || shipment.status === statusFilter;
    const matchesCarrier = carrierFilter === "all" || shipment.carrier.toLowerCase().includes(carrierFilter.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesCarrier;
  });

  const stats = {
    total: shipments.length,
    pending: shipments.filter(s => s.status === 'pending').length,
    inTransit: shipments.filter(s => s.status === 'in_transit').length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
    totalCost: shipments.reduce((sum, s) => sum + s.cost, 0)
  };

  const handleCreateShipment = () => {
    toast({
      title: "Create Shipment",
      description: "Shipment creation form would open here."
    });
  };

  const handleTrackShipment = (trackingNumber: string) => {
    toast({
      title: "Tracking Shipment",
      description: `Opening tracking for ${trackingNumber}`
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-6 md:py-8">
        <Container>
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div className="bg-gradient-hero text-white rounded-lg p-6 md:p-8">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Shipping Management</h1>
              <p className="text-white/90 text-base md:text-lg">
                Track shipments, manage carriers, and ensure timely delivery across Ethiopia
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6 md:mb-8">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Shipments</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-xl md:text-2xl font-bold text-primary">{stats.total}</div>
                <Package className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pending</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-xl md:text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <Clock className="h-4 w-4 md:h-5 md:w-5 text-yellow-600" />
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">In Transit</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-xl md:text-2xl font-bold text-blue-600">{stats.inTransit}</div>
                <Truck className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Delivered</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-xl md:text-2xl font-bold text-green-600">{stats.delivered}</div>
                <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Cost</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-xl md:text-2xl font-bold text-primary">{stats.totalCost} ETB</div>
                <Package className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="create">Create Shipment</TabsTrigger>
              <TabsTrigger value="carriers">Carriers</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Filters */}
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filters & Search
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="search">Search</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="search"
                          placeholder="Search shipments..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_transit">In Transit</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Carrier</Label>
                      <Select value={carrierFilter} onValueChange={setCarrierFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All carriers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Carriers</SelectItem>
                          <SelectItem value="dhl">DHL Express</SelectItem>
                          <SelectItem value="eps">Ethiopian Postal Service</SelectItem>
                          <SelectItem value="fedex">FedEx</SelectItem>
                          <SelectItem value="aramex">Aramex</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipments List */}
              <Card className="bg-gradient-card shadow-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Active Shipments ({filteredShipments.length})
                  </CardTitle>
                  <Button onClick={handleCreateShipment} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span className="hidden md:inline">Create Shipment</span>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredShipments.map((shipment) => (
                      <div key={shipment.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${getStatusColor(shipment.status)} text-white`}>
                              {getStatusIcon(shipment.status)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm md:text-base">{shipment.id}</h3>
                              <p className="text-sm text-muted-foreground">Order: {shipment.orderId}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge className={`${getStatusColor(shipment.status)} text-white border-0`}>
                              {shipment.status.replace('_', ' ')}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTrackShipment(shipment.trackingNumber)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              <span className="hidden md:inline">Track</span>
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="space-y-1">
                            <p className="font-medium flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-primary" />
                              Customer
                            </p>
                            <p className="text-muted-foreground">{shipment.customer}</p>
                            <p className="text-muted-foreground">{shipment.destination}</p>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="font-medium flex items-center gap-2">
                              {getCarrierIcon(shipment.carrier)}
                              Carrier
                            </p>
                            <p className="text-muted-foreground">{shipment.carrier}</p>
                            <p className="text-muted-foreground">Track: {shipment.trackingNumber}</p>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="font-medium flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-primary" />
                              Delivery
                            </p>
                            <p className="text-muted-foreground">
                              Est: {shipment.estimatedDelivery}
                            </p>
                            {shipment.actualDelivery && (
                              <p className="text-green-600">
                                Delivered: {shipment.actualDelivery}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <p>Items: {shipment.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}</p>
                          <p>Weight: {shipment.weight} | Dimensions: {shipment.dimensions} | Cost: {shipment.cost} ETB</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="create" className="space-y-6">
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle>Create New Shipment</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Shipment creation form would be implemented here with order selection, 
                    carrier assignment, and shipping details.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="carriers" className="space-y-6">
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle>Carrier Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {carriers.map((carrier) => {
                      const IconComponent = carrier.icon;
                      return (
                        <div key={carrier.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <IconComponent className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="font-semibold">{carrier.name}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Configure rates, coverage areas, and integration settings.
                          </p>
                          <Button variant="outline" size="sm" className="w-full">
                            Configure
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </Container>
      </main>
      <Footer />
    </div>
  );
}