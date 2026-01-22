'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Bell, Plus, RefreshCw, CheckCircle, XCircle, Clock, Trash2, Edit } from 'lucide-react'
import { toast } from 'sonner'

interface AlertConfig {
  id: string
  name: string
  description?: string
  metricType: string
  condition: string
  threshold: number
  severity: string
  isEnabled: boolean
  notifyEmail: boolean
  notifySlack: boolean
  webhookUrl?: string
  lastTriggeredAt?: string
  _count?: {
    alerts: number
  }
}

interface AlertHistory {
  id: string
  metricValue: number
  threshold: number
  severity: string
  message: string
  acknowledged: boolean
  acknowledgedAt?: string
  resolvedAt?: string
  createdAt: string
  alertConfig: {
    name: string
    metricType: string
  }
}

export default function AlertsManagement() {
  const [configs, setConfigs] = useState<AlertConfig[]>([])
  const [history, setHistory] = useState<AlertHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newAlert, setNewAlert] = useState({
    name: '',
    metricType: 'memory_heap_used_mb',
    condition: 'gt',
    threshold: 512,
    severity: 'warning',
    notifyEmail: true,
    notifySlack: false,
    webhookUrl: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/admin/monitoring/alerts')
      if (response.ok) {
        const data = await response.json()
        setConfigs(data.configs || [])
        setHistory(data.recentHistory || [])
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
      toast.error('Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }

  const createAlert = async () => {
    try {
      const response = await fetch('/api/admin/monitoring/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...newAlert })
      })

      if (response.ok) {
        toast.success('Alert created successfully')
        setShowCreateDialog(false)
        fetchData()
      } else {
        toast.error('Failed to create alert')
      }
    } catch (error) {
      toast.error('Error creating alert')
    }
  }

  const deleteAlert = async (id: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) return

    try {
      const response = await fetch(`/api/admin/monitoring/alerts?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Alert deleted')
        fetchData()
      } else {
        toast.error('Failed to delete alert')
      }
    } catch (error) {
      toast.error('Error deleting alert')
    }
  }

  const acknowledgeAlert = async (id: string) => {
    try {
      const response = await fetch('/api/admin/monitoring/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'acknowledge', alertId: id })
      })

      if (response.ok) {
        toast.success('Alert acknowledged')
        fetchData()
      } else {
        toast.error('Failed to acknowledge alert')
      }
    } catch (error) {
      toast.error('Error acknowledging alert')
    }
  }

  const resolveAlert = async (id: string) => {
    try {
      const response = await fetch('/api/admin/monitoring/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve', alertId: id })
      })

      if (response.ok) {
        toast.success('Alert resolved')
        fetchData()
      } else {
        toast.error('Failed to resolve alert')
      }
    } catch (error) {
      toast.error('Error resolving alert')
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'warning': return 'secondary'
      default: return 'default'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Alert Configuration</h2>
          <p className="text-muted-foreground">Manage monitoring alerts and notifications</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Alert
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Alert</DialogTitle>
                <DialogDescription>Configure a new alert rule for system monitoring</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Alert Name</label>
                  <Input
                    placeholder="High Memory Usage"
                    value={newAlert.name}
                    onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Metric Type</label>
                  <Select value={newAlert.metricType} onValueChange={(v) => setNewAlert({ ...newAlert, metricType: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="memory_heap_used_mb">Memory Heap Used (MB)</SelectItem>
                      <SelectItem value="system_memory_used_percent">System Memory (%)</SelectItem>
                      <SelectItem value="disk_usage_percent">Disk Usage (%)</SelectItem>
                      <SelectItem value="db_latency_ms">Database Latency (ms)</SelectItem>
                      <SelectItem value="db_active_connections">DB Connections</SelectItem>
                      <SelectItem value="email_queue_depth">Email Queue Depth</SelectItem>
                      <SelectItem value="error_rate_percent">Error Rate (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Condition</label>
                    <Select value={newAlert.condition} onValueChange={(v) => setNewAlert({ ...newAlert, condition: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gt">Greater Than</SelectItem>
                        <SelectItem value="gte">Greater Than or Equal</SelectItem>
                        <SelectItem value="lt">Less Than</SelectItem>
                        <SelectItem value="lte">Less Than or Equal</SelectItem>
                        <SelectItem value="eq">Equal To</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Threshold</label>
                    <Input
                      type="number"
                      value={newAlert.threshold}
                      onChange={(e) => setNewAlert({ ...newAlert, threshold: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Severity</label>
                  <Select value={newAlert.severity} onValueChange={(v) => setNewAlert({ ...newAlert, severity: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newAlert.notifyEmail}
                      onChange={(e) => setNewAlert({ ...newAlert, notifyEmail: e.target.checked })}
                    />
                    <span className="text-sm">Email Notifications</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newAlert.notifySlack}
                      onChange={(e) => setNewAlert({ ...newAlert, notifySlack: e.target.checked })}
                    />
                    <span className="text-sm">Slack Notifications</span>
                  </label>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={createAlert}>Create Alert</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alert Rules ({configs.length})</CardTitle>
          <CardDescription>Configured alert thresholds and notification settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {configs.map((config) => (
              <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{config.name}</span>
                    <Badge variant={getSeverityBadge(config.severity)}>{config.severity}</Badge>
                    {!config.isEnabled && <Badge variant="outline">Disabled</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {config.metricType} {config.condition} {config.threshold}
                  </div>
                  <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                    {config.notifyEmail && <Badge variant="outline">Email</Badge>}
                    {config.notifySlack && <Badge variant="outline">Slack</Badge>}
                    {config._count && <span>{config._count.alerts} triggers</span>}
                  </div>
                </div>
                <Button onClick={() => deleteAlert(config.id)} variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {configs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No alert rules configured. Create one to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Alert History</CardTitle>
          <CardDescription>Alerts triggered in the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {history.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {alert.resolvedAt ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : alert.acknowledged ? (
                    <Clock className="h-5 w-5 text-blue-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{alert.alertConfig.name}</span>
                      <Badge variant={getSeverityBadge(alert.severity)}>{alert.severity}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">{alert.message}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(alert.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!alert.acknowledged && !alert.resolvedAt && (
                    <Button onClick={() => acknowledgeAlert(alert.id)} size="sm" variant="outline">
                      Acknowledge
                    </Button>
                  )}
                  {!alert.resolvedAt && (
                    <Button onClick={() => resolveAlert(alert.id)} size="sm" variant="outline">
                      Resolve
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No recent alerts
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
