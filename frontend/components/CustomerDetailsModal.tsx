import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Phone, Mail, MapPin, Calendar, User, FileText, DollarSign, CreditCard } from 'lucide-react';
import { AddContactModal } from './AddContactModal';
import { AddPurchaseModal } from './AddPurchaseModal';
import { AddPaymentModal } from './AddPaymentModal';
import backend from '~backend/client';
import type { Customer, ContactHistory, PurchaseHistory, PaymentHistory } from '~backend/crm/types';

interface CustomerDetailsModalProps {
  customer: Customer;
  onClose: () => void;
}

export function CustomerDetailsModal({ customer, onClose }: CustomerDetailsModalProps) {
  const [contactHistory, setContactHistory] = useState<ContactHistory[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadHistories();
  }, [customer.id]);

  const loadHistories = async () => {
    setLoading(true);
    try {
      const [contacts, purchases, payments] = await Promise.all([
        backend.crm.listContactHistory({ customer_id: customer.id }),
        backend.crm.listPurchaseHistory({ customer_id: customer.id }),
        backend.crm.listPaymentHistory({ customer_id: customer.id })
      ]);

      setContactHistory(contacts.contacts);
      setPurchaseHistory(purchases.purchases);
      setPaymentHistory(payments.payments);
    } catch (error) {
      console.error('Error loading histories:', error);
      toast({
        title: "Error",
        description: "Failed to load customer history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString();
  };

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl min-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{customer.name}</span>
              <div className="space-x-2">
                <Badge className={getStageColor(customer.stage)}>
                  {customer.stage.replace('_', ' ')}
                </Badge>
                <Badge className={getLevelColor(customer.level)}>
                  {customer.level}
                </Badge>
              </div>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="contact">Contact History</TabsTrigger>
              <TabsTrigger value="purchase">Purchase History</TabsTrigger>
              <TabsTrigger value="payment">Payment History</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{customer.name}</span>
                    </div>
                    
                    {customer.company_name && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Company:</span>
                        <span>{customer.company_name}</span>
                      </div>
                    )}

                    {customer.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{customer.phone}</span>
                      </div>
                    )}

                    {customer.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>{customer.email}</span>
                      </div>
                    )}

                    {customer.address && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{customer.address}</span>
                      </div>
                    )}

                    {customer.appointment_date && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>Appointment: {formatDateTime(customer.appointment_date)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Business Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Business Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-500">Type:</span>
                      <span className="ml-2 capitalize">{customer.customer_type}</span>
                    </div>

                    {customer.business_type && (
                      <div>
                        <span className="text-sm text-gray-500">Business Type:</span>
                        <span className="ml-2">{customer.business_type}</span>
                      </div>
                    )}

                    <div>
                      <span className="text-sm text-gray-500">Products:</span>
                      <div className="mt-1 space-x-1">
                        {customer.products.map((product) => (
                          <Badge key={product} variant="outline">{product}</Badge>
                        ))}
                      </div>
                    </div>

                    {customer.scale && (
                      <div>
                        <span className="text-sm text-gray-500">Scale:</span>
                        <span className="ml-2">{customer.scale}</span>
                      </div>
                    )}

                    {customer.province_city && (
                      <div>
                        <span className="text-sm text-gray-500">Province/City:</span>
                        <span className="ml-2">{customer.province_city}</span>
                      </div>
                    )}

                    {customer.customer_source && (
                      <div>
                        <span className="text-sm text-gray-500">Source:</span>
                        <span className="ml-2">{customer.customer_source}</span>
                      </div>
                    )}

                    {customer.staff_in_charge_name && (
                      <div>
                        <span className="text-sm text-gray-500">Staff in Charge:</span>
                        <span className="ml-2">{customer.staff_in_charge_name}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Feedback and Notes */}
                {(customer.customer_feedback || customer.notes) && (
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Feedback & Notes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {customer.customer_feedback && (
                        <div>
                          <span className="text-sm text-gray-500 block mb-1">Customer Feedback:</span>
                          <p className="text-sm bg-gray-50 p-3 rounded">{customer.customer_feedback}</p>
                        </div>
                      )}

                      {customer.notes && (
                        <div>
                          <span className="text-sm text-gray-500 block mb-1">Notes:</span>
                          <p className="text-sm bg-gray-50 p-3 rounded">{customer.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Contact History</h3>
                <Button onClick={() => setShowAddContact(true)}>
                  Add Contact
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : contactHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No contact history</div>
              ) : (
                <div className="space-y-3">
                  {contactHistory.map((contact) => (
                    <Card key={contact.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{contact.contact_type}</span>
                              {contact.staff_name && (
                                <span className="text-sm text-gray-500">by {contact.staff_name}</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{formatDateTime(contact.contact_date)}</p>
                            {contact.notes && (
                              <p className="text-sm mt-2">{contact.notes}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="purchase" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Purchase History</h3>
                <Button onClick={() => setShowAddPurchase(true)}>
                  Add Purchase
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : purchaseHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No purchase history</div>
              ) : (
                <div className="space-y-3">
                  {purchaseHistory.map((purchase) => (
                    <Card key={purchase.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="font-medium">{purchase.product}</span>
                              <span className="text-lg font-semibold text-green-600">
                                {formatCurrency(purchase.amount)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{formatDate(purchase.purchase_date)}</p>
                            {purchase.notes && (
                              <p className="text-sm mt-2">{purchase.notes}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="payment" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Payment History</h3>
                <Button onClick={() => setShowAddPayment(true)}>
                  Add Payment
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : paymentHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No payment history</div>
              ) : (
                <div className="space-y-3">
                  {paymentHistory.map((payment) => (
                    <Card key={payment.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2">
                              <CreditCard className="h-4 w-4 text-blue-600" />
                              <span className="text-lg font-semibold text-blue-600">
                                {formatCurrency(payment.amount)}
                              </span>
                              {payment.payment_method && (
                                <span className="text-sm text-gray-500">via {payment.payment_method}</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{formatDate(payment.payment_date)}</p>
                            {payment.notes && (
                              <p className="text-sm mt-2">{payment.notes}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Add Modals */}
      {showAddContact && (
        <AddContactModal
          customerId={customer.id}
          onClose={() => setShowAddContact(false)}
          onSuccess={() => {
            setShowAddContact(false);
            loadHistories();
          }}
        />
      )}

      {showAddPurchase && (
        <AddPurchaseModal
          customerId={customer.id}
          onClose={() => setShowAddPurchase(false)}
          onSuccess={() => {
            setShowAddPurchase(false);
            loadHistories();
          }}
        />
      )}

      {showAddPayment && (
        <AddPaymentModal
          customerId={customer.id}
          onClose={() => setShowAddPayment(false)}
          onSuccess={() => {
            setShowAddPayment(false);
            loadHistories();
          }}
        />
      )}
    </>
  );
}
