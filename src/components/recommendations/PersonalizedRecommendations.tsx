"use client"

import { useState, useEffect } from "react"
import { ProductSection } from "@/components/product-section"
import { useAuth } from "@/context/auth-context"
import { Sparkles } from "lucide-react"

export function PersonalizedRecommendations() {
  const { user } = useAuth()

  // Don't render anything if user is not logged in
  if (!user) {
    return null
  }

  return (
    <div className="relative">
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg">
          <Sparkles className="h-4 w-4" />
          AI-Powered Recommendations
        </div>
      </div>
      <ProductSection
        title="Recommended for You"
        description="Personalized product recommendations based on your browsing and purchase history"
        endpoint="/api/recommendations/personalized"
        limit={8}
        showViewAll={false}
      />
    </div>
  )
}
