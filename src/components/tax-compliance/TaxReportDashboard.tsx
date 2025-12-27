'use client'

import { useState } from 'react';
import { Download, Calendar, FileText, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { formatEthiopianTIN } from '@/lib/ethiopian-tax';

interface TaxReportDashboardProps {
  vendorId?: string;
}

interface TaxReport {
  vendor: {
    id: string;
    displayName: string;
    tinNumber?: string;
    tradeLicense?: string;
  };
  period: {
    startDate: string;
    endDate: string;
    periodType: string;
  };
  summary: {
    totalSales: number;
    taxableAmount: number;
    vatCollected: number;
    withholdingTaxDeducted: number;
    netTaxLiability: number;
  };
  breakdown: Array<{
    category: string;
    totalSales: number;
    vatCollected: number;
    itemCount: number;
  }>;
  metadata: {
    totalOrders: number;
    totalItems: number;
    generatedAt: string;
  };
}

export function TaxReportDashboard({ vendorId }: TaxReportDashboardProps) {
  const [periodType, setPeriodType] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState<TaxReport | null>(null);
  const [loading, setLoading] = useState(false);

  // Set default date range based on period type
  const setDefaultDates = (type: 'monthly' | 'quarterly' | 'annual') => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let start: Date;

    switch (type) {
      case 'monthly':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        break;
      case 'quarterly':
        start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'annual':
        start = new Date(now.getFullYear() - 1, 0, 1);
        break;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const handlePeriodTypeChange = (value: 'monthly' | 'quarterly' | 'annual') => {
    setPeriodType(value);
    setDefaultDates(value);
  };

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select start and end dates');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        periodType,
      });

      const response = await fetch(`/api/vendors/tax-report?${params}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate report');
      }

      const data = await response.json();
      setReport(data);
      toast.success('Tax report generated successfully');
    } catch (error) {
      console.error('Error generating tax report:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!report) return;

    const csvRows = [
      ['Ethiopian Tax Report'],
      [''],
      ['Vendor Information'],
      ['Name', report.vendor.displayName],
      ['TIN', report.vendor.tinNumber ? formatEthiopianTIN(report.vendor.tinNumber) : 'N/A'],
      ['Trade License', report.vendor.tradeLicense || 'N/A'],
      [''],
      ['Period Information'],
      ['Period Type', report.period.periodType],
      ['Start Date', new Date(report.period.startDate).toLocaleDateString()],
      ['End Date', new Date(report.period.endDate).toLocaleDateString()],
      [''],
      ['Summary'],
      ['Total Sales (ETB)', report.summary.totalSales.toFixed(2)],
      ['Taxable Amount (ETB)', report.summary.taxableAmount.toFixed(2)],
      ['VAT Collected (ETB)', report.summary.vatCollected.toFixed(2)],
      ['Withholding Tax Deducted (ETB)', report.summary.withholdingTaxDeducted.toFixed(2)],
      ['Net Tax Liability (ETB)', report.summary.netTaxLiability.toFixed(2)],
      [''],
      ['Category Breakdown'],
      ['Category', 'Total Sales (ETB)', 'VAT Collected (ETB)', 'Item Count'],
      ...report.breakdown.map(item => [
        item.category,
        item.totalSales.toFixed(2),
        item.vatCollected.toFixed(2),
        item.itemCount.toString()
      ]),
      [''],
      ['Metadata'],
      ['Total Orders', report.metadata.totalOrders.toString()],
      ['Total Items', report.metadata.totalItems.toString()],
      ['Generated At', new Date(report.metadata.generatedAt).toLocaleString()],
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax-report-${startDate}-${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Ethiopian Tax Compliance Report
          </CardTitle>
          <CardDescription>
            Generate tax reports for Ethiopian tax authorities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="periodType">Period Type</Label>
              <Select value={periodType} onValueChange={handlePeriodTypeChange}>
                <SelectTrigger id="periodType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={generateReport} disabled={loading || !startDate || !endDate}>
              <Calendar className="w-4 h-4 mr-2" />
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
            {report && (
              <Button onClick={exportToCSV} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {report && (
        <>
          {/* Vendor Information */}
          <Card>
            <CardHeader>
              <CardTitle>Vendor Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Business Name</p>
                <p className="font-semibold">{report.vendor.displayName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">TIN</p>
                <p className="font-semibold">
                  {report.vendor.tinNumber ? formatEthiopianTIN(report.vendor.tinNumber) : 'Not provided'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trade License</p>
                <p className="font-semibold">{report.vendor.tradeLicense || 'Not provided'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Tax Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Tax Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <p className="text-2xl font-bold">{report.summary.totalSales.toFixed(2)} ETB</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-sm text-muted-foreground">Taxable Amount</p>
                  <p className="text-2xl font-bold">{report.summary.taxableAmount.toFixed(2)} ETB</p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <p className="text-sm text-muted-foreground">VAT Collected (15%)</p>
                  <p className="text-2xl font-bold">{report.summary.vatCollected.toFixed(2)} ETB</p>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <p className="text-sm text-muted-foreground">Withholding Tax</p>
                  <p className="text-2xl font-bold">{report.summary.withholdingTaxDeducted.toFixed(2)} ETB</p>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                  <p className="text-sm text-muted-foreground">Net Tax Liability</p>
                  <p className="text-2xl font-bold">{report.summary.netTaxLiability.toFixed(2)} ETB</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{report.metadata.totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Category</th>
                      <th className="text-right py-2">Total Sales</th>
                      <th className="text-right py-2">VAT Collected</th>
                      <th className="text-right py-2">Items</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.breakdown.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 capitalize">{item.category.replace(/-/g, ' ')}</td>
                        <td className="text-right py-2">{item.totalSales.toFixed(2)} ETB</td>
                        <td className="text-right py-2">{item.vatCollected.toFixed(2)} ETB</td>
                        <td className="text-right py-2">{item.itemCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
