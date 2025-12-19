'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import AdminDashboard from "@/page-components/AdminDashboard"

export default function AdminDashboardPage() {
	const router = useRouter()
	const { loading, profile, user } = useAuth()

	useEffect(() => {
		if (!loading) {
			if (!user) {
				router.replace('/auth/login')
			} else if (!profile?.isAdmin) {
				router.replace('/')
			}
		}
	}, [loading, profile, user, router])

	if (loading || !user || !profile?.isAdmin) {
		return null
	}

	return <AdminDashboard />
}
