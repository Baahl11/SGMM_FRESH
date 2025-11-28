'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface Seller {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  active: boolean;
  created_at: string;
}

interface PendingPayment {
  id: string;
  seller_id: string;
  seller_name: string;
  customer_email: string;
  customer_name: string;
  month_number: number;
  billing_date: string;
  commission_stage: string;
  gross_amount: number;
  commission_amount: number;
  stripe_invoice_id: string | null;
}

interface SellerSummary {
  seller_id: string;
  seller_name: string;
  seller_email: string | null;
  total_sales: number;
  commissions_earned: number;
  pending_amount: number;
  paid_amount: number;
  total_commission_amount: number;
}

export default function SellerPaymentsAdmin() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');

  // Data states
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [sellerSummary, setSellerSummary] = useState<SellerSummary[]>([]);
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());

  // Form states
  const [newSeller, setNewSeller] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
  });

  // Check if user is admin
  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // IMPORTANTE: Reemplaza este email con TU email de admin
      const ADMIN_EMAIL = 'gmelgarejom@gmail.com'; // ⚠️ CAMBIAR ESTO
      
      if (user.email !== ADMIN_EMAIL) {
        router.push('/dashboard');
        return;
      }

      setIsAdmin(true);
      setAdminEmail(user.email || '');
      loadData();
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.push('/dashboard');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load sellers
      const { data: sellersData, error: sellersError } = await supabase
        .from('sellers')
        .select('*')
        .order('name');

      if (sellersError) throw sellersError;
      setSellers(sellersData || []);

      // Load pending payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('pending_seller_payments')
        .select('*');

      if (paymentsError) throw paymentsError;
      setPendingPayments(paymentsData || []);

      // Load seller summary
      const { data: summaryData, error: summaryError } = await supabase
        .from('seller_commission_summary')
        .select('*');

      if (summaryError) throw summaryError;
      setSellerSummary(summaryData || []);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('sellers')
        .insert([{
          id: newSeller.id,
          name: newSeller.name,
          email: newSeller.email || null,
          phone: newSeller.phone || null,
          active: true,
        }]);

      if (error) throw error;

      alert('Vendedor creado exitosamente');
      setNewSeller({ id: '', name: '', email: '', phone: '' });
      loadData();
    } catch (error: any) {
      console.error('Error creating seller:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleToggleSellerStatus = async (sellerId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('sellers')
        .update({ active: !currentStatus })
        .eq('id', sellerId);

      if (error) throw error;

      loadData();
    } catch (error: any) {
      console.error('Error toggling seller:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleDeleteSeller = async (sellerId: string, sellerName: string) => {
    if (!confirm(`¿Eliminar vendedor "${sellerName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('sellers')
        .delete()
        .eq('id', sellerId);

      if (error) throw error;

      alert('Vendedor eliminado exitosamente');
      loadData();
    } catch (error: any) {
      console.error('Error deleting seller:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleMarkAsPaid = async (paymentIds: string[]) => {
    if (!confirm(`¿Marcar ${paymentIds.length} comisión(es) como pagada(s)?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('seller_commissions')
        .update({
          paid_to_seller: true,
          payment_date: new Date().toISOString(),
          payment_method: 'bank_transfer', // Puedes cambiar esto
        })
        .in('id', paymentIds);

      if (error) throw error;

      alert('Comisiones marcadas como pagadas');
      setSelectedPayments(new Set());
      loadData();
    } catch (error: any) {
      console.error('Error marking as paid:', error);
      alert('Error: ' + error.message);
    }
  };

  const togglePaymentSelection = (paymentId: string) => {
    const newSelection = new Set(selectedPayments);
    if (newSelection.has(paymentId)) {
      newSelection.delete(paymentId);
    } else {
      newSelection.add(paymentId);
    }
    setSelectedPayments(newSelection);
  };

  const selectAllPayments = () => {
    if (selectedPayments.size === pendingPayments.length) {
      setSelectedPayments(new Set());
    } else {
      setSelectedPayments(new Set(pendingPayments.map(p => p.id)));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const totalPending = pendingPayments.reduce((sum, p) => sum + p.commission_amount, 0);
  const selectedTotal = Array.from(selectedPayments)
    .map(id => pendingPayments.find(p => p.id === id)?.commission_amount || 0)
    .reduce((sum, amount) => sum + amount, 0);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Panel de Comisiones de Vendedores</h1>
        <p className="text-gray-600">Admin: {adminEmail}</p>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="pending">
            Pagos Pendientes
            {pendingPayments.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingPayments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sellers">Vendedores</TabsTrigger>
          <TabsTrigger value="summary">Resumen</TabsTrigger>
        </TabsList>

        {/* Tab: Pending Payments */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Comisiones Pendientes de Pago</CardTitle>
                  <CardDescription>
                    Total pendiente: {formatCurrency(totalPending)}
                  </CardDescription>
                </div>
                {selectedPayments.size > 0 && (
                  <Button
                    onClick={() => handleMarkAsPaid(Array.from(selectedPayments))}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Marcar {selectedPayments.size} como pagadas ({formatCurrency(selectedTotal)})
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {pendingPayments.length === 0 ? (
                <p className="text-center py-8 text-gray-500">
                  ✅ No hay comisiones pendientes de pago
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 rounded">
                    <Checkbox
                      checked={selectedPayments.size === pendingPayments.length}
                      onCheckedChange={selectAllPayments}
                    />
                    <span className="text-sm font-medium">Seleccionar todas</span>
                  </div>

                  {pendingPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <Checkbox
                        checked={selectedPayments.has(payment.id)}
                        onCheckedChange={() => togglePaymentSelection(payment.id)}
                      />
                      
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Vendedor</p>
                          <p className="font-medium">{payment.seller_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Cliente</p>
                          <p className="font-medium">{payment.customer_name || payment.customer_email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Fecha de cobro</p>
                          <p>{formatDate(payment.billing_date)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Mes #</p>
                          <Badge variant={payment.month_number === 2 ? 'default' : 'secondary'}>
                            Mes {payment.month_number}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Comisión</p>
                          <p className="font-bold text-green-600">
                            {formatCurrency(payment.commission_amount)}
                          </p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleMarkAsPaid([payment.id])}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Pagar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Sellers Management */}
        <TabsContent value="sellers" className="space-y-4">
          {/* Create New Seller */}
          <Card>
            <CardHeader>
              <CardTitle>Agregar Nuevo Vendedor</CardTitle>
              <CardDescription>
                El ID debe ser único, ej: vendedor-roberto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSeller} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="seller-id">ID del Vendedor *</Label>
                  <Input
                    id="seller-id"
                    value={newSeller.id}
                    onChange={(e) => setNewSeller({ ...newSeller, id: e.target.value })}
                    placeholder="vendedor-roberto"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="seller-name">Nombre *</Label>
                  <Input
                    id="seller-name"
                    value={newSeller.name}
                    onChange={(e) => setNewSeller({ ...newSeller, name: e.target.value })}
                    placeholder="Roberto García"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="seller-email">Email</Label>
                  <Input
                    id="seller-email"
                    type="email"
                    value={newSeller.email}
                    onChange={(e) => setNewSeller({ ...newSeller, email: e.target.value })}
                    placeholder="roberto@distribuidora.com"
                  />
                </div>
                <div>
                  <Label htmlFor="seller-phone">Teléfono</Label>
                  <Input
                    id="seller-phone"
                    value={newSeller.phone}
                    onChange={(e) => setNewSeller({ ...newSeller, phone: e.target.value })}
                    placeholder="+52 55 1234 5678"
                  />
                </div>
                <Button type="submit" className="md:col-span-4">
                  Crear Vendedor
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Sellers List */}
          <Card>
            <CardHeader>
              <CardTitle>Vendedores ({sellers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sellers.map((seller) => (
                  <div
                    key={seller.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{seller.name}</p>
                        <Badge variant={seller.active ? 'default' : 'secondary'}>
                          {seller.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">ID: {seller.id}</p>
                      {seller.email && (
                        <p className="text-sm text-gray-600">📧 {seller.email}</p>
                      )}
                      {seller.phone && (
                        <p className="text-sm text-gray-600">📱 {seller.phone}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={seller.active ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => handleToggleSellerStatus(seller.id, seller.active)}
                      >
                        {seller.active ? 'Desactivar' : 'Activar'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteSeller(seller.id, seller.name)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Summary */}
        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Vendedores Activos</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{sellers.filter(s => s.active).length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Comisiones Pendientes</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-orange-600">{formatCurrency(totalPending)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Pagado</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(sellerSummary.reduce((sum, s) => sum + s.paid_amount, 0))}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resumen por Vendedor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sellerSummary.map((summary) => (
                  <div key={summary.seller_id} className="p-4 border rounded-lg">
                    <h3 className="font-bold text-lg mb-2">{summary.seller_name}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Ventas Totales</p>
                        <p className="font-bold">{summary.total_sales}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Comisiones Ganadas</p>
                        <p className="font-bold">{summary.commissions_earned}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Pendiente</p>
                        <p className="font-bold text-orange-600">
                          {formatCurrency(summary.pending_amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Pagado</p>
                        <p className="font-bold text-green-600">
                          {formatCurrency(summary.paid_amount)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
