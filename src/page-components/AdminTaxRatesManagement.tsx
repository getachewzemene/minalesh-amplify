'use client'

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  Percent,
  Filter
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TaxRate {
  id: string;
  name: string;
  description?: string;
  rate: number;
  country: string;
  region?: string;
  city?: string;
  taxType: string;
  isCompound: boolean;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

interface TaxRateFormData {
  id?: string;
  name: string;
  description: string;
  rate: string;
  country: string;
  region: string;
  city: string;
  taxType: string;
  isCompound: boolean;
  isActive: boolean;
  priority: string;
}

const initialFormData: TaxRateFormData = {
  name: '',
  description: '',
  rate: '',
  country: 'ET',
  region: '',
  city: '',
  taxType: 'VAT',
  isCompound: false,
  isActive: true,
  priority: '0',
};

export default function AdminTaxRatesManagement() {
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<TaxRateFormData>(initialFormData);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTaxRates();
  }, [page]);

  const fetchTaxRates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/tax-rates?page=${page}&perPage=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch tax rates');
      
      const data = await response.json();
      setTaxRates(data.taxRates);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching tax rates:', error);
      toast.error('Failed to load tax rates');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const url = isEditing
        ? `/api/admin/tax-rates/${formData.id}`
        : '/api/admin/tax-rates';
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
          rate: parseFloat(formData.rate),
          country: formData.country,
          region: formData.region || undefined,
          city: formData.city || undefined,
          taxType: formData.taxType,
          isCompound: formData.isCompound,
          isActive: formData.isActive,
          priority: parseInt(formData.priority) || 0,
        }),
      });

      if (!response.ok) throw new Error('Failed to save tax rate');

      toast.success(isEditing ? 'Tax rate updated successfully' : 'Tax rate created successfully');
      setIsDialogOpen(false);
      setFormData(initialFormData);
      setIsEditing(false);
      fetchTaxRates();
    } catch (error) {
      console.error('Error saving tax rate:', error);
      toast.error('Failed to save tax rate');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (taxRate: TaxRate) => {
    setFormData({
      id: taxRate.id,
      name: taxRate.name,
      description: taxRate.description || '',
      rate: taxRate.rate.toString(),
      country: taxRate.country,
      region: taxRate.region || '',
      city: taxRate.city || '',
      taxType: taxRate.taxType,
      isCompound: taxRate.isCompound,
      isActive: taxRate.isActive,
      priority: taxRate.priority.toString(),
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/tax-rates/${deleteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete tax rate');

      toast.success('Tax rate deleted successfully');
      setDeleteId(null);
      fetchTaxRates();
    } catch (error) {
      console.error('Error deleting tax rate:', error);
      toast.error('Failed to delete tax rate');
    }
  };

  const handleNewTaxRate = () => {
    setFormData(initialFormData);
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const filteredTaxRates = taxRates.filter((rate) =>
    rate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rate.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rate.taxType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Tax Rates Management
              </CardTitle>
              <CardDescription>
                Manage tax rates for different regions and jurisdictions
              </CardDescription>
            </div>
            <Button onClick={handleNewTaxRate} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Tax Rate
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, country, or tax type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tax Rates List */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredTaxRates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No tax rates found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTaxRates.map((taxRate) => (
                <div
                  key={taxRate.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{taxRate.name}</h3>
                        <Badge variant={taxRate.isActive ? 'default' : 'secondary'}>
                          {taxRate.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">{taxRate.taxType}</Badge>
                        {taxRate.isCompound && (
                          <Badge variant="outline">Compound</Badge>
                        )}
                      </div>
                      {taxRate.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {taxRate.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>Rate: <strong className="text-primary">{(taxRate.rate * 100).toFixed(2)}%</strong></span>
                        <span>Country: {taxRate.country}</span>
                        {taxRate.region && <span>Region: {taxRate.region}</span>}
                        {taxRate.city && <span>City: {taxRate.city}</span>}
                        <span>Priority: {taxRate.priority}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(taxRate)}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteId(taxRate.id)}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Tax Rate' : 'Create New Tax Rate'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the tax rate information'
                : 'Add a new tax rate to the system'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Standard VAT"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate">Rate (decimal) *</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.0001"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  required
                  placeholder="e.g., 0.15 for 15%"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxType">Tax Type</Label>
                <Input
                  id="taxType"
                  value={formData.taxType}
                  onChange={(e) => setFormData({ ...formData, taxType: e.target.value })}
                  placeholder="e.g., VAT, GST"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="ET"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isCompound"
                  checked={formData.isCompound}
                  onCheckedChange={(checked) => setFormData({ ...formData, isCompound: checked })}
                />
                <Label htmlFor="isCompound">Compound Tax</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setFormData(initialFormData);
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the tax rate.
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
