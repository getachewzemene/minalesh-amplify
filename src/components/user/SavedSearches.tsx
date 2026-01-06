'use client'

import { useState, useEffect } from 'react'
import { Search, Trash2, ExternalLink, Bookmark, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface SavedSearch {
  id: string
  name: string
  query: string
  filters: Record<string, string | number | boolean>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export function SavedSearches() {
  const [searches, setSearches] = useState<SavedSearch[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchSavedSearches()
  }, [])

  const fetchSavedSearches = async () => {
    try {
      const response = await fetch('/api/saved-searches')
      if (response.ok) {
        const data = await response.json()
        setSearches(data.searches || [])
      }
    } catch (error) {
      console.error('Error fetching saved searches:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/saved-searches?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSearches(searches.filter(s => s.id !== id))
        toast.success('Search deleted successfully')
      } else {
        throw new Error('Failed to delete search')
      }
    } catch (error) {
      toast.error('Failed to delete search')
    }
  }

  const handleExecuteSearch = (search: SavedSearch) => {
    const params = new URLSearchParams()
    params.set('q', search.query)
    
    // Add filters to URL
    if (search.filters) {
      if (search.filters.category) params.set('category', String(search.filters.category))
      if (search.filters.minPrice) params.set('minPrice', String(search.filters.minPrice))
      if (search.filters.maxPrice) params.set('maxPrice', String(search.filters.maxPrice))
      if (search.filters.rating) params.set('rating', String(search.filters.rating))
    }
    
    router.push(`/products?${params.toString()}`)
  }

  const formatFilters = (filters: Record<string, string | number | boolean>) => {
    const parts: string[] = []
    if (filters.category) parts.push(`Category: ${filters.category}`)
    if (filters.minPrice || filters.maxPrice) {
      parts.push(`Price: ${filters.minPrice || 0} - ${filters.maxPrice || '∞'} ETB`)
    }
    if (filters.rating) parts.push(`Rating: ${filters.rating}+`)
    return parts
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bookmark className="h-5 w-5" />
          Saved Searches
        </CardTitle>
        <CardDescription>
          Quickly access your saved search queries
        </CardDescription>
      </CardHeader>
      <CardContent>
        {searches.length > 0 ? (
          <div className="space-y-3">
            {searches.map((search) => (
              <div
                key={search.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <p className="font-medium truncate">{search.name}</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 truncate">
                    "{search.query}"
                  </p>
                  {Object.keys(search.filters).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {formatFilters(search.filters).map((filter, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {filter}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExecuteSearch(search)}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Search
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(search.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No saved searches yet</p>
            <p className="text-sm mt-2">
              Save your searches from the products page to quickly access them here
            </p>
            <Button className="mt-4" onClick={() => router.push('/products')}>
              <Search className="h-4 w-4 mr-2" />
              Browse Products
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
