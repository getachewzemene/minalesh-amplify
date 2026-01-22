'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Activity, Database, HardDrive, Mail, Server, 
  RefreshCw, AlertTriangle, CheckCircle 
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'

interface HealthMetric {
  type: string
  value: number
  unit?: string
  status: 'healthy' | 'warning' | 'critical'
  timestamp: string
}

interface HealthOverview {
  overallStatus: 'healthy' | 'warning' | 'critical'
  metrics: Record<string, {
    avgValue: number
    maxValue: number
    minValue: number
    healthyCounts: number
    warningCounts: number
    criticalCounts: number
    currentStatus: 'healthy' | 'warning' | 'critical'
  }>
  alerts: {
    active: number
    recent: any[]
  }
  cronJobs: {
    stats: {
      total: number
      successful: number
      failed: number
      successRate: number
    }
  }
  lastUpdated: string
}

export default function HealthMetricsDashboard() {
  const [overview, setOverview] = useState<HealthOverview | null>(null)
  const [recentMetrics, setRecentMetrics] = useState<HealthMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState<string>('memory_heap_used_mb')

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const [overviewRes, metricsRes] = await Promise.all([
        fetch('/api/admin/monitoring/health'),
        fetch(`/api/admin/monitoring/health?action=metrics&hours=24`)
      ])

      if (overviewRes.ok) {
        const data = await overviewRes.json()
        setOverview(data)
      }

      if (metricsRes.ok) {
        const data = await metricsRes.json()
        setRecentMetrics(data.metrics || [])
      }
    } catch (error) {
      console.error('Error fetching health data:', error)
      toast.error('Failed to load health metrics')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return 'default'
      case 'warning': return 'secondary'
      case 'critical': return 'destructive'
      default: return 'outline'
    }
  }

  const formatMetricName = (name: string) => {
    return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const chartData = recentMetrics
    .filter(m => m.type === selectedMetric)
    .slice(-50)
    .map(m => ({
      time: new Date(m.timestamp).toLocaleTimeString(),
      value: m.value,
      status: m.status
    }))

  const metricCategories = {
    memory: ['memory_heap_used_mb', 'memory_heap_total_mb', 'memory_rss_mb', 'system_memory_used_percent'],
    disk: ['disk_usage_percent'],
    database: ['db_latency_ms', 'db_active_connections'],
    queues: ['email_queue_depth', 'webhook_queue_depth', 'email_queue_failed_24h'],
    application: ['error_rate_percent']
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Health Overview
              </CardTitle>
              <CardDescription>Real-time monitoring of system resources and performance</CardDescription>
            </div>
            <Button onClick={fetchData} size="sm" variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {overview?.overallStatus === 'healthy' ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              )}
              <div>
                <div className="text-2xl font-bold capitalize">{overview?.overallStatus}</div>
                <div className="text-sm text-muted-foreground">Overall System Status</div>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-4 ml-8">
              <div>
                <div className="text-2xl font-bold">{overview?.alerts.active || 0}</div>
                <div className="text-sm text-muted-foreground">Active Alerts</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{overview?.cronJobs.stats.successRate.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Cron Success Rate</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Last Updated</div>
                <div className="text-sm">{overview?.lastUpdated ? new Date(overview.lastUpdated).toLocaleTimeString() : '-'}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overview?.metrics['memory_heap_used_mb'] ? (
              <>
                <div className="text-2xl font-bold">{overview.metrics['memory_heap_used_mb'].avgValue.toFixed(0)} MB</div>
                <Badge variant={getStatusBadge(overview.metrics['memory_heap_used_mb'].currentStatus)} className="mt-2">
                  {overview.metrics['memory_heap_used_mb'].currentStatus}
                </Badge>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overview?.metrics['disk_usage_percent'] ? (
              <>
                <div className="text-2xl font-bold">{overview.metrics['disk_usage_percent'].avgValue.toFixed(1)}%</div>
                <Badge variant={getStatusBadge(overview.metrics['disk_usage_percent'].currentStatus)} className="mt-2">
                  {overview.metrics['disk_usage_percent'].currentStatus}
                </Badge>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overview?.metrics['db_latency_ms'] ? (
              <>
                <div className="text-2xl font-bold">{overview.metrics['db_latency_ms'].avgValue.toFixed(0)} ms</div>
                <Badge variant={getStatusBadge(overview.metrics['db_latency_ms'].currentStatus)} className="mt-2">
                  {overview.metrics['db_latency_ms'].currentStatus}
                </Badge>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Queue</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overview?.metrics['email_queue_depth'] ? (
              <>
                <div className="text-2xl font-bold">{overview.metrics['email_queue_depth'].avgValue.toFixed(0)}</div>
                <Badge variant={getStatusBadge(overview.metrics['email_queue_depth'].currentStatus)} className="mt-2">
                  {overview.metrics['email_queue_depth'].currentStatus}
                </Badge>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Metric Trends (Last 24 Hours)</CardTitle>
          <CardDescription>
            <div className="flex gap-2 flex-wrap mt-2">
              {Object.entries(metricCategories).map(([category, metrics]) => (
                <div key={category} className="flex gap-1">
                  {metrics.map(metric => (
                    <Button
                      key={metric}
                      size="sm"
                      variant={selectedMetric === metric ? 'default' : 'outline'}
                      onClick={() => setSelectedMetric(metric)}
                    >
                      {formatMetricName(metric)}
                    </Button>
                  ))}
                </div>
              ))}
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} dot={{ r: 3 }} name={formatMetricName(selectedMetric)} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No data available for this metric
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Metrics Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {overview?.metrics && Object.entries(overview.metrics).map(([metricType, data]) => (
              <div key={metricType} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{formatMetricName(metricType)}</div>
                  <div className="text-sm text-muted-foreground">
                    Avg: {data.avgValue.toFixed(2)} | Max: {data.maxValue.toFixed(2)} | Min: {data.minValue.toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <div className="text-green-500">{data.healthyCounts} healthy</div>
                    <div className="text-yellow-500">{data.warningCounts} warning</div>
                    <div className="text-red-500">{data.criticalCounts} critical</div>
                  </div>
                  <Badge variant={getStatusBadge(data.currentStatus)}>
                    {data.currentStatus}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
