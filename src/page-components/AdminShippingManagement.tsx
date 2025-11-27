'use client'

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight, Truck, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ShippingZone {
  id: string;
  name: string;
  description?: string;
  countries: string[];
  regions: string[];
  cities: string[];
  postalCodes: string[];
  isActive: boolean;
  createdAt: string;
  shippingRates?: any[];
}

interface ShippingZoneFormData {
  id?: string;
  name: string;
  description: string;
  countries: string;
  regions: string;
  cities: string;
  postalCodes: string;
  isActive: boolean;
}

const initialFormData: ShippingZoneFormData = {
  name: '',
  description: '',
  countries: 'ET',
  regions: '',
  cities: '',
  postalCodes: '',
  isActive: true,
};

export default function AdminShippingManagement() {
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ShippingZoneFormData>(initialFormData);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchShippingZones();
  }, []);

  const fetchShippingZones = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/shipping-zones', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch shipping zones');
      
      const data = await response.json();
      setShippingZones(data.shippingZones);
    } catch (error) {
      console.error('Error fetching shipping zones:', error);
      toast.error('Failed to load shipping zones');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const url = isEditing ? `/api/admin/shipping-zones/${formData.id}` : '/api/admin/shipping-zones';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          countries: formData.countries.split(',').map(c => c.trim()).filter(Boolean),
          regions: formData.regions ? formData.regions.split(',').map(r => r.trim()).filter(Boolean) : [],
          cities: formData.cities ? formData.cities.split(',').map(c => c.trim()).filter(Boolean) : [],
          postalCodes: formData.postalCodes ? formData.postalCodes.split(',').map(p => p.trim()).filter(Boolean) : [],
          isActive: formData.isActive,
        }),
      });

      if (!response.ok) throw new Error('Failed to save shipping zone');

      toast.success(isEditing ? 'Shipping zone updated successfully' : 'Shipping zone created successfully');
      setIsDialogOpen(false);
      setFormData(initialFormData);
      setIsEditing(false);
      fetchShippingZones();
    } catch (error) {
      console.error('Error saving shipping zone:', error);
      toast.error('Failed to save shipping zone');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (zone: ShippingZone) => {
    setFormData({
      id: zone.id,
      name: zone.name,
      description: zone.description || '',
      countries: Array.isArray(zone.countries) ? zone.countries.join(', ') : '',
      regions: Array.isArray(zone.regions) ? zone.regions.join(', ') : '',
      cities: Array.isArray(zone.cities) ? zone.cities.join(', ') : '',
      postalCodes: Array.isArray(zone.postalCodes) ? zone.postalCodes.join(', ') : '',
      isActive: zone.isActive,
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/shipping-zones/${deleteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to delete shipping zone');

      toast.success('Shipping zone deleted successfully');
      setDeleteId(null);
      fetchShippingZones();
    } catch (error) {
      console.error('Error deleting shipping zone:', error);
      toast.error('Failed to delete shipping zone');
    }
  };

  const filteredZones = shippingZones.filter((zone) =>
    zone.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Zones Management
              </CardTitle>
              <CardDescription>
                Define geographical zones for shipping rates and delivery options
              </CardDescription>
            </div>
            <Button onClick={() => { setFormData(initialFormData); setIsEditing(false); setIsDialogOpen(true); }} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Shipping Zone
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search shipping zones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : filteredZones.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No shipping zones found</div>
          ) : (
            <div className="space-y-4">
              {filteredZones.map((zone) => (
                <div key={zone.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">{zone.name}</h3>
                        <Badge variant={zone.isActive ? 'default' : 'secondary'}>
                          {zone.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {zone.description && (
                        <p className="text-sm text-muted-foreground mb-3">{zone.description}</p>
                      )}
                      <div className="space-y-2 text-sm">
                        {Array.isArray(zone.countries) && zone.countries.length > 0 && (
                          <div className="flex gap-2">
                            <span className="font-medium">Countries:</span>
                            <span className="text-muted-foreground">{zone.countries.join(', ')}</span>
                          </div>
                        )}
                        {Array.isArray(zone.regions) && zone.regions.length > 0 && (
                          <div className="flex gap-2">
                            <span className="font-medium">Regions:</span>
                            <span className="text-muted-foreground">{zone.regions.join(', ')}</span>
                          </div>
                        )}
                        {Array.isArray(zone.cities) && zone.cities.length > 0 && (
                          <div className="flex gap-2">
                            <span className="font-medium">Cities:</span>
                            <span className="text-muted-foreground">{zone.cities.join(', ')}</span>
                          </div>
                        )}
                        {zone.shippingRates && zone.shippingRates.length > 0 && (
                          <div className="flex gap-2">
                            <span className="font-medium">Shipping Methods:</span>
                            <span className="text-muted-foreground">{zone.shippingRates.length} configured</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(zone)} className="flex items-center gap-2">
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setDeleteId(zone.id)} className="flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Shipping Zone' : 'Create New Shipping Zone'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update the shipping zone information' : 'Add a new geographical shipping zone'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Zone Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Ethiopia - Addis Ababa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="countries">Countries * (comma-separated)</Label>
              <Input
                id="countries"
                value={formData.countries}
                onChange={(e) => setFormData({ ...formData, countries: e.target.value })}
                required
                placeholder="ET, KE, UG"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="regions">Regions (comma-separated)</Label>
              <Input
                id="regions"
                value={formData.regions}
                onChange={(e) => setFormData({ ...formData, regions: e.target.value })}
                placeholder="Optional: Region 1, Region 2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cities">Cities (comma-separated)</Label>
              <Input
                id="cities"
                value={formData.cities}
                onChange={(e) => setFormData({ ...formData, cities: e.target.value })}
                placeholder="Optional: City 1, City 2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCodes">Postal Codes (comma-separated)</Label>
              <Input
                id="postalCodes"
                value={formData.postalCodes}
                onChange={(e) => setFormData({ ...formData, postalCodes: e.target.value })}
                placeholder="Optional: 1000, 2000"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); setFormData(initialFormData); setIsEditing(false); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the shipping zone and all associated shipping rates.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
