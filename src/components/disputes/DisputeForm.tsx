"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Upload, X, Video, Image as ImageIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DisputeFormProps {
  orderId: string;
  orderNumber: string;
  orderItems?: Array<{ id: string; name: string; quantity: number }>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const disputeTypes = [
  { value: 'not_received', label: 'Order Not Received' },
  { value: 'not_as_described', label: 'Item Not As Described' },
  { value: 'damaged', label: 'Item Damaged' },
  { value: 'wrong_item', label: 'Wrong Item Received' },
  { value: 'refund_issue', label: 'Refund Issue' },
  { value: 'other', label: 'Other' },
];

export function DisputeForm({ orderId, orderNumber, orderItems = [], onSuccess, onCancel }: DisputeFormProps) {
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [videoEvidenceUrls, setVideoEvidenceUrls] = useState<string[]>([]);
  const [selectedOrderItems, setSelectedOrderItems] = useState<string[]>([]);
  const [newEvidenceUrl, setNewEvidenceUrl] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAddEvidence = () => {
    if (newEvidenceUrl.trim()) {
      setEvidenceUrls([...evidenceUrls, newEvidenceUrl.trim()]);
      setNewEvidenceUrl('');
    }
  };

  const handleAddVideoEvidence = () => {
    if (newVideoUrl.trim()) {
      setVideoEvidenceUrls([...videoEvidenceUrls, newVideoUrl.trim()]);
      setNewVideoUrl('');
    }
  };

  const handleRemoveEvidence = (index: number) => {
    setEvidenceUrls(evidenceUrls.filter((_, i) => i !== index));
  };

  const handleRemoveVideoEvidence = (index: number) => {
    setVideoEvidenceUrls(videoEvidenceUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!type || !description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/disputes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          orderItemIds: selectedOrderItems.length > 0 ? selectedOrderItems : undefined,
          type,
          description: description.trim(),
          evidenceUrls,
          videoEvidenceUrls,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create dispute');
      }

      const data = await response.json();
      toast({
        title: 'Dispute Filed',
        description: data.message || 'Your dispute has been submitted successfully',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to file dispute',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>File a Dispute</CardTitle>
        <CardDescription>
          Order #{orderNumber}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            Disputes must be filed within 30 days of delivery. The vendor will have 3 days to respond.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Dispute Type *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select dispute type" />
              </SelectTrigger>
              <SelectContent>
                {disputeTypes.map((dt) => (
                  <SelectItem key={dt.value} value={dt.value}>
                    {dt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Multi-item selection */}
          {orderItems && orderItems.length > 1 && (
            <div className="space-y-2">
              <Label>Affected Items (Optional)</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Select specific items from your order that are affected by this dispute. Leave unchecked to dispute the entire order.
              </p>
              <div className="space-y-2 border rounded-lg p-4">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={`item-${item.id}`}
                      checked={selectedOrderItems.includes(item.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedOrderItems([...selectedOrderItems, item.id])
                        } else {
                          setSelectedOrderItems(selectedOrderItems.filter(id => id !== item.id))
                        }
                      }}
                      className="mt-1"
                    />
                    <Label htmlFor={`item-${item.id}`} className="flex-1 cursor-pointer">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">(Qty: {item.quantity})</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Please provide detailed information about your dispute..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={1000}
              required
            />
            <p className="text-sm text-muted-foreground">
              {description.length}/1000 characters
            </p>
          </div>

          {/* Evidence Tabs */}
          <div className="space-y-2">
            <Label>Evidence (Optional)</Label>
            <Tabs defaultValue="images" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="images" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Images
                </TabsTrigger>
                <TabsTrigger value="videos" className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Videos
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="images" className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={newEvidenceUrl}
                    onChange={(e) => setNewEvidenceUrl(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEvidence();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddEvidence}
                    disabled={!newEvidenceUrl.trim()}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                {evidenceUrls.length > 0 && (
                  <div className="space-y-2">
                    {evidenceUrls.map((url, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm truncate flex-1">{url}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveEvidence(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="videos" className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="https://youtube.com/watch?v=... or video URL"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddVideoEvidence();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddVideoEvidence}
                    disabled={!newVideoUrl.trim()}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                {videoEvidenceUrls.length > 0 && (
                  <div className="space-y-2">
                    {videoEvidenceUrls.map((url, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Video className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm truncate">{url}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveVideoEvidence(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex gap-2 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Dispute'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

