'use client'

import { useState, useEffect } from "react"
import { Truck, Calendar, MapPin } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addDays, format } from "date-fns"

interface DeliveryEstimatorProps {
  productId: string
  vendorCity?: string
  inStock: boolean
}

const ETHIOPIAN_REGIONS = [
  { name: "Addis Ababa", days: { min: 1, max: 3 } },
  { name: "Dire Dawa", days: { min: 2, max: 4 } },
  { name: "Bahir Dar", days: { min: 3, max: 5 } },
  { name: "Gondar", days: { min: 3, max: 5 } },
  { name: "Mekelle", days: { min: 3, max: 6 } },
  { name: "Hawassa", days: { min: 2, max: 4 } },
  { name: "Adama", days: { min: 1, max: 3 } },
  { name: "Jimma", days: { min: 3, max: 5 } },
  { name: "Dessie", days: { min: 4, max: 6 } },
  { name: "Other Regions", days: { min: 5, max: 10 } }
]

export function DeliveryEstimator({ productId, vendorCity, inStock }: DeliveryEstimatorProps) {
  const [selectedRegion, setSelectedRegion] = useState("")
  const [deliveryDates, setDeliveryDates] = useState<{ earliest: Date, latest: Date } | null>(null)

  useEffect(() => {
    if (selectedRegion) {
      const region = ETHIOPIAN_REGIONS.find(r => r.name === selectedRegion)
      if (region) {
        const today = new Date()
        // If out of stock, add extra processing time
        const processingDays = inStock ? 1 : 7
        
        setDeliveryDates({
          earliest: addDays(today, region.days.min + processingDays),
          latest: addDays(today, region.days.max + processingDays)
        })
      }
    }
  }, [selectedRegion, inStock])

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
          <Truck className="w-5 h-5" />
          <h3 className="font-semibold">Delivery Estimate</h3>
        </div>

        {/* Region Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Select your region:
          </label>
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="bg-white dark:bg-gray-900">
              <SelectValue placeholder="Choose region..." />
            </SelectTrigger>
            <SelectContent>
              {ETHIOPIAN_REGIONS.map(region => (
                <SelectItem key={region.name} value={region.name}>
                  {region.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Delivery Date Display */}
        {deliveryDates && (
          <div className="bg-white dark:bg-gray-900 rounded-lg p-3 space-y-2">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Estimated Delivery
                </p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {format(deliveryDates.earliest, 'MMM dd')} - {format(deliveryDates.latest, 'MMM dd, yyyy')}
                </p>
                {!inStock && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    * Product currently out of stock. Estimate includes restocking time.
                  </p>
                )}
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Delivery time varies by region (1-10 business days)</p>
              <p>• Express delivery available at checkout</p>
              {vendorCity && (
                <p>• Ships from: {vendorCity}</p>
              )}
            </div>
          </div>
        )}

        {!selectedRegion && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Select your region to see estimated delivery dates
          </p>
        )}
      </CardContent>
    </Card>
  )
}
