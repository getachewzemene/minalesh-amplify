'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import AdminReportsDashboard from "@/page-components/AdminReportsDashboard"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function AdminReportsPage() {
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

	return (
		<div className="min-h-screen bg-background">
			<Navbar />
			<main className="mobile-container">
				<AdminReportsDashboard />
			</main>
			<Footer />
		</div>
	)
}
