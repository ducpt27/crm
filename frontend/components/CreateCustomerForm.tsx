import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { UserPlus } from 'lucide-react';
import backend from '~backend/client';
import type { User } from '~backend/crm/types';
import { AVAILABLE_PRODUCTS } from '~backend/crm/types';

interface CreateCustomerFormProps {
  onSuccess: () => void;
  user: User;
}

export function CreateCustomerForm({ onSuccess, user }: CreateCustomerFormProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    company_name: '',
    customer_type: 'individual' as const,
    business_type: '',
    products: [] as string[],
    scale: '',
    province_city: '',
    customer_source: '',
    staff_in_charge_id: user.role === 'sales' ? user.id.toString() : '',
    stage: 'care' as const,
    level: 'cold' as const,
    contact_status: 'not_called' as const,
    customer_feedback: '',
    notes: '',
    appointment_date: '',
    appointment_reminder: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user.role === 'admin') {
      loadUsers();
    }
  }, [user.role]);

  const loadUsers = async () => {
    try {
      const response = await backend.crm.listUsers();
      setUsers(response.users.filter(user => user.role === 'sales'));
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleProductChange = (product: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      products: checked
        ? [...prev.products, product]
        : prev.products.filter(p => p !== product)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Customer name is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        staff_in_charge_id: formData.staff_in_charge_id ? parseInt(formData.staff_in_charge_id) : undefined,
        appointment_date: formData.appointment_date ? new Date(formData.appointment_date) : undefined
      };

      await backend.crm.createCustomer(submitData);
      
      toast({
        title: "Success",
        description: "Customer created successfully",
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error creating customer:', error);
      toast({
        title: "Error",
        description: "Failed to create customer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserPlus className="h-5 w-5" />
          <span>Add New Customer</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Customer Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Company Name</label>
              <Input
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Address</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
          </div>

          {/* Customer Classification */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Customer Type</label>
              <Select value={formData.customer_type} onValueChange={(value) => setFormData(prev => ({ ...prev, customer_type: value as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Business Type</label>
              <Input
                value={formData.business_type}
                onChange={(e) => setFormData(prev => ({ ...prev, business_type: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Scale</label>
              <Input
                value={formData.scale}
                onChange={(e) => setFormData(prev => ({ ...prev, scale: e.target.value }))}
              />
            </div>
          </div>

          {/* Products */}
          <div>
            <label className="block text-sm font-medium mb-2">Products</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {AVAILABLE_PRODUCTS.map((product) => (
                <div key={product} className="flex items-center space-x-2">
                  <Checkbox
                    id={product}
                    checked={formData.products.includes(product)}
                    onCheckedChange={(checked) => handleProductChange(product, checked as boolean)}
                  />
                  <label htmlFor={product} className="text-sm">{product}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Location and Source */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Province/City</label>
              <Input
                value={formData.province_city}
                onChange={(e) => setFormData(prev => ({ ...prev, province_city: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Customer Source</label>
              <Input
                value={formData.customer_source}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_source: e.target.value }))}
              />
            </div>
          </div>

          {/* Assignment and Status */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Assign to Staff</label>
              {user.role === 'sales' ? (
                <Input
                  value={user.name}
                  disabled
                  className="bg-gray-50"
                />
              ) : (
                <Select value={formData.staff_in_charge_id} onValueChange={(value) => setFormData(prev => ({ ...prev, staff_in_charge_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Stage</label>
              <Select value={formData.stage} onValueChange={(value) => setFormData(prev => ({ ...prev, stage: value as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="care">Care</SelectItem>
                  <SelectItem value="send_quote">Send Quote</SelectItem>
                  <SelectItem value="consideration">Consideration</SelectItem>
                  <SelectItem value="purchase">Purchase</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Level</label>
              <Select value={formData.level} onValueChange={(value) => setFormData(prev => ({ ...prev, level: value as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cold">Cold</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Contact Status</label>
              <Select value={formData.contact_status} onValueChange={(value) => setFormData(prev => ({ ...prev, contact_status: value as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_called">Not Called</SelectItem>
                  <SelectItem value="called">Called</SelectItem>
                  <SelectItem value="following">Following</SelectItem>
                  <SelectItem value="unreachable">Unreachable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Appointment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Appointment Date</label>
              <Input
                type="datetime-local"
                value={formData.appointment_date}
                onChange={(e) => setFormData(prev => ({ ...prev, appointment_date: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Appointment Reminder</label>
              <Input
                value={formData.appointment_reminder}
                onChange={(e) => setFormData(prev => ({ ...prev, appointment_reminder: e.target.value }))}
                placeholder="Reminder note"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Customer Feedback</label>
              <Textarea
                value={formData.customer_feedback}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_feedback: e.target.value }))}
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onSuccess}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Customer"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
