/**
 * Types for Invitations System
 * Professional invitation system for paid clients
 */

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';
export type PlanType = 'premium' | 'basic' | 'enterprise'; // Future-proof

export interface Invitation {
  id: string;
  email: string;
  name: string;
  token: string;
  invited_by: string;
  status: InvitationStatus;
  plan_type: string;
  created_at: string;
  expires_at: string;
  accepted_at?: string;
  sent_count: number;
  last_sent_at: string;
  notes?: string;
}

export interface CreateInvitationInput {
  email: string;
  name: string;
  plan_type?: string;
  notes?: string;
}

export interface InvitationValidation {
  valid: boolean;
  invitation?: Invitation;
  error?: string;
}

export interface AcceptInvitationInput {
  token: string;
  password: string;
}

export const INVITATION_STATUS_LABELS = {
  pending: 'Pendiente',
  accepted: 'Aceptada',
  expired: 'Expirada',
  cancelled: 'Cancelada',
};

export const INVITATION_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  expired: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

export const PLAN_TYPE_LABELS = {
  premium: 'Premium (Completo)',
  basic: 'Básico',
  enterprise: 'Empresarial',
};

export const DEFAULT_INVITATION_EXPIRY_DAYS = 7;
