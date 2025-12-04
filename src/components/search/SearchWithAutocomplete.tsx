'use client'

/**
 * SearchWithAutocomplete Component
 * 
 * A reusable search input component with autocomplete suggestions.
 * Uses the /api/search/suggestions endpoint for fetching suggestions
 * as the user types.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Search, Loader2, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface SearchWithAutocompleteProps {
  /** Current search value */
  value?: string
  /** Callback when value changes */
  onChange?: (value: string) => void
  /** Callback when user submits search (Enter key or button click) */
  onSearch?: (value: string) => void
  /** Callback when a suggestion is selected */
  onSuggestionSelect?: (suggestion: string) => void
  /** Placeholder text */
  placeholder?: string
  /** Custom class name */
  className?: string
  /** Input class name */
  inputClassName?: string
  /** Whether to show the search button */
  showButton?: boolean
  /** Button text */
  buttonText?: string
  /** Minimum characters before fetching suggestions */
  minChars?: number
  /** Debounce delay in milliseconds */
  debounceMs?: number
  /** Maximum number of suggestions to show */
  maxSuggestions?: number
  /** Auto focus on mount */
  autoFocus?: boolean
}

export function SearchWithAutocomplete({
  value: controlledValue,
  onChange,
  onSearch,
  onSuggestionSelect,
  placeholder = 'Search for products...',
  className,
  inputClassName,
  showButton = false,
  buttonText = 'Search',
  minChars = 2,
  debounceMs = 300,
  maxSuggestions = 8,
  autoFocus = false,
}: SearchWithAutocompleteProps) {
  const [inputValue, setInputValue] = useState(controlledValue || '')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Sync with controlled value
  useEffect(() => {
    if (controlledValue !== undefined) {
      setInputValue(controlledValue)
    }
  }, [controlledValue])

  // Fetch suggestions from API
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < minChars) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/search/suggestions?q=${encodeURIComponent(query)}&limit=${maxSuggestions}`
      )
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      } else {
        // Log non-OK responses for debugging
        console.warn(`Search suggestions API returned status ${response.status}`)
        setSuggestions([])
      }
    } catch (error) {
      console.error('Error fetching search suggestions:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [minChars, maxSuggestions])

  // Debounced fetch
  const debouncedFetch = useCallback((query: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(query)
    }, debounceMs)
  }, [fetchSuggestions, debounceMs])

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setSelectedIndex(-1)
    onChange?.(newValue)
    
    if (newValue.trim().length >= minChars) {
      setShowSuggestions(true)
      debouncedFetch(newValue)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSearch = () => {
    const searchValue = inputValue.trim()
    if (searchValue) {
      onSearch?.(searchValue)
    }
    setShowSuggestions(false)
    setSelectedIndex(-1)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
    onChange?.(suggestion)
    onSuggestionSelect?.(suggestion)
    onSearch?.(suggestion)
    setShowSuggestions(false)
    setSelectedIndex(-1)
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex])
        } else {
          handleSearch()
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleClear = () => {
    setInputValue('')
    setSuggestions([])
    setShowSuggestions(false)
    setSelectedIndex(-1)
    onChange?.('')
    inputRef.current?.focus()
  }

  const handleFocus = () => {
    if (inputValue.trim().length >= minChars && suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  // Memoize the regex for highlighting to avoid repeated compilation
  const highlightRegex = useMemo(() => {
    if (!inputValue.trim()) return null
    try {
      const escaped = inputValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      return new RegExp(`(${escaped})`, 'gi')
    } catch {
      return null
    }
  }, [inputValue])

  // Highlight matching text in suggestions
  const highlightMatch = useCallback((text: string) => {
    if (!highlightRegex) return text
    
    const parts = text.split(highlightRegex)
    return parts.map((part, i) =>
      part.toLowerCase() === inputValue.toLowerCase() ? (
        <span key={i} className="font-semibold text-primary">
          {part}
        </span>
      ) : (
        part
      )
    )
  }, [highlightRegex, inputValue])

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={cn(
            'pl-10 pr-10',
            showButton && 'rounded-r-none',
            inputClassName
          )}
          autoFocus={autoFocus}
          autoComplete="off"
          role="combobox"
          aria-expanded={showSuggestions && suggestions.length > 0}
          aria-controls="search-suggestions"
          aria-autocomplete="list"
        />
        {(isLoading || inputValue) && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : inputValue ? (
              <button
                type="button"
                onClick={handleClear}
                className="text-muted-foreground hover:text-foreground focus:outline-none"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        )}
        {showButton && (
          <Button
            onClick={handleSearch}
            className="rounded-l-none"
            aria-label="Search"
          >
            {buttonText}
          </Button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-[300px] overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => handleSuggestionClick(suggestion)}
              className={cn(
                'w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-accent hover:text-accent-foreground focus:outline-none focus:bg-accent focus:text-accent-foreground',
                index === selectedIndex && 'bg-accent text-accent-foreground'
              )}
            >
              <Search className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="truncate">
                {highlightMatch(suggestion)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
