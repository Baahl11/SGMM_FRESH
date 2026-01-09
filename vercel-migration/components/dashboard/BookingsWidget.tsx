'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  CalendarDays,
  Clock,
  User,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { GlassPanel } from '@/components/ui/glass-panel';

interface Booking {
  id: string;
  patient_name: string;
  booking_date: string;
  booking_time: string;
  service_name: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

interface Stats {
  pending: number;
  today: number;
}

export default function BookingsWidget() {
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch(`/api/bookings?_=${Date.now()}`);
      if (!response.ok) throw new Error('Error loading bookings');

      const data = await response.json();
      
      // Show only future bookings or today's bookings (exclude past dates)
      const today = new Date().toISOString().split('T')[0];
      const relevant = data.bookings
        .filter((b: Booking) => {
          // Only show bookings from today onwards (exclude past dates)
          return b.booking_date >= today;
        })
        .slice(0, 5);
      
      setRecentBookings(relevant);
      setStats({
        pending: data.stats.pending,
        today: data.stats.today
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateStr = d.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    if (dateStr === todayStr) return 'Hoy';
    if (dateStr === tomorrowStr) return 'Mañana';
    
    return d.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5); // HH:MM
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-amber-300" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-emerald-300" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-rose-300" />;
      default:
        return null;
    }
  };

  const quickAction = async (id: string, action: 'confirmed' | 'cancelled') => {
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action })
      });

      if (response.ok) {
        fetchBookings(); // Refresh list
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <GlassPanel className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 rounded-full bg-white/10 w-1/3"></div>
          <div className="h-20 rounded-2xl bg-white/5"></div>
        </div>
      </GlassPanel>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
      <GlassPanel className="p-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-sky-500 flex items-center justify-center">
              <CalendarDays className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">Canal online</p>
              <h3 className="text-2xl font-semibold text-white">Reservas Online</h3>
              <p className="text-sm text-white/70">Controla tus citas confirmadas desde la web</p>
            </div>
          </div>
          <Link
            href="/dashboard/bookings"
            className="flex items-center gap-2 text-sm text-white/80 hover:text-white"
          >
            Ver todas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {stats && (
          <div className="grid gap-4 md:grid-cols-2">
            {[{
              label: 'Pendientes',
              value: stats.pending,
              tone: 'from-amber-300/30 via-amber-500/20 to-transparent',
              badge: 'Sin confirmar'
            }, {
              label: 'Para hoy',
              value: stats.today,
              tone: 'from-teal-300/30 via-sky-500/20 to-transparent',
              badge: 'Agenda del día'
            }].map(({ label, value, tone, badge }) => (
              <div
                key={label}
                className={`rounded-2xl border border-white/10 bg-gradient-to-br ${tone} p-4`}
              >
                <p className="text-xs uppercase tracking-[0.35em] text-white/60">{label}</p>
                <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
                <p className="text-sm text-white/70">{badge}</p>
              </div>
            ))}
          </div>
        )}

        {recentBookings.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 py-10 text-center text-sm text-white/60">
            No hay reservas recientes
          </div>
        ) : (
          <div className="space-y-3">
            {recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-emerald-300/60"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{booking.patient_name}</p>
                      <p className="text-sm text-white/70">{booking.service_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1 text-white/70">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(booking.booking_date)}
                    </span>
                    <span className="flex items-center gap-1 text-white/70">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(booking.booking_time)}
                    </span>
                    <span className="flex items-center gap-1 rounded-full border border-white/15 px-2 py-0.5 text-white/70">
                      {getStatusIcon(booking.status)}
                      <span className="capitalize">{booking.status}</span>
                    </span>
                  </div>
                </div>

                {booking.status === 'pending' && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => quickAction(booking.id, 'confirmed')}
                      className="flex items-center gap-2 rounded-full border border-white/10 bg-emerald-500/20 px-3 py-1 text-sm font-medium text-emerald-100 transition hover:bg-emerald-400/30"
                      title="Confirmar"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Confirmar
                    </button>
                    <button
                      onClick={() => quickAction(booking.id, 'cancelled')}
                      className="flex items-center gap-2 rounded-full border border-white/10 bg-rose-500/20 px-3 py-1 text-sm font-medium text-rose-100 transition hover:bg-rose-400/30"
                      title="Cancelar"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <Link
          href="/dashboard/bookings"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-300 via-sky-300 to-violet-300 px-5 py-3 text-sm font-semibold text-slate-900 shadow-[0_15px_40px_rgba(56,189,248,0.35)] transition hover:-translate-y-0.5"
        >
          Gestionar todas las reservas
          <ArrowRight className="h-4 w-4" />
        </Link>
      </GlassPanel>
    </motion.div>
  );
}
