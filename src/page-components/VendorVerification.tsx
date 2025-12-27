'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Eye,
  RefreshCw,
  ShieldCheck
} from "lucide-react"
import { LoadingState } from "@/components/ui/loading-state"

interface VerificationData {
  id: string
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended'
  rejectionReason?: string | null
  reviewedAt?: string | null
  submittedAt?: string
  updatedAt?: string
  tradeLicenseNumber?: string
  tinNumber?: string
}

interface DocumentUpload {
  file: File | null
  preview: string | null
  uploaded: boolean
  url?: string
}

export default function VendorVerification() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [verification, setVerification] = useState<VerificationData | null>(null)
  const [showResubmitForm, setShowResubmitForm] = useState(false)
  const [tradeLicenseNumber, setTradeLicenseNumber] = useState("")
  const [tinNumber, setTinNumber] = useState("")
  
  const [documents, setDocuments] = useState({
    tradeLicense: { file: null, preview: null, uploaded: false, url: undefined } as DocumentUpload,
    tinCertificate: { file: null, preview: null, uploaded: false, url: undefined } as DocumentUpload,
    businessReg: { file: null, preview: null, uploaded: false, url: undefined } as DocumentUpload,
    ownerId: { file: null, preview: null, uploaded: false, url: undefined } as DocumentUpload,
  })

  useEffect(() => {
    fetchVerificationStatus()
  }, [])

  // Cleanup blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      Object.values(documents).forEach(doc => {
        if (doc.preview) {
          URL.revokeObjectURL(doc.preview)
        }
      })
    }
  }, [documents])

  const fetchVerificationStatus = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/vendors/verification', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setVerification(data.verification)
        setTradeLicenseNumber(data.verification.tradeLicenseNumber || "")
        setTinNumber(data.verification.tinNumber || "")
      } else if (response.status === 404) {
        // No verification record yet - this is ok
        setVerification(null)
      }
    } catch (error) {
      console.error('Error fetching verification status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (documentType: keyof typeof documents, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload JPEG, PNG, WebP, or PDF files only.",
        variant: "destructive",
      })
      return
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 5MB.",
        variant: "destructive",
      })
      return
    }

    // Revoke previous blob URL to prevent memory leak
    const prevDoc = documents[documentType]
    if (prevDoc.preview) {
      URL.revokeObjectURL(prevDoc.preview)
    }

    // Create preview for images
    let preview = null
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file)
    }

    setDocuments(prev => ({
      ...prev,
      [documentType]: {
        file,
        preview,
        uploaded: false,
        url: undefined,
      }
    }))

    // Auto-upload the file
    await uploadDocument(documentType, file)
  }

  const uploadDocument = async (documentType: keyof typeof documents, file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setDocuments(prev => ({
          ...prev,
          [documentType]: {
            ...prev[documentType],
            uploaded: true,
            url: data.url,
          }
        }))
        toast({
          title: "File Uploaded",
          description: `${file.name} uploaded successfully.`,
        })
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      })
      setDocuments(prev => ({
        ...prev,
        [documentType]: {
          file: null,
          preview: null,
          uploaded: false,
          url: undefined,
        }
      }))
    }
  }

  const handleSubmit = async () => {
    // Validate required fields
    if (!documents.tradeLicense.uploaded || !documents.tinCertificate.uploaded) {
      toast({
        title: "Missing Documents",
        description: "Please upload Trade License and TIN Certificate (required).",
        variant: "destructive",
      })
      return
    }

    if (!tradeLicenseNumber || !tinNumber) {
      toast({
        title: "Missing Information",
        description: "Please provide Trade License Number and TIN Number.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/vendors/verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          tradeLicenseUrl: documents.tradeLicense.url,
          tradeLicenseNumber,
          tinCertificateUrl: documents.tinCertificate.url,
          tinNumber,
          businessRegUrl: documents.businessReg.url,
          ownerIdUrl: documents.ownerId.url,
        }),
      })

      if (response.ok) {
        toast({
          title: "Verification Submitted",
          description: "Your verification documents have been submitted successfully. Our team will review them shortly.",
        })
        // Refresh verification status
        await fetchVerificationStatus()
        // Reset form
        setDocuments({
          tradeLicense: { file: null, preview: null, uploaded: false, url: undefined },
          tinCertificate: { file: null, preview: null, uploaded: false, url: undefined },
          businessReg: { file: null, preview: null, uploaded: false, url: undefined },
          ownerId: { file: null, preview: null, uploaded: false, url: undefined },
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit verification')
      }
    } catch (error) {
      console.error('Error submitting verification:', error)
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit verification. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      case 'suspended':
        return <Badge variant="outline" className="border-orange-500 text-orange-500"><AlertCircle className="h-3 w-3 mr-1" />Suspended</Badge>
      case 'under_review':
        return <Badge variant="secondary"><Eye className="h-3 w-3 mr-1" />Under Review</Badge>
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
    }
  }

  const canSubmit = () => {
    // Can submit if no verification exists OR if status is rejected OR showing resubmit form
    return !verification || verification.status === 'rejected' || showResubmitForm
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return <LoadingState message="Loading verification status..." />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Vendor Verification</h2>
        <p className="text-muted-foreground">
          Complete your vendor verification to start selling on Minalesh
        </p>
      </div>

      {/* Verification Status Card */}
      {verification && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Verification Status</CardTitle>
                <CardDescription>Current status of your vendor verification</CardDescription>
              </div>
              {getStatusBadge(verification.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Trade License Number</p>
                <p className="text-sm">{verification.tradeLicenseNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">TIN Number</p>
                <p className="text-sm">{verification.tinNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Submitted At</p>
                <p className="text-sm">{formatDate(verification.submittedAt)}</p>
              </div>
              {verification.reviewedAt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Reviewed At</p>
                  <p className="text-sm">{formatDate(verification.reviewedAt)}</p>
                </div>
              )}
              {verification.rejectionReason && (
                <div className="col-span-full">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Rejection Reason</p>
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-700">{verification.rejectionReason}</p>
                  </div>
                </div>
              )}
            </div>

            {verification.status === 'approved' && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center gap-2 text-green-700">
                  <ShieldCheck className="h-5 w-5" />
                  <p className="font-medium">Your vendor account is verified!</p>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  You can now start adding products to the marketplace.
                </p>
              </div>
            )}

            {verification.status === 'rejected' && (
              <div className="mt-4">
                <Button 
                  onClick={() => setShowResubmitForm(true)} 
                  variant="outline"
                  className="w-full md:w-auto"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Resubmit Verification
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Document Upload Form */}
      {canSubmit() && (
        <Card>
          <CardHeader>
            <CardTitle>
              {verification?.status === 'rejected' ? 'Resubmit Verification Documents' : 'Upload Verification Documents'}
            </CardTitle>
            <CardDescription>
              Please upload the following documents to verify your vendor account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Trade License Number */}
            <div className="space-y-2">
              <Label htmlFor="tradeLicenseNumber">Trade License Number *</Label>
              <Input
                id="tradeLicenseNumber"
                value={tradeLicenseNumber}
                onChange={(e) => setTradeLicenseNumber(e.target.value)}
                placeholder="Enter your trade license number"
              />
            </div>

            {/* Trade License Document */}
            <div className="space-y-2">
              <Label htmlFor="tradeLicense">Trade License Document *</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                {documents.tradeLicense.preview ? (
                  <div className="space-y-2">
                    <img 
                      src={documents.tradeLicense.preview} 
                      alt="Trade License Preview" 
                      className="mx-auto max-h-40 rounded"
                    />
                    <p className="text-sm text-muted-foreground">
                      {documents.tradeLicense.file?.name}
                    </p>
                    {documents.tradeLicense.uploaded && (
                      <Badge className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Uploaded
                      </Badge>
                    )}
                  </div>
                ) : documents.tradeLicense.file?.type === 'application/pdf' ? (
                  <div className="space-y-2">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {documents.tradeLicense.file?.name}
                    </p>
                    {documents.tradeLicense.uploaded && (
                      <Badge className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Uploaded
                      </Badge>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, WEBP or PDF (max 5MB)
                    </p>
                  </div>
                )}
                <Input
                  id="tradeLicense"
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                  onChange={(e) => handleFileSelect('tradeLicense', e)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2"
                  onClick={() => document.getElementById('tradeLicense')?.click()}
                >
                  Choose File
                </Button>
              </div>
            </div>

            {/* TIN Number */}
            <div className="space-y-2">
              <Label htmlFor="tinNumber">TIN Number *</Label>
              <Input
                id="tinNumber"
                value={tinNumber}
                onChange={(e) => setTinNumber(e.target.value)}
                placeholder="Enter your TIN number"
              />
            </div>

            {/* TIN Certificate */}
            <div className="space-y-2">
              <Label htmlFor="tinCertificate">TIN Certificate *</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                {documents.tinCertificate.preview ? (
                  <div className="space-y-2">
                    <img 
                      src={documents.tinCertificate.preview} 
                      alt="TIN Certificate Preview" 
                      className="mx-auto max-h-40 rounded"
                    />
                    <p className="text-sm text-muted-foreground">
                      {documents.tinCertificate.file?.name}
                    </p>
                    {documents.tinCertificate.uploaded && (
                      <Badge className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Uploaded
                      </Badge>
                    )}
                  </div>
                ) : documents.tinCertificate.file?.type === 'application/pdf' ? (
                  <div className="space-y-2">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {documents.tinCertificate.file?.name}
                    </p>
                    {documents.tinCertificate.uploaded && (
                      <Badge className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Uploaded
                      </Badge>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, WEBP or PDF (max 5MB)
                    </p>
                  </div>
                )}
                <Input
                  id="tinCertificate"
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                  onChange={(e) => handleFileSelect('tinCertificate', e)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2"
                  onClick={() => document.getElementById('tinCertificate')?.click()}
                >
                  Choose File
                </Button>
              </div>
            </div>

            {/* Business Registration (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="businessReg">Business Registration Certificate (Optional)</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                {documents.businessReg.preview ? (
                  <div className="space-y-2">
                    <img 
                      src={documents.businessReg.preview} 
                      alt="Business Registration Preview" 
                      className="mx-auto max-h-40 rounded"
                    />
                    <p className="text-sm text-muted-foreground">
                      {documents.businessReg.file?.name}
                    </p>
                    {documents.businessReg.uploaded && (
                      <Badge className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Uploaded
                      </Badge>
                    )}
                  </div>
                ) : documents.businessReg.file?.type === 'application/pdf' ? (
                  <div className="space-y-2">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {documents.businessReg.file?.name}
                    </p>
                    {documents.businessReg.uploaded && (
                      <Badge className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Uploaded
                      </Badge>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, WEBP or PDF (max 5MB)
                    </p>
                  </div>
                )}
                <Input
                  id="businessReg"
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                  onChange={(e) => handleFileSelect('businessReg', e)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2"
                  onClick={() => document.getElementById('businessReg')?.click()}
                >
                  Choose File
                </Button>
              </div>
            </div>

            {/* Owner ID (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="ownerId">Owner ID Card (Optional)</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                {documents.ownerId.preview ? (
                  <div className="space-y-2">
                    <img 
                      src={documents.ownerId.preview} 
                      alt="Owner ID Preview" 
                      className="mx-auto max-h-40 rounded"
                    />
                    <p className="text-sm text-muted-foreground">
                      {documents.ownerId.file?.name}
                    </p>
                    {documents.ownerId.uploaded && (
                      <Badge className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Uploaded
                      </Badge>
                    )}
                  </div>
                ) : documents.ownerId.file?.type === 'application/pdf' ? (
                  <div className="space-y-2">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {documents.ownerId.file?.name}
                    </p>
                    {documents.ownerId.uploaded && (
                      <Badge className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Uploaded
                      </Badge>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, WEBP or PDF (max 5MB)
                    </p>
                  </div>
                )}
                <Input
                  id="ownerId"
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                  onChange={(e) => handleFileSelect('ownerId', e)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2"
                  onClick={() => document.getElementById('ownerId')?.click()}
                >
                  Choose File
                </Button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-2">
              <Button 
                onClick={handleSubmit}
                disabled={submitting || !documents.tradeLicense.uploaded || !documents.tinCertificate.uploaded}
                className="w-full md:w-auto"
              >
                {submitting ? "Submitting..." : verification?.status === 'rejected' ? "Resubmit Verification" : "Submit Verification"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
