'use client'

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  Package,
  Users,
  DollarSign,
  RefreshCw,
  FileSpreadsheet,
  FileBarChart,
  ShoppingCart,
  Store,
  CreditCard,
  Truck,
  RotateCcw,
  Receipt
} from "lucide-react";

const reportTypes = [
  { value: 'sales', label: 'Sales Report', icon: ShoppingCart, description: 'Daily, weekly, and monthly sales analytics' },
  { value: 'vendor-performance', label: 'Vendor Performance', icon: Store, description: 'Vendor sales, commissions, and ratings' },
  { value: 'product-performance', label: 'Product Performance', icon: Package, description: 'Product sales, views, and conversion rates' },
  { value: 'customer-acquisition', label: 'Customer Acquisition', icon: Users, description: 'New customer registrations and conversions' },
  { value: 'refunds', label: 'Refund & Returns', icon: RotateCcw, description: 'Refund requests and reasons' },
  { value: 'shipping', label: 'Shipping Performance', icon: Truck, description: 'Delivery times and courier performance' },
  { value: 'payment-gateway', label: 'Payment Gateway', icon: CreditCard, description: 'Payment success rates and methods' },
  { value: 'inventory-aging', label: 'Inventory Aging', icon: Package, description: 'Stock age and slow-moving items' },
  { value: 'tax', label: 'Tax Report', icon: Receipt, description: 'Tax collection for Ethiopian authorities' },
  { value: 'financial', label: 'Financial Summary', icon: DollarSign, description: 'Revenue, refunds, and net income' },
];

const exportFormats = [
  { value: 'json', label: 'JSON (Preview)', icon: FileText },
  { value: 'csv', label: 'CSV', icon: FileSpreadsheet },
  { value: 'excel', label: 'Excel (XLSX)', icon: FileBarChart },
  { value: 'pdf', label: 'PDF', icon: FileText },
];

const periodOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export default function AdminReportsDashboard() {
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState('sales');
  const [selectedFormat, setSelectedFormat] = useState('json');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const handleGenerateReport = async () => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams({
        type: selectedReport,
        format: selectedFormat,
      });

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedPeriod) params.append('period', selectedPeriod);

      const response = await fetch(`/api/admin/reports?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      // Handle different export formats
      if (selectedFormat === 'json') {
        const data = await response.json();
        setReportData(data);
        toast({
          title: "Report Generated",
          description: "Report data loaded successfully",
        });
      } else {
        // Download file for CSV, Excel, PDF
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        let extension = selectedFormat;
        if (selectedFormat === 'excel') extension = 'xlsx';
        
        a.download = `${selectedReport}-report-${new Date().toISOString().split('T')[0]}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Report Downloaded",
          description: `${selectedFormat.toUpperCase()} file has been downloaded`,
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedReportInfo = reportTypes.find(r => r.value === selectedReport);
  const ReportIcon = selectedReportInfo?.icon || FileText;

  return (
    <>
      <Navbar />
      <Container className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Reporting Dashboard</h1>
          <p className="text-muted-foreground">
            Generate comprehensive reports for sales, inventory, customers, vendors, and more
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Configuration */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Report Configuration</CardTitle>
                <CardDescription>Select report type and export format</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Report Type */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Report Type</label>
                  <Select value={selectedReport} onValueChange={setSelectedReport}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedReportInfo && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedReportInfo.description}
                    </p>
                  )}
                </div>

                {/* Export Format */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Export Format</label>
                  <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {exportFormats.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          <div className="flex items-center gap-2">
                            <format.icon className="h-4 w-4" />
                            {format.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Period Aggregation (for applicable reports) */}
                {(['sales', 'customer-acquisition'].includes(selectedReport)) && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Period Aggregation (Optional)</label>
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        {periodOptions.map((period) => (
                          <SelectItem key={period.value} value={period.value}>
                            {period.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Date Range */}
                <div>
                  <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date Range (Optional)
                  </label>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Start Date"
                    />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="End Date"
                    />
                  </div>
                </div>

                {/* Generate Button */}
                <Button 
                  onClick={handleGenerateReport} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Generate Report
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Report Preview / Information */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ReportIcon className="h-5 w-5" />
                  {selectedReportInfo?.label || 'Report Preview'}
                </CardTitle>
                <CardDescription>
                  {reportData ? 'Report data preview' : 'Configure and generate a report to see results'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reportData ? (
                  <div className="space-y-4">
                    {/* Summary Section */}
                    {reportData.data?.summary && (
                      <div>
                        <h3 className="font-semibold mb-2">Summary</h3>
                        <div className="bg-muted p-4 rounded-md">
                          <pre className="text-sm overflow-auto">
                            {JSON.stringify(reportData.data.summary, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Data Preview */}
                    <div>
                      <h3 className="font-semibold mb-2">Data Preview</h3>
                      <div className="bg-muted p-4 rounded-md max-h-96 overflow-auto">
                        <pre className="text-xs">
                          {JSON.stringify(reportData.data, null, 2)}
                        </pre>
                      </div>
                    </div>

                    {/* Report Metadata */}
                    <div className="text-sm text-muted-foreground">
                      Generated at: {new Date(reportData.generatedAt).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No report generated yet</p>
                    <p className="text-sm mt-2">
                      Select a report type and click "Generate Report" to view data
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available Reports Grid */}
            {!reportData && (
              <div className="mt-6">
                <h3 className="font-semibold mb-4">Available Reports</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reportTypes.map((type) => (
                    <Card 
                      key={type.value}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedReport === type.value ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedReport(type.value)}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {type.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
      <Footer />
    </>
  );
}
