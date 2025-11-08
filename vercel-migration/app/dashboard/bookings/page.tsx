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
import { MainNav } from '@/components/layout/main-nav';

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="bg-white border-b">
          <div className="container mx-auto px-6 py-4">
            <MainNav />
          </div>
        </div>
        <div className="flex justify-center items-center h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Main Navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <MainNav />
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reservas Online</h1>
          <p className="text-gray-600">Gestiona todas las reservas recibidas a través de tu página pública</p>
        </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-4 rounded-lg border-2 border-gray-200"
          >
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200"
          >
            <div className="text-2xl font-bold text-yellow-800">{stats.pending}</div>
            <div className="text-sm text-yellow-600">Pendientes</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-green-50 p-4 rounded-lg border-2 border-green-200"
          >
            <div className="text-2xl font-bold text-green-800">{stats.confirmed}</div>
            <div className="text-sm text-green-600">Confirmadas</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200"
          >
            <div className="text-2xl font-bold text-blue-800">{stats.completed}</div>
            <div className="text-sm text-blue-600">Completadas</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-red-50 p-4 rounded-lg border-2 border-red-200"
          >
            <div className="text-2xl font-bold text-red-800">{stats.cancelled}</div>
            <div className="text-sm text-red-600">Canceladas</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-teal-50 p-4 rounded-lg border-2 border-teal-200"
          >
            <div className="text-2xl font-bold text-teal-800">{stats.today}</div>
            <div className="text-sm text-teal-600">Hoy</div>
          </motion.div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-6 flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <label className="text-sm font-medium text-gray-700">Estado:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="confirmed">Confirmadas</option>
            <option value="completed">Completadas</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-600" />
          <label className="text-sm font-medium text-gray-700">Fecha:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="text-sm text-teal-600 hover:text-teal-700"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-gray-200">
          <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No hay reservas para mostrar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking, index) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white p-6 rounded-lg border-2 border-gray-200 hover:border-teal-500 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-teal-100 p-3 rounded-full">
                    <User className="h-6 w-6 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{booking.patient_name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
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
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                  {getStatusText(booking.status)}
                </span>
              </div>

              {/* Service Info */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="font-medium text-gray-900 mb-2">{booking.service_name}</div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Duración: {booking.service_duration} min</span>
                  <span>•</span>
                  <span>Precio: ${booking.service_price.toLocaleString('es-MX')}</span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                <span className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {booking.patient_phone}
                </span>
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {booking.patient_email}
                </span>
              </div>

              {/* Patient Notes */}
              {booking.notes && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-900 mb-1">Notas del paciente:</div>
                  <div className="text-sm text-blue-800">{booking.notes}</div>
                </div>
              )}

              {/* Clinic Notes */}
              <div className="mb-4">
                {editingNotes === booking.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                      placeholder="Notas internas de la clínica..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveNotes(booking.id)}
                        className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditingNotes(null)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {booking.clinic_notes ? (
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="text-sm font-medium text-purple-900 mb-1">Notas de la clínica:</div>
                        <div className="text-sm text-purple-800">{booking.clinic_notes}</div>
                      </div>
                    ) : null}
                    <button
                      onClick={() => {
                        setEditingNotes(booking.id);
                        setNotesText(booking.clinic_notes || '');
                      }}
                      className="mt-2 text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {booking.clinic_notes ? 'Editar notas' : 'Agregar notas'}
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                {booking.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Confirmar
                    </button>
                    <button
                      onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancelar
                    </button>
                  </>
                )}
                
                {booking.status === 'confirmed' && (
                  <button
                    onClick={() => updateBookingStatus(booking.id, 'completed')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Clock3 className="h-4 w-4" />
                    Marcar como completada
                  </button>
                )}

                <button
                  onClick={() => deleteBooking(booking.id)}
                  className="ml-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
