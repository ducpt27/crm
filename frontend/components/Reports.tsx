import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { BarChart3, Download, Calendar, Users, Package, TrendingUp } from 'lucide-react';
import backend from '~backend/client';

interface StaffCustomerStats {
  staff_id: number;
  staff_name: string;
  customer_count: number;
}

interface CustomerInteractionStats {
  date: string;
  interaction_count: number;
}

interface CustomerTypeStats {
  customer_type: string;
  count: number;
}

interface ProductTypeStats {
  product: string;
  count: number;
}

interface ReportsData {
  staff_customer_stats: StaffCustomerStats[];
  interaction_stats: CustomerInteractionStats[];
  customer_type_stats: CustomerTypeStats[];
  product_type_stats: ProductTypeStats[];
}

export function Reports() {
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end_date: new Date().toISOString().split('T')[0]
  });
  const { toast } = useToast();

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await backend.crm.generateReports(dateRange);
      setReportsData(response);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = () => {
    loadReports();
  };

  const exportReport = (title: string, data: any[]) => {
    const csvContent = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading reports...</p>
      </div>
    );
  }

  if (!reportsData) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-500">No report data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <BarChart3 className="h-6 w-6 mr-2" />
          Reports & Analytics
        </h2>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <Input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <Input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </div>
            <div className="pt-6">
              <Button onClick={handleDateRangeChange}>
                Update Reports
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Customer Stats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Customers by Staff Member
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportReport('Staff Customer Stats', reportsData.staff_customer_stats)}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reportsData.staff_customer_stats.map((stat) => (
              <div key={stat.staff_id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{stat.staff_name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-blue-600">{stat.customer_count}</span>
                  <span className="text-sm text-gray-500">customers</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Customer Interaction Stats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Customer Interactions Over Time
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportReport('Customer Interaction Stats', reportsData.interaction_stats)}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {reportsData.interaction_stats.slice(-10).map((stat) => (
              <div key={stat.date} className="flex justify-between items-center p-2 border-b border-gray-100">
                <span className="text-sm">{new Date(stat.date).toLocaleDateString()}</span>
                <span className="font-medium">{stat.interaction_count} interactions</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Type Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Customers by Type
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportReport('Customer Type Stats', reportsData.customer_type_stats)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportsData.customer_type_stats.map((stat) => (
                <div key={stat.customer_type} className="flex justify-between items-center">
                  <span className="capitalize">{stat.customer_type}</span>
                  <span className="font-semibold">{stat.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Product Type Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Customers by Product
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportReport('Product Type Stats', reportsData.product_type_stats)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportsData.product_type_stats.map((stat) => (
                <div key={stat.product} className="flex justify-between items-center">
                  <span>{stat.product}</span>
                  <span className="font-semibold">{stat.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
