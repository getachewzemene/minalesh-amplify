'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bookmark,
  Trash2,
  Loader2,
  Bell,
  BellOff,
  ExternalLink,
  Edit2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { trackSavedSearchCreated } from '@/components/analytics';

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: Record<string, unknown>;
  notifyNew: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SaveSearchButtonProps {
  query: string;
  filters?: Record<string, unknown>;
  onSaved?: () => void;
}

// Button to save a search from search results
export function SaveSearchButton({
  query,
  filters = {},
  onSaved,
}: SaveSearchButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [notifyNew, setNotifyNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a name for this search');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/user/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          query,
          filters,
          notifyNew,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Search saved successfully');
        trackSavedSearchCreated(query);
        setIsOpen(false);
        setName('');
        setNotifyNew(false);
        onSaved?.();
      } else {
        toast.error(data.error || 'Failed to save search');
      }
    } catch (error) {
      console.error('Error saving search:', error);
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Bookmark className="h-4 w-4 mr-2" />
          Save Search
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            Save This Search
          </DialogTitle>
          <DialogDescription>
            Save this search to quickly access it later.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground">Search Query</Label>
            <p className="font-medium mt-1">&quot;{query}&quot;</p>
            {Object.keys(filters).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {Object.entries(filters).map(([key, value]) => (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {key}: {String(value)}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="searchName">Name this search</Label>
            <Input
              id="searchName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Ethiopian Coffee, Cheap Electronics"
              maxLength={100}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex-1">
              <Label htmlFor="notify" className="font-medium">
                Notify me of new products
              </Label>
              <p className="text-sm text-muted-foreground">
                Get email updates when new products match
              </p>
            </div>
            <Switch
              id="notify"
              checked={notifyNew}
              onCheckedChange={setNotifyNew}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !name.trim()}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Search
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Component to list and manage saved searches
export function SavedSearchesList() {
  const router = useRouter();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);
  const [editName, setEditName] = useState('');
  const [editNotify, setEditNotify] = useState(false);

  useEffect(() => {
    fetchSearches();
  }, []);

  const fetchSearches = async () => {
    try {
      const response = await fetch('/api/user/saved-searches');
      if (response.ok) {
        const data = await response.json();
        setSearches(data.savedSearches || []);
      }
    } catch (error) {
      console.error('Error fetching searches:', error);
      toast.error('Failed to load saved searches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunSearch = (search: SavedSearch) => {
    const params = new URLSearchParams();
    params.set('q', search.query);
    
    // Add filters to URL params
    if (search.filters && typeof search.filters === 'object') {
      Object.entries(search.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.set(key, String(value));
        }
      });
    }

    router.push(`/products?${params.toString()}`);
  };

  const handleToggleNotify = async (searchId: string, currentNotify: boolean) => {
    setActionLoading(searchId);
    try {
      const response = await fetch('/api/user/saved-searches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: searchId,
          notifyNew: !currentNotify,
        }),
      });

      if (response.ok) {
        setSearches((prev) =>
          prev.map((s) =>
            s.id === searchId ? { ...s, notifyNew: !currentNotify } : s
          )
        );
        toast.success(
          currentNotify ? 'Notifications disabled' : 'Notifications enabled'
        );
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update');
      }
    } catch (error) {
      console.error('Error toggling notify:', error);
      toast.error('An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (searchId: string) => {
    setActionLoading(searchId);
    try {
      const response = await fetch(`/api/user/saved-searches?id=${searchId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSearches((prev) => prev.filter((s) => s.id !== searchId));
        toast.success('Search deleted');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting search:', error);
      toast.error('An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const openEditDialog = (search: SavedSearch) => {
    setEditingSearch(search);
    setEditName(search.name);
    setEditNotify(search.notifyNew);
  };

  const handleEdit = async () => {
    if (!editingSearch || !editName.trim()) return;

    setActionLoading(editingSearch.id);
    try {
      const response = await fetch('/api/user/saved-searches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSearch.id,
          name: editName.trim(),
          notifyNew: editNotify,
        }),
      });

      if (response.ok) {
        setSearches((prev) =>
          prev.map((s) =>
            s.id === editingSearch.id
              ? { ...s, name: editName.trim(), notifyNew: editNotify }
              : s
          )
        );
        toast.success('Search updated');
        setEditingSearch(null);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update');
      }
    } catch (error) {
      console.error('Error updating search:', error);
      toast.error('An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Saved Searches
          </CardTitle>
          <CardDescription>
            Quick access to your favorite search queries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {searches.length > 0 ? (
            <div className="space-y-3">
              {searches.map((search) => (
                <div
                  key={search.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{search.name}</p>
                      {search.notifyNew && (
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          <Bell className="h-3 w-3 mr-1" />
                          Notify
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      &quot;{search.query}&quot;
                    </p>
                    {search.filters && Object.keys(search.filters).length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {Object.entries(search.filters).map(([key, value]) => (
                          <Badge key={key} variant="secondary" className="text-xs">
                            {key}: {String(value)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleRunSearch(search)}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Run
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditDialog(search)}
                      disabled={actionLoading === search.id}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleToggleNotify(search.id, search.notifyNew)}
                      disabled={actionLoading === search.id}
                    >
                      {actionLoading === search.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : search.notifyNew ? (
                        <BellOff className="h-4 w-4" />
                      ) : (
                        <Bell className="h-4 w-4" />
                      )}
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          disabled={actionLoading === search.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Saved Search</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &quot;{search.name}&quot;?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(search.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-2">No saved searches yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Search for products and save your searches for quick access
              </p>
              <Button asChild>
                <a href="/products">Browse Products</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={editingSearch !== null}
        onOpenChange={(open) => !open && setEditingSearch(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Saved Search</DialogTitle>
            <DialogDescription>
              Update the name or notification settings for this search.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Name</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex-1">
                <Label htmlFor="editNotify" className="font-medium">
                  Notify me of new products
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get email updates when new products match
                </p>
              </div>
              <Switch
                id="editNotify"
                checked={editNotify}
                onCheckedChange={setEditNotify}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSearch(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!editName.trim() || actionLoading === editingSearch?.id}
            >
              {actionLoading === editingSearch?.id && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default SavedSearchesList;
