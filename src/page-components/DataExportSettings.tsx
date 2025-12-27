'use client'

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Container } from "@/components/ui/container"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { 
  Download, FileText, Clock, CheckCircle2, XCircle, 
  AlertCircle, ArrowLeft, RefreshCw, Calendar, FileJson, FileSpreadsheet
} from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface DataExportRequest {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired'
  format: string
  downloadUrl?: string
  fileSize?: number
  expiresAt: string
  completedAt?: string
  failedAt?: string
  failureReason?: string
  createdAt: string
}

const formatFileSize = (bytes?: number) => {
  if (!bytes) return 'N/A'
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(2)} KB`
  return `${(kb / 1024).toFixed(2)} MB`
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />
    case 'pending':
      return <Clock className="h-5 w-5 text-yellow-500" />
    case 'processing':
      return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
    case 'failed':
      return <XCircle className="h-5 w-5 text-red-500" />
    case 'expired':
      return <AlertCircle className="h-5 w-5 text-gray-500" />
    default:
      return <Clock className="h-5 w-5 text-gray-500" />
  }
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, any> = {
    completed: 'default',
    pending: 'secondary',
    processing: 'secondary',
    failed: 'destructive',
    expired: 'outline'
  }
  return (
    <Badge variant={variants[status] || 'outline'}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

export default function DataExportSettings() {
  const { user } = useAuth()
  const router = useRouter()
  const [exportRequests, setExportRequests] = useState<DataExportRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<string>('json')

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    fetchExportRequests()
  }, [user, router])

  const fetchExportRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/data-export')
      if (response.ok) {
        const data = await response.json()
        setExportRequests(data.requests || [])
      } else {
        toast.error('Failed to fetch export requests')
      }
    } catch (error) {
      console.error('Error fetching export requests:', error)
      toast.error('An error occurred while fetching export requests')
    } finally {
      setLoading(false)
    }
  }

  const createExportRequest = async () => {
    try {
      setCreating(true)
      const response = await fetch('/api/user/data-export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ format: selectedFormat })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Export request created successfully! You will be notified when your data is ready.')
        fetchExportRequests()
      } else if (response.status === 429) {
        toast.error(data.error || 'You already have a pending export request')
      } else {
        toast.error(data.error || 'Failed to create export request')
      }
    } catch (error) {
      console.error('Error creating export request:', error)
      toast.error('An error occurred while creating export request')
    } finally {
      setCreating(false)
    }
  }

  const handleDownload = async (requestId: string) => {
    try {
      const response = await fetch(`/api/user/data-export/download?requestId=${requestId}`)
      const data = await response.json()

      if (response.ok && data.downloadUrl) {
        window.open(data.downloadUrl, '_blank')
        toast.success('Download started')
      } else {
        toast.error(data.error || 'Failed to download export')
      }
    } catch (error) {
      console.error('Error downloading export:', error)
      toast.error('An error occurred while downloading')
    }
  }

  const hasPendingRequest = exportRequests.some(
    req => req.status === 'pending' || req.status === 'processing'
  )

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-8">
        <Container>
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/profile">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Data Export</h1>
                <p className="text-muted-foreground mt-1">
                  Download a copy of your personal data
                </p>
              </div>
            </div>

            {/* Info Alert */}
            <Alert className="mb-6">
              <FileText className="h-4 w-4" />
              <AlertTitle>About Data Export</AlertTitle>
              <AlertDescription>
                You can request a copy of your data at any time. We'll prepare a file containing your profile information, 
                orders, reviews, and other account data. The export will be available for 7 days after completion.
              </AlertDescription>
            </Alert>

            {/* Create New Export Request */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Request New Export
                </CardTitle>
                <CardDescription>
                  Choose a format and create a new data export request
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-semibold mb-4 block">Select Format</Label>
                  <RadioGroup value={selectedFormat} onValueChange={setSelectedFormat}>
                    <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="json" id="json" className="mt-1" />
                      <Label htmlFor="json" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <FileJson className="h-5 w-5" />
                          <span className="font-semibold">JSON Format</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Machine-readable format, ideal for developers and data analysis
                        </p>
                      </Label>
                    </div>
                    <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="csv" id="csv" className="mt-1" />
                      <Label htmlFor="csv" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <FileSpreadsheet className="h-5 w-5" />
                          <span className="font-semibold">CSV Format</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Spreadsheet format, easy to view in Excel or Google Sheets
                        </p>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {hasPendingRequest && (
                      <span className="text-yellow-600 dark:text-yellow-500">
                        You have a pending export request
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={createExportRequest}
                    disabled={creating || hasPendingRequest}
                    className="min-w-[160px]"
                  >
                    {creating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Request Export
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Export History */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Export History
                    </CardTitle>
                    <CardDescription>
                      View and download your previous export requests
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchExportRequests}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">Loading export requests...</p>
                  </div>
                ) : exportRequests.length > 0 ? (
                  <div className="space-y-4">
                    {exportRequests.map((request) => {
                      const isExpired = request.status === 'expired' || 
                        (request.status === 'completed' && new Date() > new Date(request.expiresAt))
                      const daysUntilExpiry = request.status === 'completed' && !isExpired
                        ? Math.ceil((new Date(request.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                        : null

                      return (
                        <div
                          key={request.id}
                          className="p-6 border rounded-lg hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-3">
                              {getStatusIcon(request.status)}
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold">
                                    {request.format.toUpperCase()} Export
                                  </h3>
                                  {getStatusBadge(request.status)}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Requested on {formatDate(request.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Status Details */}
                          <div className="space-y-2 mb-4">
                            {request.status === 'completed' && (
                              <>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  <span>Completed on {formatDate(request.completedAt!)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <FileText className="h-4 w-4" />
                                  <span>File size: {formatFileSize(request.fileSize)}</span>
                                </div>
                                {!isExpired && daysUntilExpiry !== null && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4" />
                                    <span className={daysUntilExpiry <= 2 ? 'text-orange-600 dark:text-orange-500' : ''}>
                                      Expires in {daysUntilExpiry} {daysUntilExpiry === 1 ? 'day' : 'days'}
                                    </span>
                                  </div>
                                )}
                              </>
                            )}
                            {request.status === 'pending' && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>Your request is queued and will be processed shortly</span>
                              </div>
                            )}
                            {request.status === 'processing' && (
                              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-500">
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                <span>Processing your data export...</span>
                              </div>
                            )}
                            {request.status === 'failed' && (
                              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-500">
                                <XCircle className="h-4 w-4" />
                                <span>Failed: {request.failureReason || 'Unknown error'}</span>
                              </div>
                            )}
                            {isExpired && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <AlertCircle className="h-4 w-4" />
                                <span>Download link expired on {formatDate(request.expiresAt)}</span>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          {request.status === 'completed' && !isExpired && (
                            <Button
                              onClick={() => handleDownload(request.id)}
                              className="w-full sm:w-auto"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download Export
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground mb-2">No export requests yet</p>
                    <p className="text-sm text-muted-foreground">
                      Create your first data export request above
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">What's included in the export?</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Profile information (name, email, phone, address)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Order history and details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Product reviews and ratings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Wishlist items</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Notification preferences</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Loyalty points and transaction history</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  )
}
