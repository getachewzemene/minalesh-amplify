'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  highEvents: number;
  rateLimitViolations: number;
  csrfFailures: number;
  botDetections: number;
  activeBlacklist: number;
  activeWhitelist: number;
}

interface EventData {
  type: string;
  count: number;
}

interface SecurityEvent {
  id: string;
  ipAddress: string;
  eventType: string;
  severity: string;
  userAgent: string | null;
  endpoint: string | null;
  createdAt: string;
  resolved: boolean;
}

interface BlacklistedIP {
  ipAddress: string;
  reason: string;
  severity: string;
  blockCount: number;
  createdAt: string;
  expiresAt: string | null;
}

interface MonitoringData {
  timeRange: string;
  metrics: SecurityMetrics;
  eventsByType: EventData[];
  eventsBySeverity: EventData[];
  recentCriticalEvents: SecurityEvent[];
  blacklistedIPs: BlacklistedIP[];
}

export default function SecurityDashboard() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/admin/security/monitoring?timeRange=${timeRange}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jsonData = await response.json();
      setData(jsonData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, timeRange]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading security dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Security Monitoring Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange('1h')}
              className={`px-3 py-1 rounded ${
                timeRange === '1h' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              1 Hour
            </button>
            <button
              onClick={() => setTimeRange('24h')}
              className={`px-3 py-1 rounded ${
                timeRange === '24h' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              24 Hours
            </button>
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-1 rounded ${
                timeRange === '7d' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-3 py-1 rounded ${
                timeRange === '30d' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              30 Days
            </button>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Auto-refresh (30s)</span>
            </label>
            <button
              onClick={fetchData}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Refresh Now
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Events</div>
          <div className="text-2xl font-bold">{data.metrics.totalEvents.toLocaleString()}</div>
        </Card>
        <Card className="p-4 bg-red-50">
          <div className="text-sm text-red-600">Critical Events</div>
          <div className="text-2xl font-bold text-red-600">{data.metrics.criticalEvents.toLocaleString()}</div>
        </Card>
        <Card className="p-4 bg-orange-50">
          <div className="text-sm text-orange-600">High Severity</div>
          <div className="text-2xl font-bold text-orange-600">{data.metrics.highEvents.toLocaleString()}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Rate Limit Violations</div>
          <div className="text-2xl font-bold">{data.metrics.rateLimitViolations.toLocaleString()}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-sm text-gray-600">CSRF Failures</div>
          <div className="text-2xl font-bold">{data.metrics.csrfFailures.toLocaleString()}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Bot Detections</div>
          <div className="text-2xl font-bold">{data.metrics.botDetections.toLocaleString()}</div>
        </Card>
        <Card className="p-4 bg-yellow-50">
          <div className="text-sm text-yellow-600">Active Blacklist</div>
          <div className="text-2xl font-bold text-yellow-600">{data.metrics.activeBlacklist.toLocaleString()}</div>
        </Card>
        <Card className="p-4 bg-green-50">
          <div className="text-sm text-green-600">Active Whitelist</div>
          <div className="text-2xl font-bold text-green-600">{data.metrics.activeWhitelist.toLocaleString()}</div>
        </Card>
      </div>

      {/* Events by Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-4">
          <h2 className="text-xl font-bold mb-4">Events by Type</h2>
          <div className="space-y-2">
            {data.eventsByType.map((event) => (
              <div key={event.type} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm">{event.type.replace(/_/g, ' ')}</span>
                <span className="font-bold">{event.count.toLocaleString()}</span>
              </div>
            ))}
            {data.eventsByType.length === 0 && (
              <div className="text-gray-500 text-sm">No events in this time period</div>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-xl font-bold mb-4">Events by Severity</h2>
          <div className="space-y-2">
            {data.eventsBySeverity.map((event) => (
              <div key={event.severity} className={`flex justify-between items-center p-2 rounded ${getSeverityColor(event.severity)}`}>
                <span className="text-sm font-medium capitalize">{event.severity}</span>
                <span className="font-bold">{event.count.toLocaleString()}</span>
              </div>
            ))}
            {data.eventsBySeverity.length === 0 && (
              <div className="text-gray-500 text-sm">No events in this time period</div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Critical Events */}
      <Card className="p-4 mb-6">
        <h2 className="text-xl font-bold mb-4">Recent Critical Events</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left text-sm font-medium">IP Address</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Event Type</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Severity</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Endpoint</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Time</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentCriticalEvents.map((event) => (
                <tr key={event.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-mono">{event.ipAddress}</td>
                  <td className="px-4 py-2 text-sm">{event.eventType.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(event.severity)}`}>
                      {event.severity}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm font-mono text-xs">{event.endpoint || '-'}</td>
                  <td className="px-4 py-2 text-sm">{new Date(event.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${event.resolved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {event.resolved ? 'Resolved' : 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
              {data.recentCriticalEvents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                    No critical events in this time period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Blacklisted IPs */}
      <Card className="p-4">
        <h2 className="text-xl font-bold mb-4">Active Blacklisted IPs</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left text-sm font-medium">IP Address</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Reason</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Severity</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Block Count</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Created</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Expires</th>
              </tr>
            </thead>
            <tbody>
              {data.blacklistedIPs.map((ip) => (
                <tr key={ip.ipAddress} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-mono">{ip.ipAddress}</td>
                  <td className="px-4 py-2 text-sm">{ip.reason}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(ip.severity)}`}>
                      {ip.severity}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-center">{ip.blockCount}</td>
                  <td className="px-4 py-2 text-sm">{new Date(ip.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-sm">
                    {ip.expiresAt ? new Date(ip.expiresAt).toLocaleDateString() : 'Never'}
                  </td>
                </tr>
              ))}
              {data.blacklistedIPs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                    No blacklisted IPs
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
