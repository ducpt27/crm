import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Users, FileText, UserPlus, BarChart3 } from 'lucide-react';
import { CustomerList } from './CustomerList';
import { CreateCustomerForm } from './CreateCustomerForm';
import { UserManagement } from './UserManagement';
import { Reports } from './Reports';
import type { User } from '~backend/crm/types';

interface CustomerDashboardProps {
  user: User;
  onLogout: () => void;
}

type ActiveTab = 'customers' | 'create' | 'users' | 'reports';

export function CustomerDashboard({ user, onLogout }: CustomerDashboardProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('customers');

  const navigation = [
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'create', label: 'Add Customer', icon: UserPlus },
    ...(user.role === 'admin' ? [
      { id: 'users', label: 'Users', icon: Users },
      { id: 'reports', label: 'Reports', icon: BarChart3 }
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">CRM System</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{user.name}</span>
                <span className="mx-2">•</span>
                <span className="capitalize">{user.role}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as ActiveTab)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === item.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'customers' && <CustomerList user={user} />}
        {activeTab === 'create' && <CreateCustomerForm user={user} onSuccess={() => setActiveTab('customers')} />}
        {activeTab === 'users' && user.role === 'admin' && <UserManagement />}
        {activeTab === 'reports' && user.role === 'admin' && <Reports />}
      </main>
    </div>
  );
}
