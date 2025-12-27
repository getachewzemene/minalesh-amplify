"use client";

import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/container';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { AlertCircle, MessageSquare, Package } from 'lucide-react';
import Link from 'next/link';

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
  vendor?: {
    displayName: string;
  };
  messages: Array<{
    message: string;
    createdAt: string;
    isAdmin: boolean;
  }>;
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

export default function DisputesPage() {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchDisputes = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        
        const url = statusFilter === 'all' 
          ? '/api/disputes' 
          : `/api/disputes?status=${statusFilter}`;
        
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

    if (user) {
      fetchDisputes();
    }
  }, [user, statusFilter]);

  const filteredDisputes = disputes;

  return (
    <>
      <Navbar />
      <Container className="py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">My Disputes</h1>
          <p className="text-muted-foreground">
            Manage and track your order disputes
          </p>
        </div>

        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="pending_vendor_response">Pending Vendor</TabsTrigger>
            <TabsTrigger value="pending_admin_review">Admin Review</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>
        </Tabs>

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
        ) : filteredDisputes.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Disputes Found</h3>
                <p className="text-muted-foreground">
                  {statusFilter === 'all' 
                    ? "You haven't filed any disputes yet" 
                    : `No disputes with status: ${formatStatus(statusFilter)}`}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredDisputes.map((dispute) => (
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
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          Order #{dispute.order.orderNumber}
                        </span>
                        {dispute.vendor && (
                          <span>Vendor: {dispute.vendor.displayName}</span>
                        )}
                        <span>Filed {format(new Date(dispute.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm mb-4 line-clamp-2">{dispute.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                      <span>{dispute.messages.length} message{dispute.messages.length !== 1 ? 's' : ''}</span>
                      {dispute.messages.length > 0 && (
                        <span className="text-xs">
                          • Last: {format(new Date(dispute.messages[dispute.messages.length - 1].createdAt), 'MMM d, h:mm a')}
                        </span>
                      )}
                    </div>
                    <Link href={`/disputes/${dispute.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Container>
      <Footer />
    </>
  );
}
