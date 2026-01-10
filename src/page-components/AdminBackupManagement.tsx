'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Database, Download, RefreshCw, Loader2, CheckCircle2, XCircle,
  Clock, HardDrive, Trash2, Calendar, Shield
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface BackupRecord {
  id: string
  backupType: string
  status: string
  size?: string
  location?: string
  retentionDays: number
  expiresAt: string
  startedAt: string
  completedAt?: string
  errorMessage?: string
}

interface BackupStats {
  totalBackups: number
  successfulBackups: number
  failedBackups: number
  successRate: number
  lastBackup?: {
    id: string
    completedAt: string
    type: string
    size?: string
  }
  totalStorageUsed: string
}

interface BackupSchedule {
  schedule: string
  retentionDays: number
  description: string
}

export default function AdminBackupManagement() {
  const [backups, setBackups] = useState<BackupRecord[]>([])
  const [stats, setStats] = useState<BackupStats | null>(null)
  const [schedule, setSchedule] = useState<Record<string, BackupSchedule>>({})
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedType, setSelectedType] = useState('full')

  useEffect(() => {
    fetchBackupData()
  }, [])

  const fetchBackupData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/backups', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setBackups(data.backups || [])
        setStats(data.stats)
        setSchedule(data.recommendedSchedule || {})
      }
    } catch (error) {
      console.error('Error fetching backup data:', error)
      toast.error('Failed to load backup data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBackup = async () => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/backups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'create', type: selectedType }),
      })
      if (response.ok) {
        const data = await response.json()
        toast.success(data.message)
        fetchBackupData()
      } else {
        toast.error('Failed to create backup')
      }
    } catch (error) {
      toast.error('Failed to create backup')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCleanup = async () => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/backups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'cleanup' }),
      })
      if (response.ok) {
        const data = await response.json()
        toast.success(data.message)
        fetchBackupData()
      } else {
        toast.error('Failed to cleanup backups')
      }
    } catch (error) {
      toast.error('Failed to cleanup expired backups')
    } finally {
      setActionLoading(false)
    }
  }

  const formatSize = (sizeStr?: string) => {
    if (!sizeStr) return 'N/A'
    const size = parseInt(sizeStr, 10)
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'in_progress':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Backup Management</h1>
          <p className="text-muted-foreground">
            Manage database backups and recovery
          </p>
        </div>
        <Button variant="outline" onClick={fetchBackupData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBackups || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.successRate || 0}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSize(stats?.totalStorageUsed)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {stats?.lastBackup ? formatDate(stats.lastBackup.completedAt) : 'Never'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Backup */}
      <Card>
        <CardHeader>
          <CardTitle>Create Backup</CardTitle>
          <CardDescription>
            Trigger a manual backup of the database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Backup Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Backup</SelectItem>
                  <SelectItem value="incremental">Incremental</SelectItem>
                  <SelectItem value="differential">Differential</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateBackup} disabled={actionLoading}>
              {actionLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              Create Backup
            </Button>
            <Button variant="outline" onClick={handleCleanup} disabled={actionLoading}>
              <Trash2 className="h-4 w-4 mr-2" />
              Cleanup Expired
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Schedule</CardTitle>
          <CardDescription>
            Optimal backup schedule for production environments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(schedule).map(([type, config]) => (
              <div key={type} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="font-semibold capitalize">{type}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{config.description}</p>
                <div className="text-xs space-y-1">
                  <div>Schedule: <code>{config.schedule}</code></div>
                  <div>Retention: {config.retentionDays} days</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
          <CardDescription>
            Recent backup records and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No backup records found
            </div>
          ) : (
            <div className="space-y-2">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(backup.status)}
                    <div>
                      <div className="font-medium capitalize">
                        {backup.backupType} Backup
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(backup.startedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={backup.status === 'completed' ? 'default' : 'destructive'}>
                      {backup.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatSize(backup.size)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
