'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Plus, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Calendar
} from 'lucide-react'
import { format } from 'date-fns'

interface Contract {
  id: string
  contractNumber: string
  title: string
  contractType: string
  status: string
  startDate: string
  endDate: string
  autoRenew: boolean
  signedAt: string | null
  createdAt: string
  template?: {
    name: string
  }
  signatures: Array<{
    signerRole: string
    status: string
    signedAt: string | null
  }>
}

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-500', icon: FileText },
  pending_signature: { label: 'Pending Signature', color: 'bg-yellow-500', icon: Clock },
  active: { label: 'Active', color: 'bg-green-500', icon: CheckCircle },
  expired: { label: 'Expired', color: 'bg-red-500', icon: AlertCircle },
  terminated: { label: 'Terminated', color: 'bg-red-700', icon: XCircle },
  renewed: { label: 'Renewed', color: 'bg-blue-500', icon: RefreshCw },
}

const contractTypeLabels = {
  standard: 'Standard',
  premium: 'Premium',
  enterprise: 'Enterprise',
  custom: 'Custom',
}

export default function VendorContractsPage() {
  const router = useRouter()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchContracts()
  }, [activeTab, page])

  const fetchContracts = async () => {
    try {
      setLoading(true)
      const statusParam = activeTab !== 'all' ? `&status=${activeTab}` : ''
      const response = await fetch(
        `/api/vendors/contracts?page=${page}&perPage=10${statusParam}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setContracts(data.contracts || [])
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error('Error fetching contracts:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    const Icon = config.icon
    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getSignatureStatus = (signatures: Contract['signatures']) => {
    const vendorSig = signatures.find(s => s.signerRole === 'vendor')
    const adminSig = signatures.find(s => s.signerRole === 'admin')

    if (vendorSig?.status === 'signed' && adminSig?.status === 'signed') {
      return <span className="text-green-600 text-sm">✓ Fully Signed</span>
    } else if (vendorSig?.status === 'signed') {
      return <span className="text-yellow-600 text-sm">⏳ Awaiting Admin Signature</span>
    } else {
      return <span className="text-gray-600 text-sm">⊘ Not Signed</span>
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Vendor Contracts</h1>
          <p className="text-muted-foreground mt-1">
            Manage your vendor agreements and contracts
          </p>
        </div>
        <Button onClick={() => router.push('/vendor/contracts/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Contract
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="pending_signature">Pending</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading contracts...</p>
            </div>
          ) : contracts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No contracts found</h3>
                <p className="text-muted-foreground mb-4">
                  {activeTab === 'all' 
                    ? 'You don\'t have any contracts yet. Create your first contract to get started.'
                    : `No ${activeTab.replace('_', ' ')} contracts found.`
                  }
                </p>
                {activeTab === 'all' && (
                  <Button onClick={() => router.push('/vendor/contracts/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Contract
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {contracts.map((contract) => (
                <Card 
                  key={contract.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/vendor/contracts/${contract.id}`)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl">{contract.title}</CardTitle>
                          {getStatusBadge(contract.status)}
                          <Badge variant="outline">
                            {contractTypeLabels[contract.contractType as keyof typeof contractTypeLabels]}
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-4">
                          <span className="font-mono text-sm">{contract.contractNumber}</span>
                          {contract.template && (
                            <span className="text-xs">• Template: {contract.template.name}</span>
                          )}
                        </CardDescription>
                      </div>
                      {contract.autoRenew && (
                        <Badge variant="secondary" className="ml-2">
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Auto-Renew
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Start Date</p>
                        <p className="font-medium flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {format(new Date(contract.startDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">End Date</p>
                        <p className="font-medium flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {format(new Date(contract.endDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Signature Status</p>
                        <p className="font-medium">{getSignatureStatus(contract.signatures)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Created</p>
                        <p className="font-medium">
                          {format(new Date(contract.createdAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="py-2 px-4 text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
