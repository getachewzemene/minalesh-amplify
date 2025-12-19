'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import Dashboard from "@/page-components/Dashboard"

export default function VendorDashboardPage() {
	const router = useRouter()
	const { loading, profile, user } = useAuth()

	useEffect(() => {
		if (!loading) {
			if (!user) {
				router.replace('/auth/login')
			} else if (!profile?.isVendor) {
				router.replace('/')
			}
		}
	}, [loading, profile, user, router])

	if (loading || !user || !profile?.isVendor) {
		return null
	}

	return <Dashboard />
}
