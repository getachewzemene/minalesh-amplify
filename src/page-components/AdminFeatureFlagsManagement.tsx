'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { 
  Flag, Plus, Trash2, Loader2, Users, Percent, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
} from '@/components/ui/alert-dialog'

interface FeatureFlag {
  id: string
  key: string
  name: string
  description?: string
  isEnabled: boolean
  percentage: number
  targetUsers: string[]
  targetRoles: string[]
  createdAt: string
  updatedAt: string
}

export default function AdminFeatureFlagsManagement() {
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newFlag, setNewFlag] = useState({
    key: '',
    name: '',
    description: '',
    isEnabled: false,
    percentage: 100,
  })

  useEffect(() => {
    fetchFlags()
  }, [])

  const fetchFlags = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/feature-flags', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setFlags(data.flags || [])
      }
    } catch (error) {
      console.error('Error fetching feature flags:', error)
      toast.error('Failed to load feature flags')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newFlag.key || !newFlag.name) {
      toast.error('Key and name are required')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/feature-flags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'create', ...newFlag }),
      })
      if (response.ok) {
        toast.success('Feature flag created')
        setCreateDialogOpen(false)
        setNewFlag({ key: '', name: '', description: '', isEnabled: false, percentage: 100 })
        fetchFlags()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to create flag')
      }
    } catch (error) {
      toast.error('Failed to create feature flag')
    }
  }

  const handleToggle = async (key: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/feature-flags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'toggle', key }),
      })
      if (response.ok) {
        fetchFlags()
      } else {
        toast.error('Failed to toggle flag')
      }
    } catch (error) {
      toast.error('Failed to toggle feature flag')
    }
  }

  const handleSetPercentage = async (key: string, percentage: number) => {
    try {
      const token = localStorage.getItem('token')
      await fetch('/api/admin/feature-flags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'set-percentage', key, percentage }),
      })
      fetchFlags()
    } catch (error) {
      console.error('Failed to set percentage')
    }
  }

  const handleDelete = async (key: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/feature-flags?key=${key}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        toast.success('Feature flag deleted')
        fetchFlags()
      } else {
        toast.error('Failed to delete flag')
      }
    } catch (error) {
      toast.error('Failed to delete feature flag')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feature Flags</h1>
          <p className="text-muted-foreground">
            Control feature rollouts and A/B testing
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchFlags}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Flag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Feature Flag</DialogTitle>
                <DialogDescription>
                  Add a new feature flag for controlled rollout
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Key (unique identifier)</Label>
                  <Input
                    placeholder="new_checkout_flow"
                    value={newFlag.key}
                    onChange={(e) => setNewFlag({ ...newFlag, key: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    placeholder="New Checkout Flow"
                    value={newFlag.name}
                    onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Enable the redesigned checkout experience"
                    value={newFlag.description}
                    onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Enabled by default</Label>
                  <Switch
                    checked={newFlag.isEnabled}
                    onCheckedChange={(checked) => setNewFlag({ ...newFlag, isEnabled: checked })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rollout percentage: {newFlag.percentage}%</Label>
                  <Slider
                    value={[newFlag.percentage]}
                    onValueChange={([value]) => setNewFlag({ ...newFlag, percentage: value })}
                    max={100}
                    step={1}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Create Flag</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {flags.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Flag className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Feature Flags</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Create feature flags to control feature rollouts and enable A/B testing.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {flags.map((flag) => (
            <Card key={flag.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={flag.isEnabled}
                      onCheckedChange={() => handleToggle(flag.key)}
                    />
                    <div>
                      <CardTitle className="text-lg">{flag.name}</CardTitle>
                      <code className="text-xs text-muted-foreground">{flag.key}</code>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={flag.isEnabled ? 'default' : 'secondary'}>
                      {flag.isEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Feature Flag?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the &quot;{flag.name}&quot; feature flag.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(flag.key)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                {flag.description && (
                  <CardDescription>{flag.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-6">
                  <div className="space-y-2 flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Percent className="h-4 w-4" />
                      Rollout: {flag.percentage}%
                    </div>
                    <Slider
                      value={[flag.percentage]}
                      onValueChange={([value]) => handleSetPercentage(flag.key, value)}
                      max={100}
                      step={1}
                      disabled={!flag.isEnabled}
                    />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {flag.targetUsers.length} targeted users
                    </div>
                    <div>
                      {flag.targetRoles.length > 0 ? (
                        <span>Roles: {flag.targetRoles.join(', ')}</span>
                      ) : (
                        <span>All roles</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
