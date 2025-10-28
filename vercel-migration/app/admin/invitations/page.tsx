'use client';

/**
 * Admin Invitations Page
 * Manage client invitations
 */

import { useState, useEffect } from 'react';
import { Plus, Send, X, Copy, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { Invitation } from '@/lib/types/invitations';
import { INVITATION_STATUS_LABELS, INVITATION_STATUS_COLORS } from '@/lib/types/invitations';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminInvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/invitations');
      const data = await response.json();

      if (response.ok) {
        setInvitations(data.invitations || []);
      } else {
        toast.error(data.error || 'Error al cargar invitaciones');
      }
    } catch (error) {
      console.error('Error loading invitations:', error);
      toast.error('Error al cargar invitaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !name) {
      toast.error('Email y nombre son requeridos');
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase(),
          name,
          notes,
          plan_type: 'premium',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Invitación creada exitosamente');
        
        // Copy signup URL to clipboard
        if (data.signup_url) {
          await navigator.clipboard.writeText(data.signup_url);
          toast.success('Link copiado al portapapeles');
        }

        // Reset form
        setEmail('');
        setName('');
        setNotes('');
        setIsDialogOpen(false);

        // Reload list
        loadInvitations();
      } else {
        toast.error(data.error || 'Error al crear invitación');
      }
    } catch (error) {
      console.error('Error creating invitation:', error);
      toast.error('Error al crear invitación');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResend = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/invitations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resend' }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Invitación reenviada');
        
        // Copy URL
        if (data.signup_url) {
          await navigator.clipboard.writeText(data.signup_url);
          toast.success('Link copiado al portapapeles');
        }

        loadInvitations();
      } else {
        toast.error(data.error || 'Error al reenviar');
      }
    } catch (error) {
      console.error('Error resending:', error);
      toast.error('Error al reenviar');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('¿Cancelar esta invitación?')) return;

    try {
      const response = await fetch(`/api/admin/invitations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });

      if (response.ok) {
        toast.success('Invitación cancelada');
        loadInvitations();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Error al cancelar');
      }
    } catch (error) {
      console.error('Error cancelling:', error);
      toast.error('Error al cancelar');
    }
  };

  const handleCopyLink = async (token: string) => {
    const url = `${window.location.origin}/signup/${token}`;
    await navigator.clipboard.writeText(url);
    toast.success('Link copiado');
  };

  const stats = {
    total: invitations.length,
    pending: invitations.filter(i => i.status === 'pending').length,
    accepted: invitations.filter(i => i.status === 'accepted').length,
    expired: invitations.filter(i => i.status === 'expired').length,
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Invitaciones de Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona las invitaciones para nuevos clientes premium
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Invitación
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar Invitación</DialogTitle>
              <DialogDescription>
                Crea una invitación para un nuevo cliente premium
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateInvitation} className="space-y-4">
              <div>
                <Label htmlFor="email">Email del Cliente *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@clinica.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="name">Nombre Completo *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Dr. Juan García"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notas (Opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Ej: Cliente upgrade desde MSI, plan anual"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Creando...' : 'Crear Invitación'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aceptadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expiradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.expired}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Invitaciones</CardTitle>
            <Button variant="outline" size="sm" onClick={loadInvitations}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando...
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-8">
              <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay invitaciones aún</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Enviada</TableHead>
                  <TableHead>Expira</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">{invitation.name}</TableCell>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell>
                      <Badge className={INVITATION_STATUS_COLORS[invitation.status]}>
                        {INVITATION_STATUS_LABELS[invitation.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(invitation.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                      {invitation.sent_count > 1 && (
                        <span className="text-xs ml-1">({invitation.sent_count}x)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(invitation.expires_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {invitation.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyLink(invitation.token)}
                              title="Copiar link"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResend(invitation.id)}
                              title="Reenviar"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancel(invitation.id)}
                              title="Cancelar"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
