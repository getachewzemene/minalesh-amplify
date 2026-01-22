'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Calendar,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  PenTool,
  RefreshCw,
  Trash2,
  Clock
} from 'lucide-react'
import { format } from 'date-fns'

interface ContractDetailsPageProps {
  contractId: string
}

interface Contract {
  id: string
  contractNumber: string
  title: string
  contractType: string
  status: string
  version: number
  content: string
  startDate: string
  endDate: string
  autoRenew: boolean
  renewalPeriodMonths: number | null
  commissionRate: string
  paymentTerms: string | null
  signedAt: string | null
  terminationDate: string | null
  terminationReason: string | null
  createdAt: string
  vendor: {
    displayName: string
    firstName: string
    lastName: string
    tradeLicense: string
    tinNumber: string
  }
  template?: {
    name: string
    contractType: string
  }
  signatures: Array<{
    id: string
    signerRole: string
    status: string
    signedAt: string | null
    rejectionReason: string | null
  }>
  parentContract?: {
    id: string
    contractNumber: string
    version: number
  }
  childContracts: Array<{
    id: string
    contractNumber: string
    version: number
    status: string
  }>
}

export default function ContractDetailsPage({ contractId }: ContractDetailsPageProps) {
  const router = useRouter()
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [signDialogOpen, setSignDialogOpen] = useState(false)
  const [terminateDialogOpen, setTerminateDialogOpen] = useState(false)
  const [signature, setSignature] = useState('')
  const [terminationReason, setTerminationReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    fetchContract()
  }, [contractId])

  const fetchContract = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/vendors/contracts/${contractId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setContract(data.contract)
      } else {
        toast.error('Failed to load contract')
        router.push('/vendor/contracts')
      }
    } catch (error) {
      console.error('Error fetching contract:', error)
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSign = async () => {
    if (!signature.trim() && !canvasRef.current) {
      toast.error('Please provide a signature')
      return
    }

    try {
      setProcessing(true)
      let signatureData = signature

      // If canvas signature, get the base64 data
      if (canvasRef.current) {
        signatureData = canvasRef.current.toDataURL()
      }

      const response = await fetch(`/api/vendors/contracts/${contractId}/sign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          signatureData,
          accept: true,
        }),
      })

      if (response.ok) {
        toast.success('Contract signed successfully')
        setSignDialogOpen(false)
        fetchContract()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to sign contract')
      }
    } catch (error) {
      console.error('Error signing contract:', error)
      toast.error('An error occurred')
    } finally {
      setProcessing(false)
    }
  }

  const handleTerminate = async () => {
    if (!terminationReason.trim()) {
      toast.error('Please provide a termination reason')
      return
    }

    try {
      setProcessing(true)
      const response = await fetch(`/api/vendors/contracts/${contractId}/terminate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          reason: terminationReason,
        }),
      })

      if (response.ok) {
        toast.success('Contract terminated successfully')
        setTerminateDialogOpen(false)
        fetchContract()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to terminate contract')
      }
    } catch (error) {
      console.error('Error terminating contract:', error)
      toast.error('An error occurred')
    } finally {
      setProcessing(false)
    }
  }

  const handleRenew = async () => {
    try {
      setProcessing(true)
      const response = await fetch(`/api/vendors/contracts/${contractId}/renew`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({}),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Contract renewed successfully')
        router.push(`/vendor/contracts/${data.contract.id}`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to renew contract')
      }
    } catch (error) {
      console.error('Error renewing contract:', error)
      toast.error('An error occurred')
    } finally {
      setProcessing(false)
    }
  }

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading contract...</p>
      </div>
    )
  }

  if (!contract) {
    return null
  }

  const vendorSignature = contract.signatures.find(s => s.signerRole === 'vendor')
  const adminSignature = contract.signatures.find(s => s.signerRole === 'admin')
  const canSign = contract.status === 'draft' || contract.status === 'pending_signature'
  const canTerminate = contract.status === 'active' || contract.status === 'pending_signature'
  const canRenew = contract.status === 'active' || contract.status === 'expired'

  return (
    <div className="container mx-auto py-8">
      <Button 
        variant="ghost" 
        className="mb-4"
        onClick={() => router.push('/vendor/contracts')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Contracts
      </Button>

      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl mb-2">{contract.title}</CardTitle>
              <CardDescription className="space-y-1">
                <div className="font-mono text-sm">{contract.contractNumber}</div>
                <div className="text-xs">Version {contract.version}</div>
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {canSign && vendorSignature?.status !== 'signed' && (
                <Button onClick={() => setSignDialogOpen(true)}>
                  <PenTool className="w-4 h-4 mr-2" />
                  Sign Contract
                </Button>
              )}
              {canRenew && (
                <Button variant="outline" onClick={handleRenew} disabled={processing}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Renew
                </Button>
              )}
              {canTerminate && (
                <Button variant="destructive" onClick={() => setTerminateDialogOpen(true)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Terminate
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contract Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status & Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contract Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge className={
                      contract.status === 'active' ? 'bg-green-500' :
                      contract.status === 'pending_signature' ? 'bg-yellow-500' :
                      contract.status === 'terminated' ? 'bg-red-500' :
                      'bg-gray-500'
                    }>
                      {contract.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p className="mt-1 font-medium capitalize">{contract.contractType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Start Date</Label>
                  <p className="mt-1 font-medium flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {format(new Date(contract.startDate), 'MMMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">End Date</Label>
                  <p className="mt-1 font-medium flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {format(new Date(contract.endDate), 'MMMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Commission Rate</Label>
                  <p className="mt-1 font-medium">{(parseFloat(contract.commissionRate) * 100).toFixed(2)}%</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Auto-Renewal</Label>
                  <p className="mt-1 font-medium">
                    {contract.autoRenew ? `Yes (${contract.renewalPeriodMonths} months)` : 'No'}
                  </p>
                </div>
              </div>
              {contract.paymentTerms && (
                <div>
                  <Label className="text-muted-foreground">Payment Terms</Label>
                  <p className="mt-1">{contract.paymentTerms}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contract Content */}
          <Card>
            <CardHeader>
              <CardTitle>Contract Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="prose max-w-none text-sm"
                dangerouslySetInnerHTML={{ __html: contract.content }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Signatures */}
          <Card>
            <CardHeader>
              <CardTitle>Signatures</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Vendor Signature</Label>
                <div className="mt-2 flex items-center gap-2">
                  {vendorSignature?.status === 'signed' ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">
                        Signed on {format(new Date(vendorSignature.signedAt!), 'MMM dd, yyyy')}
                      </span>
                    </>
                  ) : vendorSignature?.status === 'rejected' ? (
                    <>
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm">Rejected</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">Pending</span>
                    </>
                  )}
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-muted-foreground">Admin Signature</Label>
                <div className="mt-2 flex items-center gap-2">
                  {adminSignature?.status === 'signed' ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">
                        Signed on {format(new Date(adminSignature.signedAt!), 'MMM dd, yyyy')}
                      </span>
                    </>
                  ) : adminSignature?.status === 'rejected' ? (
                    <>
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm">Rejected</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">Pending</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Version History */}
          {(contract.parentContract || contract.childContracts.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Version History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {contract.parentContract && (
                  <div 
                    className="p-2 border rounded cursor-pointer hover:bg-muted"
                    onClick={() => router.push(`/vendor/contracts/${contract.parentContract!.id}`)}
                  >
                    <div className="text-sm font-medium">Version {contract.parentContract.version}</div>
                    <div className="text-xs text-muted-foreground">{contract.parentContract.contractNumber}</div>
                  </div>
                )}
                <div className="p-2 border rounded bg-primary/10">
                  <div className="text-sm font-medium">Version {contract.version} (Current)</div>
                  <div className="text-xs text-muted-foreground">{contract.contractNumber}</div>
                </div>
                {contract.childContracts.map((child) => (
                  <div 
                    key={child.id}
                    className="p-2 border rounded cursor-pointer hover:bg-muted"
                    onClick={() => router.push(`/vendor/contracts/${child.id}`)}
                  >
                    <div className="text-sm font-medium">Version {child.version}</div>
                    <div className="text-xs text-muted-foreground">{child.contractNumber}</div>
                    <Badge variant="outline" className="text-xs mt-1">{child.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Sign Dialog */}
      <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sign Contract</DialogTitle>
            <DialogDescription>
              Please provide your signature to sign this contract
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Draw Your Signature</Label>
              <div className="mt-2 border rounded-lg">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  className="border rounded-lg cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={clearCanvas}
              >
                Clear
              </Button>
            </div>
            <div>
              <Label>Or Type Your Name</Label>
              <Textarea
                placeholder="Enter your full name"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSign} disabled={processing}>
              {processing ? 'Signing...' : 'Sign Contract'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terminate Dialog */}
      <Dialog open={terminateDialogOpen} onOpenChange={setTerminateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terminate Contract</DialogTitle>
            <DialogDescription>
              Please provide a reason for terminating this contract
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Termination Reason</Label>
            <Textarea
              placeholder="Enter reason for termination..."
              value={terminationReason}
              onChange={(e) => setTerminationReason(e.target.value)}
              className="mt-2"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTerminateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleTerminate} 
              disabled={processing}
            >
              {processing ? 'Terminating...' : 'Terminate Contract'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
