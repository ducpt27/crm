import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import type { User } from '~backend/crm/types';

interface AddContactModalProps {
  customerId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddContactModal({ customerId, onClose, onSuccess }: AddContactModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    contact_type: '',
    notes: '',
    staff_id: '',
    contact_date: new Date().toISOString().slice(0, 16)
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await backend.crm.listUsers();
      setUsers(response.users);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.contact_type.trim()) {
      toast({
        title: "Error",
        description: "Contact type is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await backend.crm.createContact({
        customer_id: customerId,
        contact_type: formData.contact_type,
        notes: formData.notes || undefined,
        staff_id: formData.staff_id ? parseInt(formData.staff_id) : undefined,
        contact_date: new Date(formData.contact_date)
      });
      
      toast({
        title: "Success",
        description: "Contact recorded successfully",
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error creating contact:', error);
      toast({
        title: "Error",
        description: "Failed to record contact",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Contact History</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Contact Type *</label>
            <Input
              value={formData.contact_type}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_type: e.target.value }))}
              placeholder="e.g., Phone call, Email, Meeting"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Contact Date</label>
            <Input
              type="datetime-local"
              value={formData.contact_date}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_date: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Staff Member</label>
            <Select value={formData.staff_id} onValueChange={(value) => setFormData(prev => ({ ...prev, staff_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>{user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Contact details and notes"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Contact"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
