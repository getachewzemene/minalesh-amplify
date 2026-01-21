'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Activity, TrendingUp, Clock, CheckCircle2, XCircle, 
  RefreshCw, BarChart3, Download, AlertCircle, Server, Database, HardDrive, Bell 
} from 'lucide-react'
import { toast } from 'sonner'
import HealthMetricsDashboard from '@/components/monitoring/HealthMetricsDashboard'
import AlertsManagement from '@/components/monitoring/AlertsManagement'

interface CronJobStats {
  jobName: string
  successCount: number
  failureCount: number
  totalExecutions: number
  successRate: number
  avgDuration: number
}

interface CronJobExecution {
  id: string
  jobName: string
  status: string
  startedAt: string
  completedAt?: string
  duration?: number
  recordsProcessed?: number
  errorMessage?: string
}

interface DisputeAnalytics {
  summary: {
    totalDisputes: number
    resolvedDisputes: number
    avgResolutionTimeHours: number
    refundsProcessed: number
    totalRefundAmount: number
  }
  byStatus: Record<string, number>
  byType: Record<string, number>
  resolutionTimeBuckets: {
    under_24h: number
    '24h_to_3days': number
    '3days_to_7days': number
    over_7days: number
  }
  dailyTrends: any[]
}

interface ExportAnalytics {
  summary: {
    totalRequests: number
    completedRequests: number
    failedRequests: number
    failureRate: number
    avgProcessingTimeMinutes: number
    avgFileSizeBytes: number
  }
  byStatus: Record<string, number>
  byFormat: Record<string, number>
  recurringVsOneTime: {
    recurring: number
    oneTime: number
  }
  categoryUsage: Record<string, number>
}

export default function AdminMonitoringDashboard() {
  const [cronJobs, setCronJobs] = useState<CronJobExecution[]>([])
  const [cronStats, setCronStats] = useState<CronJobStats[]>([])
  const [disputeAnalytics, setDisputeAnalytics] = useState<DisputeAnalytics | null>(null)
  const [exportAnalytics, setExportAnalytics] = useState<ExportAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchCronJobs(),
        fetchDisputeAnalytics(),
        fetchExportAnalytics()
      ])
    } catch (error) {
      console.error('Error fetching monitoring data:', error)
      toast.error('Failed to load monitoring data')
    } finally {
      setLoading(false)
    }
  }

  const fetchCronJobs = async () => {
    try {
      const response = await fetch('/api/admin/monitoring/cron-jobs')
      if (response.ok) {
        const data = await response.json()
        setCronJobs(data.executions || [])
        setCronStats(data.statistics || [])
      }
    } catch (error) {
      console.error('Error fetching cron jobs:', error)
    }
  }

  const fetchDisputeAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/monitoring/dispute-analytics')
      if (response.ok) {
        const data = await response.json()
        setDisputeAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching dispute analytics:', error)
    }
  }

  const fetchExportAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/monitoring/export-analytics')
      if (response.ok) {
        const data = await response.json()
        setExportAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching export analytics:', error)
    }
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground mt-1">
            Monitor cron jobs, disputes, and data exports
          </p>
        </div>
        <Button onClick={fetchAllData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="health" className="space-y-4">
        <TabsList>
          <TabsTrigger value="health">
            <Server className="h-4 w-4 mr-2" />
            System Health
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <Bell className="h-4 w-4 mr-2" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="cron-jobs">Cron Jobs</TabsTrigger>
          <TabsTrigger value="disputes">Dispute Analytics</TabsTrigger>
          <TabsTrigger value="exports">Export Analytics</TabsTrigger>
        </TabsList>

        {/* Health Metrics Tab */}
        <TabsContent value="health" className="space-y-4">
          <HealthMetricsDashboard />
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <AlertsManagement />
        </TabsContent>

        {/* Cron Jobs Tab */}
        <TabsContent value="cron-jobs" className="space-y-4">
          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cronStats.map((stat) => (
              <Card key={stat.jobName}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.jobName}
                  </CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stat.successRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Success Rate ({stat.successCount}/{stat.totalExecutions})
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Avg: {formatDuration(stat.avgDuration)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Executions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Executions</CardTitle>
              <CardDescription>Last 50 cron job executions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {cronJobs.slice(0, 50).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      {job.status === 'success' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : job.status === 'failed' ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-blue-500" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{job.jobName}</span>
                          <Badge variant={job.status === 'success' ? 'default' : 'destructive'}>
                            {job.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(job.startedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div>{formatDuration(job.duration)}</div>
                      {job.recordsProcessed !== undefined && (
                        <div>{job.recordsProcessed} records</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dispute Analytics Tab */}
        <TabsContent value="disputes" className="space-y-4">
          {disputeAnalytics && (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Disputes</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{disputeAnalytics.summary.totalDisputes}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{disputeAnalytics.summary.resolvedDisputes}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {disputeAnalytics.summary.avgResolutionTimeHours.toFixed(1)}h
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Refunds</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{disputeAnalytics.summary.refundsProcessed}</div>
                    <p className="text-xs text-muted-foreground">
                      ${disputeAnalytics.summary.totalRefundAmount.toFixed(2)} total
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Resolution Time Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Resolution Time Distribution</CardTitle>
                  <CardDescription>How quickly disputes are being resolved</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(disputeAnalytics.resolutionTimeBuckets).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm">{key.replace('_', ' ')}</span>
                        <Badge variant="outline">{value} disputes</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* By Type and Status */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>By Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(disputeAnalytics.byType).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                          <Badge>{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>By Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(disputeAnalytics.byStatus).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                          <Badge>{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Export Analytics Tab */}
        <TabsContent value="exports" className="space-y-4">
          {exportAnalytics && (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{exportAnalytics.summary.totalRequests}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(100 - exportAnalytics.summary.failureRate).toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Processing</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {exportAnalytics.summary.avgProcessingTimeMinutes.toFixed(1)}m
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg File Size</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(exportAnalytics.summary.avgFileSizeBytes / 1024).toFixed(0)} KB
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Stats */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>By Format</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(exportAnalytics.byFormat).map(([format, count]) => (
                        <div key={format} className="flex items-center justify-between">
                          <span className="text-sm uppercase">{format}</span>
                          <Badge>{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Export Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">One-time</span>
                        <Badge>{exportAnalytics.recurringVsOneTime.oneTime}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Recurring</span>
                        <Badge variant="secondary">{exportAnalytics.recurringVsOneTime.recurring}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Category Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(exportAnalytics.categoryUsage).map(([category, count]) => (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{category}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
