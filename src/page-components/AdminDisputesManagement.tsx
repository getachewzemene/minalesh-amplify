"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { AlertCircle, MessageSquare, Package, User, Eye, CheckCircle, XCircle } from 'lucide-react';

interface Dispute {
  id: string;
  type: string;
  status: string;
  description: string;
  createdAt: string;
  order: {
    orderNumber: string;
    totalAmount: number;
  };
  vendor: {
    displayName: string;
  };
  user: {
    email: string;
    profile: {
      displayName: string;
    } | null;
  };
  messageCount: number;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'pending_vendor_response':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'pending_admin_review':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    case 'resolved':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'closed':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

const formatStatus = (status: string) => {
  return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const formatType = (type: string) => {
  return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default function AdminDisputesManagement() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);
  const [selectedDisputeData, setSelectedDisputeData] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState('');
  const [resolutionType, setResolutionType] = useState<'refund' | 'replacement' | 'partial_refund' | 'no_action'>('no_action');
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [resolutionStatus, setResolutionStatus] = useState<'resolved' | 'closed'>('resolved');
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  const fetchDisputes = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const url = `/api/admin/disputes${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setDisputes(data.disputes || []);
      }
    } catch (error) {
      console.error('Error fetching disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [statusFilter, typeFilter]);

  const handleResolveDispute = async () => {
    if (!selectedDispute || !resolution.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a resolution',
        variant: 'destructive',
      });
      return;
    }

    // Validate refund amount if refund-related resolution type
    if ((resolutionType === 'refund' || resolutionType === 'partial_refund') && !refundAmount) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a refund amount',
        variant: 'destructive',
      });
      return;
    }

    // Build resolution text based on type
    let fullResolution = resolution.trim();
    if (resolutionType === 'refund') {
      fullResolution = `Full Refund (ETB ${refundAmount}): ${resolution.trim()}`;
    } else if (resolutionType === 'partial_refund') {
      fullResolution = `Partial Refund (ETB ${refundAmount}): ${resolution.trim()}`;
    } else if (resolutionType === 'replacement') {
      fullResolution = `Order Replacement: ${resolution.trim()}`;
    } else if (resolutionType === 'no_action') {
      fullResolution = `No Action Required: ${resolution.trim()}`;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const requestBody: { status: string; resolution: string; refundAmount?: number } = {
        status: resolutionStatus,
        resolution: fullResolution,
      };

      // Include refund amount if applicable
      if ((resolutionType === 'refund' || resolutionType === 'partial_refund') && refundAmount) {
        requestBody.refundAmount = parseFloat(refundAmount);
      }

      const response = await fetch(`/api/admin/disputes/${selectedDispute}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Dispute ${resolutionStatus === 'resolved' ? 'resolved' : 'closed'} successfully`,
        });
        setSelectedDispute(null);
        setSelectedDisputeData(null);
        setResolution('');
        setRefundAmount('');
        setResolutionType('no_action');
        await fetchDisputes();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to resolve dispute');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to resolve dispute',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const stats = {
    total: disputes.length,
    open: disputes.filter(d => d.status === 'open').length,
    pendingVendor: disputes.filter(d => d.status === 'pending_vendor_response').length,
    pendingAdmin: disputes.filter(d => d.status === 'pending_admin_review').length,
    resolved: disputes.filter(d => d.status === 'resolved').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Dispute Management</h2>
        <p className="text-muted-foreground">
          Manage and mediate customer-vendor disputes
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Disputes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
            <div className="text-sm text-muted-foreground">Open</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingVendor}</div>
            <div className="text-sm text-muted-foreground">Pending Vendor</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.pendingAdmin}</div>
            <div className="text-sm text-muted-foreground">Needs Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <div className="text-sm text-muted-foreground">Resolved</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="pending_vendor_response">Pending Vendor Response</SelectItem>
                  <SelectItem value="pending_admin_review">Pending Admin Review</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="not_received">Not Received</SelectItem>
                  <SelectItem value="not_as_described">Not As Described</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                  <SelectItem value="wrong_item">Wrong Item</SelectItem>
                  <SelectItem value="refund_issue">Refund Issue</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disputes List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : disputes.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Disputes Found</h3>
              <p className="text-muted-foreground">No disputes match the current filters</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <Card key={dispute.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">
                        {formatType(dispute.type)}
                      </h3>
                      <Badge className={getStatusColor(dispute.status)}>
                        {formatStatus(dispute.status)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        Order #{dispute.order.orderNumber}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Customer: {dispute.user.profile?.displayName || dispute.user.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Vendor: {dispute.vendor.displayName}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm mb-4 overflow-hidden" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  maxHeight: '3em'
                }}>{dispute.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {dispute.messageCount} message{dispute.messageCount !== 1 ? 's' : ''}
                    </span>
                    <span>Filed {format(new Date(dispute.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/disputes/${dispute.id}`, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {(dispute.status === 'pending_admin_review' || dispute.status === 'open') && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedDispute(dispute.id);
                              setSelectedDisputeData(dispute);
                              setResolution('');
                              setRefundAmount('');
                              setResolutionType('no_action');
                              setResolutionStatus('resolved');
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Resolve Dispute</DialogTitle>
                            <DialogDescription>
                              Provide a resolution for this dispute between the customer and vendor.
                              {selectedDisputeData && (
                                <span className="block mt-1 text-xs">
                                  Order #{selectedDisputeData.order.orderNumber} • Total: ETB {selectedDisputeData.order.totalAmount.toLocaleString()}
                                </span>
                              )}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Resolution Type</Label>
                              <Select value={resolutionType} onValueChange={(v) => setResolutionType(v as 'refund' | 'replacement' | 'partial_refund' | 'no_action')}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="refund">Full Refund</SelectItem>
                                  <SelectItem value="partial_refund">Partial Refund</SelectItem>
                                  <SelectItem value="replacement">Order Replacement</SelectItem>
                                  <SelectItem value="no_action">No Action Required</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {(resolutionType === 'refund' || resolutionType === 'partial_refund') && (
                              <div className="space-y-2">
                                <Label htmlFor="refundAmount">
                                  Refund Amount (ETB)
                                  {selectedDisputeData && resolutionType === 'refund' && (
                                    <span className="text-xs text-muted-foreground ml-2">
                                      Max: {selectedDisputeData.order.totalAmount.toLocaleString()}
                                    </span>
                                  )}
                                </Label>
                                <Input
                                  id="refundAmount"
                                  type="number"
                                  placeholder="Enter refund amount"
                                  value={refundAmount}
                                  onChange={(e) => setRefundAmount(e.target.value)}
                                  max={selectedDisputeData?.order.totalAmount}
                                />
                              </div>
                            )}
                            
                            <div className="space-y-2">
                              <Label>Resolution Status</Label>
                              <Select value={resolutionStatus} onValueChange={(v) => setResolutionStatus(v as 'resolved' | 'closed')}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="resolved">Resolved</SelectItem>
                                  <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="resolution">Resolution Details</Label>
                              <Textarea
                                id="resolution"
                                placeholder="Explain the resolution decision and any actions taken..."
                                value={resolution}
                                onChange={(e) => setResolution(e.target.value)}
                                rows={4}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedDispute(null);
                                setSelectedDisputeData(null);
                                setResolution('');
                                setRefundAmount('');
                                setResolutionType('no_action');
                              }}
                              disabled={actionLoading}
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleResolveDispute} disabled={actionLoading}>
                              {actionLoading ? 'Submitting...' : 'Submit Resolution'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
