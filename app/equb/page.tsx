'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Calendar, Coins, TrendingUp, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EqubCircle {
  id: string;
  name: string;
  description: string;
  memberLimit: number;
  contributionAmount: number;
  frequency: string;
  startDate: string;
  currentRound: number;
  totalRounds: number;
  status: string;
  creator: {
    id: string;
    profile: {
      firstName: string;
      lastName: string;
    } | null;
  };
  members: any[];
  _count: {
    members: number;
    contributions: number;
  };
}

export default function EqubPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [equbCircles, setEqubCircles] = useState<EqubCircle[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    memberLimit: 10,
    contributionAmount: 1000,
    frequency: 'monthly',
    startDate: '',
  });

  useEffect(() => {
    fetchEqubCircles();
  }, []);

  const fetchEqubCircles = async () => {
    try {
      const response = await fetch('/api/equb/circles?limit=20');
      const result = await response.json();
      
      if (result.success) {
        setEqubCircles(result.data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load Equb circles',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching Equb circles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load Equb circles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEqub = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Login Required',
          description: 'Please login to create an Equb circle',
        });
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/equb/circles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success!',
          description: result.message,
        });
        setCreateDialogOpen(false);
        fetchEqubCircles();
        // Reset form
        setFormData({
          name: '',
          description: '',
          memberLimit: 10,
          contributionAmount: 1000,
          frequency: 'monthly',
          startDate: '',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create Equb circle',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating Equb circle:', error);
      toast({
        title: 'Error',
        description: 'Failed to create Equb circle',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const getFrequencyLabel = (freq: string) => {
    const labels: Record<string, string> = {
      weekly: 'በሳምንት (Weekly)',
      biweekly: 'በሁለት ሳምንት (Bi-weekly)',
      monthly: 'በወር (Monthly)',
    };
    return labels[freq] || freq;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-24 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Ethiopian Equb - እኩብ</h1>
          <p className="text-muted-foreground">
            Join or create rotating savings circles - the traditional Ethiopian way of saving together!
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create Equb Circle</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <form onSubmit={handleCreateEqub}>
              <DialogHeader>
                <DialogTitle>Create New Equb Circle</DialogTitle>
                <DialogDescription>
                  Start a new rotating savings group with your friends and family.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Circle Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Friends Equb 2026"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional: Add details about your circle"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="memberLimit">Members *</Label>
                    <Input
                      id="memberLimit"
                      type="number"
                      min="2"
                      max="50"
                      value={formData.memberLimit}
                      onChange={(e) => setFormData({ ...formData, memberLimit: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contributionAmount">Amount (ETB) *</Label>
                    <Input
                      id="contributionAmount"
                      type="number"
                      min="100"
                      step="50"
                      value={formData.contributionAmount}
                      onChange={(e) => setFormData({ ...formData, contributionAmount: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="frequency">Frequency *</Label>
                  <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly - በሳምንት</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly - በሁለት ሳምንት</SelectItem>
                      <SelectItem value="monthly">Monthly - በወር</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Total Pot:</strong> {(formData.contributionAmount * formData.memberLimit).toLocaleString()} ETB
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Each member contributes {formData.contributionAmount.toLocaleString()} ETB {formData.frequency}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Circle'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {equbCircles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Coins className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Equb Circles</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to create an Equb circle and start saving together!
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              Create Equb Circle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {equbCircles.map((circle) => {
            const progress = (circle._count.members / circle.memberLimit) * 100;
            const spotsLeft = circle.memberLimit - circle._count.members;
            const isFull = spotsLeft === 0;
            const totalPot = circle.contributionAmount * circle.memberLimit;

            return (
              <Card
                key={circle.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/equb/${circle.id}`)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={isFull ? 'default' : 'secondary'}>
                      {isFull ? 'Full' : 'Open'}
                    </Badge>
                    <Badge variant="outline">
                      Round {circle.currentRound}/{circle.totalRounds}
                    </Badge>
                  </div>
                  <CardTitle className="line-clamp-2">{circle.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {circle.description || 'No description'}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {/* Contribution Info */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-semibold">{circle.contributionAmount.toLocaleString()} ETB</p>
                          <p className="text-xs text-muted-foreground">Per round</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-semibold">{totalPot.toLocaleString()} ETB</p>
                          <p className="text-xs text-muted-foreground">Total pot</p>
                        </div>
                      </div>
                    </div>

                    {/* Frequency */}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{getFrequencyLabel(circle.frequency)}</span>
                    </div>

                    {/* Members Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {circle._count.members} / {circle.memberLimit} members
                        </span>
                        {!isFull && (
                          <span className="text-muted-foreground">
                            {spotsLeft} spots left
                          </span>
                        )}
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {/* Start Date */}
                    <div className="text-sm text-muted-foreground">
                      Starts: {new Date(circle.startDate).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    By {circle.creator.profile?.firstName || 'User'}
                  </div>
                  <Button size="sm">
                    {isFull ? 'View Circle' : 'Join Circle'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info Section */}
      <Card className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            What is Equb? - እኩብ ምንድነው?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm">
              <strong>Equb (እኩብ)</strong> is a traditional Ethiopian rotating savings and credit association (ROSCA). 
              It's a time-honored practice where groups of people pool their money together regularly.
            </p>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">How it works:</h4>
              <ol className="space-y-1 list-decimal list-inside text-sm">
                <li>A group of members agrees on a contribution amount and schedule</li>
                <li>Each member contributes the agreed amount every round</li>
                <li>Each round, one member receives the entire pot</li>
                <li>The cycle continues until everyone has received the pot once</li>
              </ol>
            </div>
            <div className="p-3 bg-white rounded-lg border">
              <p className="text-sm font-semibold mb-1">🇪🇹 Cultural Significance</p>
              <p className="text-xs text-muted-foreground">
                Equb has been a cornerstone of Ethiopian financial culture for generations, 
                building community trust and helping people save for major expenses.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
