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
      
      // Show only recent pending and today's bookings
      const relevant = data.bookings
        .filter((b: Booking) => {
          const today = new Date().toISOString().split('T')[0];
          return b.status === 'pending' || b.booking_date === today;
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
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
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
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border-2 border-gray-200 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-teal-600" />
          <h3 className="text-lg font-semibold text-gray-900">Reservas Online</h3>
        </div>
        <Link
          href="/dashboard/bookings"
          className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
        >
          Ver todas
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-800">{stats.pending}</div>
            <div className="text-xs text-yellow-600">Pendientes</div>
          </div>
          <div className="bg-teal-50 p-3 rounded-lg border border-teal-200">
            <div className="text-2xl font-bold text-teal-800">{stats.today}</div>
            <div className="text-xs text-teal-600">Para hoy</div>
          </div>
        </div>
      )}

      {/* Recent Bookings */}
      {recentBookings.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          No hay reservas recientes
        </div>
      ) : (
        <div className="space-y-3">
          {recentBookings.map((booking) => (
            <div
              key={booking.id}
              className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-teal-500 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-sm text-gray-900">
                    {booking.patient_name}
                  </span>
                  {getStatusIcon(booking.status)}
                </div>
              </div>
              
              <div className="text-xs text-gray-600 mb-2">
                {booking.service_name}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {formatDate(booking.booking_date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(booking.booking_time)}
                  </span>
                </div>

                {booking.status === 'pending' && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => quickAction(booking.id, 'confirmed')}
                      className="p-1 bg-green-100 hover:bg-green-200 rounded"
                      title="Confirmar"
                    >
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </button>
                    <button
                      onClick={() => quickAction(booking.id, 'cancelled')}
                      className="p-1 bg-red-100 hover:bg-red-200 rounded"
                      title="Cancelar"
                    >
                      <XCircle className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <Link
        href="/dashboard/bookings"
        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors text-sm"
      >
        Gestionar todas las reservas
        <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}
