"use client";

import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/container';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';
import { AlertCircle, ArrowLeft, CheckCircle, ExternalLink, Package, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DisputeMessaging } from '@/components/disputes/DisputeMessaging';
import { useToast } from '@/hooks/use-toast';

interface DisputeDetail {
  id: string;
  type: string;
  status: string;
  description: string;
  evidenceUrls: string[];
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  order: {
    orderNumber: string;
    totalAmount: number;
    createdAt: string;
  };
  vendor: {
    id: string;
    displayName: string;
    user: {
      email: string;
    };
  };
  user: {
    id: string;
    email: string;
    profile: {
      displayName: string;
    } | null;
  };
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

interface DisputeDetailPageProps {
  disputeId: string;
}

export default function DisputeDetailPage({ disputeId }: DisputeDetailPageProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [dispute, setDispute] = useState<DisputeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDispute = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const res = await fetch(`/api/disputes/${disputeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setDispute(data.dispute);
      } else if (res.status === 404) {
        router.push('/disputes');
      }
    } catch (error) {
      console.error('Error fetching dispute:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDispute();
    }
  }, [user, disputeId]);

  const handleCloseDispute = async () => {
    if (!confirm('Are you sure you want to close this dispute?')) {
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/disputes/${disputeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'closed',
          resolution: 'Closed by customer',
        }),
      });

      if (response.ok) {
        toast({
          title: 'Dispute Closed',
          description: 'The dispute has been closed',
        });
        await fetchDispute();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to close dispute');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to close dispute',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Container className="py-8">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-96" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48" />
            </div>
          </div>
        </Container>
        <Footer />
      </>
    );
  }

  if (!dispute) {
    return (
      <>
        <Navbar />
        <Container className="py-8">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Dispute Not Found</h2>
            <p className="text-muted-foreground mb-4">The dispute you're looking for doesn't exist</p>
            <Link href="/disputes">
              <Button>Back to Disputes</Button>
            </Link>
          </div>
        </Container>
        <Footer />
      </>
    );
  }

  const isCustomer = dispute.user.id === user?.userId;

  return (
    <>
      <Navbar />
      <Container className="py-8">
        <div className="mb-6">
          <Link href="/disputes">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Disputes
            </Button>
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{formatType(dispute.type)}</h1>
              <p className="text-muted-foreground">
                Dispute ID: {dispute.id.substring(0, 8)}...
              </p>
            </div>
            <Badge className={getStatusColor(dispute.status)}>
              {formatStatus(dispute.status)}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Dispute Details */}
            <Card>
              <CardHeader>
                <CardTitle>Dispute Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm whitespace-pre-wrap">{dispute.description}</p>
                </div>

                {dispute.evidenceUrls.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Evidence</h3>
                    <div className="space-y-2">
                      {dispute.evidenceUrls.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Evidence {index + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {dispute.resolution && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Resolution</AlertTitle>
                    <AlertDescription>{dispute.resolution}</AlertDescription>
                    {dispute.resolvedAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Resolved on {format(new Date(dispute.resolvedAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    )}
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Messaging */}
            {dispute.status !== 'closed' && dispute.status !== 'resolved' && (
              <DisputeMessaging disputeId={dispute.id} currentUserId={user?.userId || ''} />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Order Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Order #{dispute.order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      Placed {format(new Date(dispute.order.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-muted-foreground">Order Total</p>
                  <p className="font-semibold">ETB {dispute.order.totalAmount.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Parties Involved */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Parties Involved</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Customer</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <div>
                      <p className="font-medium">{dispute.user.profile?.displayName || 'Customer'}</p>
                      <p className="text-xs text-muted-foreground">{dispute.user.email}</p>
                    </div>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-muted-foreground mb-1">Vendor</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <div>
                      <p className="font-medium">{dispute.vendor.displayName}</p>
                      <p className="text-xs text-muted-foreground">{dispute.vendor.user.email}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Filed</p>
                  <p className="font-medium">{format(new Date(dispute.createdAt), 'MMM d, yyyy h:mm a')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{format(new Date(dispute.updatedAt), 'MMM d, yyyy h:mm a')}</p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            {isCustomer && dispute.status !== 'closed' && dispute.status !== 'resolved' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleCloseDispute}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Closing...' : 'Close Dispute'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Container>
      <Footer />
    </>
  );
}
