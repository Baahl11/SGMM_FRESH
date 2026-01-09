'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  CalendarDays,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Clock3,
  MessageSquare,
  Filter,
  Calendar
} from 'lucide-react';
import AppLayout from '@/components/layout/app-layout';
import { GlassPanel } from '@/components/ui/glass-panel';
import { cn } from '@/lib/utils';

interface Booking {
  id: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  booking_date: string;
  booking_time: string;
  service_name: string;
  service_duration: number;
  service_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  clinic_notes?: string;
  created_at: string;
}

interface Stats {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  completed: number;
  today: number;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState('');

  useEffect(() => {
    fetchBookings();
  }, [selectedStatus, selectedDate]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedDate) params.append('date', selectedDate);

      const response = await fetch(`/api/bookings?${params}&_=${Date.now()}`);
      if (!response.ok) throw new Error('Error loading bookings');

      const data = await response.json();
      setBookings(data.bookings);
      setStats(data.stats);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar las reservas');
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error('Error updating booking');

      toast.success('Estado actualizado correctamente');
      fetchBookings();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  const saveNotes = async (id: string) => {
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinic_notes: notesText })
      });

      if (!response.ok) throw new Error('Error saving notes');

      toast.success('Notas guardadas correctamente');
      setEditingNotes(null);
      fetchBookings();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar las notas');
    }
  };

  const deleteBooking = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta reserva?')) return;

    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Error deleting booking');

      toast.success('Reserva eliminada correctamente');
      fetchBookings();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar la reserva');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5); // HH:MM
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmada';
      case 'cancelled': return 'Cancelada';
      case 'completed': return 'Completada';
      default: return status;
    }
  };

  const statusBadgeStyles: Record<Booking['status'], string> = {
    pending: 'bg-amber-400/20 text-amber-50 border border-amber-400/40 shadow-[0_10px_35px_rgba(251,191,36,0.2)]',
    confirmed: 'bg-emerald-400/20 text-emerald-50 border border-emerald-400/40 shadow-[0_10px_35px_rgba(16,185,129,0.25)]',
    cancelled: 'bg-rose-500/20 text-rose-50 border border-rose-400/40 shadow-[0_10px_35px_rgba(244,63,94,0.25)]',
    completed: 'bg-sky-500/20 text-sky-50 border border-sky-400/40 shadow-[0_10px_35px_rgba(56,189,248,0.25)]'
  };

  const statCards = stats
    ? [
        {
          key: 'total',
          label: 'Reservas Totales',
          value: stats.total,
          hint: 'Histórico acumulado',
          icon: CalendarDays,
          accent: 'from-emerald-400/20 via-teal-400/10 to-cyan-500/5',
        },
        {
          key: 'pending',
          label: 'Pendientes',
          value: stats.pending,
          hint: 'Esperando confirmación',
          icon: Clock3,
          accent: 'from-amber-400/20 via-amber-300/10 to-transparent',
        },
        {
          key: 'confirmed',
          label: 'Confirmadas',
          value: stats.confirmed,
          hint: 'Listas para agenda',
          icon: CheckCircle,
          accent: 'from-emerald-500/20 via-emerald-400/10 to-transparent',
        },
        {
          key: 'completed',
          label: 'Completadas',
          value: stats.completed,
          hint: 'Atenciones realizadas',
          icon: Calendar,
          accent: 'from-sky-500/20 via-indigo-500/20 to-transparent',
        },
        {
          key: 'cancelled',
          label: 'Canceladas',
          value: stats.cancelled,
          hint: 'Requieren seguimiento',
          icon: XCircle,
          accent: 'from-rose-500/20 via-rose-400/10 to-transparent',
        },
        {
          key: 'today',
          label: 'Para hoy',
          value: stats.today,
          hint: 'Reservas del día',
          icon: Clock,
          accent: 'from-indigo-500/20 via-violet-500/10 to-transparent',
        },
      ]
    : [];

  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-300"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <GlassPanel className="relative overflow-hidden p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute -top-32 right-0 h-64 w-64 rounded-full bg-emerald-500/30 blur-[120px]" />
            <div className="absolute -bottom-32 left-0 h-64 w-64 rounded-full bg-indigo-500/30 blur-[120px]" />
          </div>
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                <CalendarDays className="h-4 w-4 text-emerald-300" />
                Reservas
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Canal de reservas online
                </h1>
                <p className="mt-2 max-w-2xl text-base text-white/70">
                  Visualiza el estado de cada solicitud, agrega notas internas y confirma citas con un solo clic.
                </p>
              </div>
              {stats && (
                <div className="flex flex-wrap gap-8 text-white/80">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">Hoy</p>
                    <p className="text-3xl font-semibold">{stats.today}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">Pendientes</p>
                    <p className="text-3xl font-semibold">{stats.pending}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">Confirmadas</p>
                    <p className="text-3xl font-semibold">{stats.confirmed}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <button
                onClick={() => fetchBookings()}
                className="aura-cta aura-cta--primary w-full px-6 text-base md:w-auto"
              >
                Actualizar reservas
              </button>
              <a
                href="/agenda"
                className="aura-cta aura-cta--ghost w-full px-6 text-base md:w-auto"
              >
                Revisar agenda
              </a>
            </div>
          </div>
        </GlassPanel>

        {stats && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {statCards.map((card, index) => (
              <motion.div
                key={card.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassPanel className="relative overflow-hidden p-5">
                  <div className={cn('pointer-events-none absolute inset-0 opacity-60 blur-3xl bg-gradient-to-br', card.accent)} />
                  <div className="relative flex flex-col gap-3">
                    <div className="inline-flex items-center gap-3">
                      <div className="rounded-2xl border border-white/20 bg-white/10 p-3 text-white">
                        <card.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/70">{card.label}</p>
                        <p className="text-xs uppercase tracking-[0.3em] text-white/50">{card.hint}</p>
                      </div>
                    </div>
                    <p className="text-3xl font-semibold text-white">{card.value}</p>
                  </div>
                </GlassPanel>
              </motion.div>
            ))}
          </div>
        )}

        <GlassPanel className="p-6">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-wrap items-center gap-3 text-white/80">
              <Filter className="h-5 w-5 text-white/60" />
              <label className="text-sm font-medium uppercase tracking-[0.3em] text-white/60">Estado</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="glass-select min-w-[180px]"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendientes</option>
                <option value="confirmed">Confirmadas</option>
                <option value="completed">Completadas</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-white/80">
              <Calendar className="h-5 w-5 text-white/60" />
              <label className="text-sm font-medium uppercase tracking-[0.3em] text-white/60">Fecha</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="glass-select min-w-[180px]"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="text-sm font-medium text-emerald-200 transition hover:text-emerald-100"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </GlassPanel>

        {bookings.length === 0 ? (
          <GlassPanel className="flex flex-col items-center gap-4 px-6 py-12 text-center text-white/70">
            <CalendarDays className="h-12 w-12 text-white/60" />
            <p className="text-lg font-semibold text-white">Aún no hay reservas</p>
            <p className="max-w-md text-sm">
              Cuando un paciente reserve desde tu landing pública aparecerá aquí para que la confirmes y la mandes a la agenda.
            </p>
          </GlassPanel>
        ) : (
          <div className="space-y-5">
            {bookings.map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassPanel className="space-y-6 p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-emerald-400/20 via-cyan-400/10 to-indigo-500/20 p-3 text-white">
                        <User className="h-6 w-6" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-white">{booking.patient_name}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-white/70">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-4 w-4" />
                            {formatDate(booking.booking_date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatTime(booking.booking_time)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em]',
                        statusBadgeStyles[booking.status]
                      )}
                    >
                      {getStatusText(booking.status)}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-white/80">
                      <div>
                        <p className="text-sm font-semibold text-white">{booking.service_name}</p>
                        <p className="text-xs uppercase tracking-[0.3em] text-white/50">{booking.service_duration} min</p>
                      </div>
                      <p className="text-lg font-semibold text-emerald-200">
                        ${booking.service_price.toLocaleString('es-MX')}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-white/70">
                    <span className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-white/50" />
                      {booking.patient_phone}
                    </span>
                    <span className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-white/50" />
                      {booking.patient_email}
                    </span>
                  </div>

                  {booking.notes && (
                    <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4 text-sm text-sky-50">
                      <p className="font-semibold uppercase tracking-[0.3em] text-sky-200">Notas del paciente</p>
                      <p className="mt-2 text-white/90">{booking.notes}</p>
                    </div>
                  )}

                  <div>
                    {editingNotes === booking.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={notesText}
                          onChange={(e) => setNotesText(e.target.value)}
                          placeholder="Notas internas de la clínica..."
                          className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-emerald-300/60 focus:outline-none focus:ring-emerald-300/30"
                          rows={4}
                        />
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => saveNotes(booking.id)}
                            className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/20 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                          >
                            Guardar notas
                          </button>
                          <button
                            onClick={() => setEditingNotes(null)}
                            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/70 transition hover:text-white"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {booking.clinic_notes && (
                          <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4 text-sm text-violet-50">
                            <p className="font-semibold uppercase tracking-[0.3em] text-violet-200">Notas de la clínica</p>
                            <p className="mt-2 text-white/90">{booking.clinic_notes}</p>
                          </div>
                        )}
                        <button
                          onClick={() => {
                            setEditingNotes(booking.id);
                            setNotesText(booking.clinic_notes || '');
                          }}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 transition hover:text-emerald-100"
                        >
                          <MessageSquare className="h-4 w-4" />
                          {booking.clinic_notes ? 'Editar notas' : 'Agregar notas'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 border-t border-white/10 pt-4">
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                          className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/20 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Confirmar
                        </button>
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                          className="inline-flex items-center gap-2 rounded-full border border-rose-400/40 bg-rose-500/20 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                        >
                          <XCircle className="h-4 w-4" />
                          Cancelar
                        </button>
                      </>
                    )}

                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => updateBookingStatus(booking.id, 'completed')}
                        className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/20 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                      >
                        <Clock3 className="h-4 w-4" />
                        Marcar completada
                      </button>
                    )}

                    <button
                      onClick={() => deleteBooking(booking.id)}
                      className="ml-auto inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/70 transition hover:text-white"
                    >
                      Eliminar
                    </button>
                  </div>
                </GlassPanel>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
