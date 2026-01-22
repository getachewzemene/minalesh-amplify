'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { 
  FileText, 
  Search, 
  Filter,
  CheckCircle,
  PenTool,
  Eye
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
  createdAt: string
  vendor: {
    displayName: string
    firstName: string
    lastName: string
  }
  signatures: Array<{
    signerRole: string
    status: string
  }>
}

export default function AdminContractsManagement() {
  const router = useRouter()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    contractType: '',
    search: '',
  })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState<any>({})
  const [signDialogOpen, setSignDialogOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<string | null>(null)
  const [signature, setSignature] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchContracts()
  }, [filters, page])

  const fetchContracts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        perPage: '20',
      })

      if (filters.status) params.append('status', filters.status)
      if (filters.contractType) params.append('contractType', filters.contractType)

      const response = await fetch(
        `/api/admin/contracts?${params.toString()}`,
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
        setStats(data.statistics || {})
      }
    } catch (error) {
      console.error('Error fetching contracts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignContract = async () => {
    if (!selectedContract || !signature.trim()) {
      toast.error('Please provide a signature')
      return
    }

    try {
      setProcessing(true)
      const response = await fetch(`/api/vendors/contracts/${selectedContract}/sign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          signatureData: signature,
          accept: true,
        }),
      })

      if (response.ok) {
        toast.success('Contract signed successfully')
        setSignDialogOpen(false)
        setSignature('')
        setSelectedContract(null)
        fetchContracts()
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

  const filteredContracts = contracts.filter(contract => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      return (
        contract.contractNumber.toLowerCase().includes(searchLower) ||
        contract.title.toLowerCase().includes(searchLower) ||
        contract.vendor.displayName?.toLowerCase().includes(searchLower) ||
        `${contract.vendor.firstName} ${contract.vendor.lastName}`.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Contract Management</h1>
        <p className="text-muted-foreground mt-1">
          Review and manage vendor contracts
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Contracts</CardDescription>
            <CardTitle className="text-2xl">{Object.values(stats).reduce((a: number, b: any) => a + b, 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.active || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">{stats.pending_signature || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Draft</CardDescription>
            <CardTitle className="text-2xl text-gray-600">{stats.draft || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Expired</CardDescription>
            <CardTitle className="text-2xl text-red-600">{stats.expired || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Search</Label>
              <div className="relative mt-2">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Contract number, vendor..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_signature">Pending Signature</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Contract Type</Label>
              <Select
                value={filters.contractType}
                onValueChange={(value) => setFilters({ ...filters, contractType: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => setFilters({ status: '', contractType: '', search: '' })}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading contracts...</p>
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No contracts found</h3>
              <p className="text-muted-foreground">
                {filters.search || filters.status || filters.contractType
                  ? 'Try adjusting your filters'
                  : 'No vendor contracts have been created yet'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Contract Number</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Vendor</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Period</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Signatures</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredContracts.map((contract) => {
                    const vendorSig = contract.signatures.find(s => s.signerRole === 'vendor')
                    const adminSig = contract.signatures.find(s => s.signerRole === 'admin')
                    const needsAdminSignature = vendorSig?.status === 'signed' && adminSig?.status !== 'signed'

                    return (
                      <tr key={contract.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <div className="font-mono text-sm">{contract.contractNumber}</div>
                          <div className="text-xs text-muted-foreground">{contract.title}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            {contract.vendor.displayName || `${contract.vendor.firstName} ${contract.vendor.lastName}`}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="capitalize">
                            {contract.contractType}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={
                            contract.status === 'active' ? 'bg-green-500' :
                            contract.status === 'pending_signature' ? 'bg-yellow-500' :
                            contract.status === 'terminated' ? 'bg-red-500' :
                            'bg-gray-500'
                          }>
                            {contract.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            {format(new Date(contract.startDate), 'MMM dd, yy')} - 
                            {format(new Date(contract.endDate), 'MMM dd, yy')}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {vendorSig?.status === 'signed' && (
                              <CheckCircle className="w-4 h-4 text-green-500" title="Vendor signed" />
                            )}
                            {adminSig?.status === 'signed' && (
                              <CheckCircle className="w-4 h-4 text-blue-500" title="Admin signed" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/vendor/contracts/${contract.id}`)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            {needsAdminSignature && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedContract(contract.id)
                                  setSignDialogOpen(true)
                                }}
                              >
                                <PenTool className="w-3 h-3 mr-1" />
                                Sign
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t">
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
        </CardContent>
      </Card>

      {/* Sign Dialog */}
      <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign Contract (Admin)</DialogTitle>
            <DialogDescription>
              Enter your name to sign this contract as an administrator
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Your Full Name</Label>
            <Textarea
              placeholder="Enter your full name"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSignContract} disabled={processing}>
              {processing ? 'Signing...' : 'Sign Contract'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
