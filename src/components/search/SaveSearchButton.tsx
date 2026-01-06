'use client'

import { useState } from 'react'
import { Bookmark, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'

interface SaveSearchButtonProps {
  className?: string
}

export function SaveSearchButton({ className }: SaveSearchButtonProps) {
  const [open, setOpen] = useState(false)
  const [searchName, setSearchName] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const searchParams = useSearchParams()

  const query = searchParams.get('q') || ''
  const hasActiveSearch = query.length > 0 || Array.from(searchParams.entries()).length > 0

  const handleSaveSearch = async () => {
    if (!searchName.trim()) {
      toast.error('Please enter a name for this search')
      return
    }

    setLoading(true)
    try {
      // Build filters object from search params
      const filters: Record<string, string | number> = {}
      searchParams.forEach((value, key) => {
        if (key !== 'q' && key !== 'page') {
          filters[key] = value
        }
      })

      const response = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: searchName,
          query: query || '*',
          filters,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save search')
      }

      setSaved(true)
      setOpen(false)
      setSearchName('')
      toast.success('Search saved! Access it from your profile.')
      
      // Reset saved state after a few seconds
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save search')
    } finally {
      setLoading(false)
    }
  }

  if (!hasActiveSearch) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={className}
        >
          {saved ? (
            <>
              <Check className="h-4 w-4 mr-2 text-green-600" />
              Saved!
            </>
          ) : (
            <>
              <Bookmark className="h-4 w-4 mr-2" />
              Save Search
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            Save This Search
          </DialogTitle>
          <DialogDescription>
            Save your current search to quickly access it later from your profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current search info */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Current Search</p>
            <p className="font-medium">
              {query ? `"${query}"` : 'All Products'}
            </p>
            {Object.keys(Object.fromEntries(searchParams.entries())).filter(k => k !== 'q' && k !== 'page').length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                + filters applied
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="searchName">Search Name</Label>
            <Input
              id="searchName"
              placeholder="e.g., Affordable Electronics"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              Give this search a memorable name
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveSearch} disabled={loading}>
            {loading ? 'Saving...' : 'Save Search'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
