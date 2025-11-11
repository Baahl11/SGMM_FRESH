'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  MapPin,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Crown,
  Sparkles
} from 'lucide-react';
import type { TeamMember, TeamStats, InviteTeamMemberInput, TeamMemberRole } from '@/lib/types/team';
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/lib/types/team';

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/team/members');
      
      if (!response.ok) {
        throw new Error('Error al cargar miembros');
      }

      const data = await response.json();
      setMembers(data.members || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Error loading team:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, email: string) => {
    if (!confirm(`¿Eliminar el acceso de ${email}?`)) {
      return;
    }

    try {
      setActionLoading(memberId);
      const response = await fetch(`/api/team/members/${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar miembro');
      }

      // Refresh list
      await loadTeamMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Error al eliminar miembro');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'inactive':
        return <XCircle className="h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Activo</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Pendiente</span>;
      case 'inactive':
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">Inactivo</span>;
      default:
        return null;
    }
  };

  const getRoleIcon = (role: TeamMemberRole) => {
    switch (role) {
      case 'owner':
      case 'admin':
        return <Crown className="h-4 w-4" />;
      case 'doctor':
        return <Shield className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="h-8 w-8 text-teal-600" />
              Equipo de Trabajo
            </h1>
            <p className="text-gray-600 mt-2">
              Invita y gestiona a los miembros de tu equipo médico
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            disabled={!stats?.can_invite_more}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus className="h-5 w-5" />
            Invitar Miembro
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Miembros</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_members}/{stats.max_allowed}</p>
              </div>
              <Users className="h-8 w-8 text-teal-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-green-600">{stats.active_members}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending_invitations}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Disponibles</p>
                <p className="text-2xl font-bold text-blue-600">{stats.max_allowed - stats.total_members}</p>
              </div>
              <Sparkles className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>
      )}

      {/* Limit Warning */}
      {stats && !stats.can_invite_more && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900">Límite alcanzado</p>
              <p className="text-sm text-yellow-700 mt-1">
                Has alcanzado el límite de {stats.max_allowed} miembros de tu plan. 
                <a href="/pricing" className="underline ml-1">Actualiza tu plan</a> para invitar más usuarios.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            Miembros del Equipo ({members.length})
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {members.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No hay miembros en tu equipo</p>
              <p className="text-sm text-gray-500 mb-4">
                Invita a doctores, recepcionistas o administradores para colaborar
              </p>
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Invitar Primer Miembro
              </button>
            </div>
          ) : (
            members.map((member) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center">
                      {getRoleIcon(member.role)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{member.member_email}</h3>
                        {getStatusIcon(member.status)}
                        {getStatusBadge(member.status)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Shield className="h-4 w-4" />
                          {ROLE_LABELS[member.role]}
                        </span>
                        
                        {member.location_id && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            Locación específica
                          </span>
                        )}
                        
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {member.status === 'pending' ? 'Invitación enviada' : 'Activo desde ' + new Date(member.accepted_at!).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-1">
                        {ROLE_DESCRIPTIONS[member.role]}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRemoveMember(member.id, member.member_email)}
                      disabled={actionLoading === member.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Eliminar acceso"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
            loadTeamMembers();
          }}
        />
      )}
    </div>
  );
}

// Invite Modal Component
function InviteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState<InviteTeamMemberInput>({
    email: '',
    role: 'doctor',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      const response = await fetch('/api/team/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar invitación');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg max-w-md w-full p-6"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Invitar Miembro</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email del miembro
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="doctor@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rol
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as TeamMemberRole })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="doctor">Doctor</option>
              <option value="admin">Administrador</option>
              <option value="receptionist">Recepcionista</option>
              <option value="viewer">Solo Lectura</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {ROLE_DESCRIPTIONS[formData.role]}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar Invitación'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
