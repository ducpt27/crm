import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Search, Filter, Download, Edit, Phone, Mail, Calendar, FileText } from 'lucide-react';
import { CustomerDetailsModal } from './CustomerDetailsModal';
import { EditCustomerModal } from './EditCustomerModal';
import backend from '~backend/client';
import type { Customer, User } from '~backend/crm/types';

interface CustomerListProps {
  user: User;
}

export function CustomerList({ user }: CustomerListProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    customer_type: '',
    stage: '',
    level: '',
    contact_status: ''
  });
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: 20,
        sort_by: sortBy,
        sort_order: sortOrder
      };

      // Add staff filter for sales users
      if (user.role === 'sales') {
        params.staff_id = user.id;
      }

      // Add search and filters
      if (search.trim()) params.search = search.trim();
      if (filters.customer_type) params.customer_type = filters.customer_type;
      if (filters.stage) params.stage = filters.stage;
      if (filters.level) params.level = filters.level;
      if (filters.contact_status) params.contact_status = filters.contact_status;

      const response = await backend.crm.listCustomers(params);
      setCustomers(response.customers);
      setTotalPages(response.total_pages);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [page, sortBy, sortOrder, search, filters, user.id, user.role]);

  const handleExport = async () => {
    try {
      const response = await backend.crm.exportCustomers();
      const blob = new Blob([response.csv_data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Customer data exported successfully",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: "Failed to export customer data",
        variant: "destructive",
      });
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'care': return 'bg-blue-100 text-blue-800';
      case 'send_quote': return 'bg-yellow-100 text-yellow-800';
      case 'consideration': return 'bg-orange-100 text-orange-800';
      case 'purchase': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'cold': return 'bg-blue-100 text-blue-800';
      case 'warm': return 'bg-yellow-100 text-yellow-800';
      case 'hot': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {user.role === 'admin' ? 'All Customers' : 'My Customers'}
        </h2>
        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search customers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filters.customer_type} onValueChange={(value) => setFilters(prev => ({ ...prev, customer_type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Customer Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.stage} onValueChange={(value) => setFilters(prev => ({ ...prev, stage: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="care">Care</SelectItem>
                <SelectItem value="send_quote">Send Quote</SelectItem>
                <SelectItem value="consideration">Consideration</SelectItem>
                <SelectItem value="purchase">Purchase</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.level} onValueChange={(value) => setFilters(prev => ({ ...prev, level: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="cold">Cold</SelectItem>
                <SelectItem value="warm">Warm</SelectItem>
                <SelectItem value="hot">Hot</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.contact_status} onValueChange={(value) => setFilters(prev => ({ ...prev, contact_status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Contact Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="not_called">Not Called</SelectItem>
                <SelectItem value="called">Called</SelectItem>
                <SelectItem value="following">Following</SelectItem>
                <SelectItem value="unreachable">Unreachable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading customers...</p>
        </div>
      ) : customers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">No customers found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {customers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Customer Info */}
                  <div className="lg:col-span-3">
                    <h3 className="font-semibold text-lg text-gray-900">{customer.name}</h3>
                    {customer.company_name && (
                      <p className="text-sm text-gray-600">{customer.company_name}</p>
                    )}
                    <div className="flex items-center space-x-2 mt-2">
                      {customer.phone && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone className="h-3 w-3 mr-1" />
                          {customer.phone}
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="h-3 w-3 mr-1" />
                          {customer.email}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="lg:col-span-2 space-y-2">
                    <Badge className={getStageColor(customer.stage)}>
                      {customer.stage.replace('_', ' ')}
                    </Badge>
                    <br />
                    <Badge className={getLevelColor(customer.level)}>
                      {customer.level}
                    </Badge>
                  </div>

                  {/* Customer Details */}
                  <div className="lg:col-span-3 text-sm space-y-1">
                    <p><span className="font-medium">Type:</span> {customer.customer_type}</p>
                    <p><span className="font-medium">Products:</span> {customer.products.join(', ')}</p>
                    {customer.staff_in_charge_name && (
                      <p><span className="font-medium">Staff:</span> {customer.staff_in_charge_name}</p>
                    )}
                  </div>

                  {/* Latest Contact */}
                  <div className="lg:col-span-2 text-sm">
                    {customer.latest_contact ? (
                      <div>
                        <p className="font-medium">Latest Contact:</p>
                        <p>{formatDate(customer.latest_contact.contact_date)}</p>
                        <p className="text-gray-600">{customer.latest_contact.contact_type}</p>
                      </div>
                    ) : (
                      <p className="text-gray-500">No contact history</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="lg:col-span-2 flex flex-col space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingCustomer(customer)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    {customer.appointment_date && (
                      <div className="flex items-center text-xs text-orange-600">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(customer.appointment_date)}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Modals */}
      {selectedCustomer && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
      
      {editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          user={user}
          onClose={() => setEditingCustomer(null)}
          onSuccess={() => {
            setEditingCustomer(null);
            loadCustomers();
          }}
        />
      )}
    </div>
  );
}
