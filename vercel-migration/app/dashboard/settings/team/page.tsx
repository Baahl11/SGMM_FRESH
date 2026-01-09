'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  MapPin,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Crown,
  Sparkles
} from 'lucide-react';
import type { TeamMember, TeamStats, InviteTeamMemberInput, TeamMemberRole } from '@/lib/types/team';
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/lib/types/team';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Badge } from '@/components/ui/badge';

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

  const STATUS_CONFIG = {
    active: {
      label: 'Activo',
      icon: CheckCircle,
      badgeClass: 'border-emerald-400/60 bg-emerald-500/10 text-emerald-200',
    },
    pending: {
      label: 'Pendiente',
      icon: Clock,
      badgeClass: 'border-amber-400/60 bg-amber-500/10 text-amber-200',
    },
    inactive: {
      label: 'Inactivo',
      icon: XCircle,
      badgeClass: 'border-slate-400/40 bg-slate-500/10 text-slate-200',
    },
  } as const;

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
      <div className="space-y-6">
        <GlassPanel className="flex h-72 items-center justify-center border-white/10 bg-white/5">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            className="h-12 w-12 rounded-full border-2 border-white/20 border-t-transparent"
          />
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GlassPanel className="relative overflow-hidden border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/0 p-6 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-emerald-400/30 blur-[140px]" />
          <div className="absolute -bottom-16 left-0 h-56 w-56 rounded-full bg-indigo-500/20 blur-[130px]" />
        </div>
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/70">
              <Users className="h-4 w-4" />
              Talento
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Equipo de trabajo</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/70">
                Controla accesos, roles y capacidad disponible de tu staff clínico en una sola vista.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowInviteModal(true)}
              disabled={!stats?.can_invite_more}
              className="aura-cta aura-cta--primary disabled:opacity-40"
            >
              <UserPlus className="h-4 w-4" />
              Invitar miembro
            </button>
            <Link href="/dashboard/settings/team/policies" className="aura-cta aura-cta--ghost">
              <Shield className="h-4 w-4" />
              Políticas de acceso
            </Link>
          </div>
        </div>
      </GlassPanel>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <GlassPanel className="border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between text-white">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/50">Capacidad</p>
                <p className="text-3xl font-semibold">{stats.total_members}/{stats.max_allowed}</p>
              </div>
              <Users className="h-10 w-10 text-emerald-300" />
            </div>
          </GlassPanel>
          <GlassPanel className="border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between text-white">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/50">Activos</p>
                <p className="text-3xl font-semibold text-emerald-200">{stats.active_members}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-emerald-300" />
            </div>
          </GlassPanel>
          <GlassPanel className="border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between text-white">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/50">Pendientes</p>
                <p className="text-3xl font-semibold text-amber-200">{stats.pending_invitations}</p>
              </div>
              <Clock className="h-10 w-10 text-amber-300" />
            </div>
          </GlassPanel>
          <GlassPanel className="border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between text-white">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/50">Disponibles</p>
                <p className="text-3xl font-semibold text-sky-200">{stats.max_allowed - stats.total_members}</p>
              </div>
              <Sparkles className="h-10 w-10 text-sky-300" />
            </div>
          </GlassPanel>
        </div>
      )}

      {stats && !stats.can_invite_more && (
        <GlassPanel className="flex items-start gap-3 border-amber-400/30 bg-amber-500/10 p-5">
          <AlertCircle className="h-6 w-6 text-amber-300" />
          <div className="text-white/80">
            <p className="text-sm font-semibold text-white">Límite alcanzado</p>
            <p className="text-sm text-white/70">
              Llegaste al máximo de {stats.max_allowed} miembros de tu plan actual.
              <a href="/pricing" className="ml-2 underline">Actualiza tu plan</a> para desbloquear más espacios.
            </p>
          </div>
        </GlassPanel>
      )}

      <GlassPanel className="border-white/10 bg-white/5">
        <div className="border-b border-white/10 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-white/50">Equipo</p>
              <h2 className="text-2xl font-semibold text-white">Miembros ({members.length})</h2>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="aura-cta aura-cta--ghost"
            >
              <UserPlus className="h-4 w-4" />
              Invitar
            </button>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {members.length === 0 ? (
            <div className="flex flex-col items-center gap-4 px-6 py-16 text-center text-white/70">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-dashed border-white/30">
                <Users className="h-8 w-8 text-white/60" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">Aún no hay miembros</p>
                <p className="text-sm text-white/60">Invita doctores, recepcionistas o administradores para colaborar.</p>
              </div>
              <button
                onClick={() => setShowInviteModal(true)}
                className="aura-cta aura-cta--primary"
              >
                <UserPlus className="h-4 w-4" />
                Invitar primer miembro
              </button>
            </div>
          ) : (
            members.map((member) => {
              const statusConfig = STATUS_CONFIG[member.status as keyof typeof STATUS_CONFIG];
              const RoleIcon = getRoleIcon(member.role);
              const StatusIcon = statusConfig?.icon;

              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-6 py-5 transition hover:bg-white/5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex flex-1 gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                        {RoleIcon}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-white">{member.member_email}</h3>
                          {statusConfig && (
                            <Badge className={`${statusConfig.badgeClass} rounded-full border px-3 py-1 uppercase tracking-wide`}>
                              {StatusIcon && <StatusIcon className="h-3.5 w-3.5" />}
                              {statusConfig.label}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
                          <span className="flex items-center gap-1">
                            <Shield className="h-3.5 w-3.5" />
                            {ROLE_LABELS[member.role]}
                          </span>
                          {member.location_id && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              Locación específica
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            {member.status === 'pending'
                              ? 'Invitación enviada'
                              : member.accepted_at
                                ? `Activo desde ${new Date(member.accepted_at).toLocaleDateString('es-MX')}`
                                : 'Activo'}
                          </span>
                        </div>
                        <p className="text-xs text-white/50">{ROLE_DESCRIPTIONS[member.role]}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRemoveMember(member.id, member.member_email)}
                        disabled={actionLoading === member.id}
                        className="h-10 w-10 rounded-full border border-rose-400/40 text-rose-200 transition hover:bg-rose-500/10 disabled:opacity-40"
                        title="Eliminar acceso"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </GlassPanel>

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
  const [invitationLink, setInvitationLink] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [copied, setCopied] = useState(false);

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

      setInvitationLink(data.invitation_url);
      setEmailSent(data.email_sent || false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al enviar invitación';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (invitationLink) {
      navigator.clipboard.writeText(invitationLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <GlassPanel className="relative overflow-hidden border-white/20 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-6">
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute -top-12 right-0 h-40 w-40 rounded-full bg-emerald-500/30 blur-[100px]" />
            <div className="absolute -bottom-16 left-4 h-32 w-56 rounded-full bg-sky-500/20 blur-[110px]" />
          </div>
          <div className="relative">
            <h2 className="text-2xl font-semibold text-white">Invitar miembro</h2>
            <p className="mt-1 text-sm text-white/70">Envía un acceso con rol y seguimiento de estatus.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.35em] text-white/50">Email del miembro</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                  placeholder="doctor@ejemplo.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.35em] text-white/50">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as TeamMemberRole })}
                  className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                >
                  <option value="doctor">Doctor</option>
                  <option value="admin">Administrador</option>
                  <option value="receptionist">Recepcionista</option>
                  <option value="viewer">Solo lectura</option>
                </select>
                <p className="text-xs text-white/60">{ROLE_DESCRIPTIONS[formData.role]}</p>
              </div>

              {error && (
                <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 text-sm text-rose-100">
                  {error}
                </div>
              )}

              {invitationLink && (
                <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-sm text-white space-y-3">
                  <div className="flex items-center gap-2 text-emerald-100">
                    <CheckCircle className="h-5 w-5" />
                    <p className="font-medium">{emailSent ? '✉️ ¡Email enviado!' : '¡Invitación creada!'}</p>
                  </div>
                  {emailSent && (
                    <p className="text-white/80">
                      Se notificó a <strong>{formData.email}</strong> con las instrucciones de acceso.
                    </p>
                  )}
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.35em] text-white/60">
                      Link manual
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={invitationLink}
                        className="flex-1 rounded-2xl border border-white/20 bg-black/20 px-3 py-2 text-xs font-mono text-white"
                        onClick={(e) => e.currentTarget.select()}
                      />
                      <button
                        type="button"
                        onClick={copyToClipboard}
                        className="rounded-2xl border border-white/20 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                      >
                        {copied ? '✓ Copiado' : 'Copiar'}
                      </button>
                    </div>
                    <p className="text-xs text-white/60">
                      Deben iniciar sesión con {formData.email} para completar la activación.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {!invitationLink && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="aura-cta aura-cta--ghost flex-1 justify-center"
                  >
                    Cancelar
                  </button>
                )}

                {invitationLink ? (
                  <button
                    type="button"
                    onClick={() => {
                      onSuccess();
                      onClose();
                    }}
                    className="aura-cta aura-cta--primary flex-1 justify-center"
                  >
                    Listo
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="aura-cta aura-cta--primary flex-1 justify-center disabled:opacity-40"
                  >
                    {loading ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Crear invitación
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </GlassPanel>
      </motion.div>
    </div>
  );
}
