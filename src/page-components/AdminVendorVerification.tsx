'use client'

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Store, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Mail,
  Phone,
  FileText,
  Package,
  Calendar
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Vendor {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  tradeLicense?: string;
  tinNumber?: string;
  vendorStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  createdAt: string;
  user: {
    id: string;
    email: string;
    emailVerified: string | null;
    createdAt: string;
    role: string;
  };
  _count: {
    products: number;
  };
}

export default function AdminVendorVerification() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'suspend' | null>(null);
  const [processingVendor, setProcessingVendor] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchVendors();
  }, [statusFilter]);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const url = statusFilter && statusFilter !== 'all'
        ? `/api/admin/vendors?status=${statusFilter}`
        : '/api/admin/vendors';
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVendors(data.vendors || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch vendors",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast({
        title: "Error",
        description: "An error occurred while fetching vendors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateVendorStatus = async (vendorId: string, status: string) => {
    setProcessingVendor(vendorId);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vendorStatus: status }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Vendor ${status} successfully`,
        });
        fetchVendors();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to update vendor status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating vendor status:', error);
      toast({
        title: "Error",
        description: "An error occurred while updating vendor status",
        variant: "destructive",
      });
    } finally {
      setProcessingVendor(null);
      setSelectedVendor(null);
      setActionType(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'suspended':
        return <Badge variant="outline" className="border-orange-500 text-orange-500"><AlertCircle className="h-3 w-3 mr-1" />Suspended</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const confirmAction = (vendor: Vendor, action: 'approve' | 'reject' | 'suspend') => {
    setSelectedVendor(vendor);
    setActionType(action);
  };

  const executeAction = () => {
    if (selectedVendor && actionType) {
      const statusMap = {
        approve: 'approved',
        reject: 'rejected',
        suspend: 'suspended',
      };
      updateVendorStatus(selectedVendor.id, statusMap[actionType]);
    }
  };

  const getActionDialogContent = () => {
    if (!selectedVendor || !actionType) return null;

    const actionMessages = {
      approve: {
        title: "Approve Vendor",
        description: `Are you sure you want to approve ${selectedVendor.firstName} ${selectedVendor.lastName} as a vendor? They will be able to list products as a verified vendor.`,
      },
      reject: {
        title: "Reject Vendor",
        description: `Are you sure you want to reject ${selectedVendor.firstName} ${selectedVendor.lastName}'s vendor application? They will be notified of this decision.`,
      },
      suspend: {
        title: "Suspend Vendor",
        description: `Are you sure you want to suspend ${selectedVendor.firstName} ${selectedVendor.lastName}? Their products will remain listed but marked as from a suspended vendor.`,
      },
    };

    return actionMessages[actionType];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Vendor Verification</h2>
          <p className="text-muted-foreground">Review and manage vendor applications</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading vendors...</p>
        </div>
      ) : vendors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Store className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No vendors found</p>
            <p className="text-sm text-muted-foreground">
              {statusFilter && statusFilter !== 'all' ? `No ${statusFilter} vendors at this time` : 'No vendors registered yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {vendors.map((vendor) => (
            <Card key={vendor.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Store className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        {vendor.firstName} {vendor.lastName}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(vendor.vendorStatus)}
                        {vendor.user.emailVerified && (
                          <Badge variant="outline" className="text-xs">
                            <Mail className="h-3 w-3 mr-1" />Email Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {vendor.vendorStatus === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-600 hover:bg-green-50"
                        onClick={() => confirmAction(vendor, 'approve')}
                        disabled={processingVendor === vendor.id}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => confirmAction(vendor, 'reject')}
                        disabled={processingVendor === vendor.id}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                  {vendor.vendorStatus === 'approved' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-orange-600 border-orange-600 hover:bg-orange-50"
                      onClick={() => confirmAction(vendor, 'suspend')}
                      disabled={processingVendor === vendor.id}
                    >
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Suspend
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
                    <p className="text-sm flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {vendor.user.email}
                    </p>
                  </div>
                  {vendor.phone && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Phone</p>
                      <p className="text-sm flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {vendor.phone}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Trade License</p>
                    <p className="text-sm flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {vendor.tradeLicense || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">TIN Number</p>
                    <p className="text-sm flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {vendor.tinNumber || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Products</p>
                    <p className="text-sm flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {vendor._count.products} product{vendor._count.products !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Registered</p>
                    <p className="text-sm flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(vendor.createdAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!selectedVendor && !!actionType} onOpenChange={() => {
        setSelectedVendor(null);
        setActionType(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getActionDialogContent()?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {getActionDialogContent()?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeAction}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
