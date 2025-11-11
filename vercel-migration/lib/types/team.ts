/**
 * Team Members Types
 * Multi-user collaboration system
 */

export type TeamMemberRole = 'owner' | 'admin' | 'doctor' | 'receptionist' | 'viewer';
export type TeamMemberStatus = 'pending' | 'active' | 'inactive';

export interface TeamMemberPermissions {
  can_view_patients: boolean;
  can_edit_patients: boolean;
  can_delete_patients: boolean;
  can_view_records: boolean;
  can_edit_records: boolean;
  can_delete_records: boolean;
  can_view_appointments: boolean;
  can_edit_appointments: boolean;
  can_delete_appointments: boolean;
  can_view_inventory: boolean;
  can_edit_inventory: boolean;
  can_view_reports: boolean;
  can_manage_team: boolean;
}

export interface TeamMember {
  id: string;
  owner_user_id: string;
  member_user_id: string | null;
  member_email: string;
  role: TeamMemberRole;
  status: TeamMemberStatus;
  invited_at: string;
  accepted_at: string | null;
  invitation_token: string | null;
  location_id: string | null;
  permissions: TeamMemberPermissions;
  created_at: string;
  updated_at: string;
}

export interface TeamMemberWithUser extends TeamMember {
  member_name?: string;
  member_avatar?: string;
}

export interface InviteTeamMemberInput {
  email: string;
  role: TeamMemberRole;
  location_id?: string | null;
  custom_permissions?: Partial<TeamMemberPermissions>;
}

export interface UpdateTeamMemberInput {
  role?: TeamMemberRole;
  status?: TeamMemberStatus;
  location_id?: string | null;
  permissions?: Partial<TeamMemberPermissions>;
}

export interface TeamStats {
  total_members: number;
  active_members: number;
  pending_invitations: number;
  max_allowed: number; // From subscription plan
  can_invite_more: boolean;
}

// Predefined role templates
export const ROLE_PERMISSIONS: Record<TeamMemberRole, TeamMemberPermissions> = {
  owner: {
    can_view_patients: true,
    can_edit_patients: true,
    can_delete_patients: true,
    can_view_records: true,
    can_edit_records: true,
    can_delete_records: true,
    can_view_appointments: true,
    can_edit_appointments: true,
    can_delete_appointments: true,
    can_view_inventory: true,
    can_edit_inventory: true,
    can_view_reports: true,
    can_manage_team: true,
  },
  admin: {
    can_view_patients: true,
    can_edit_patients: true,
    can_delete_patients: true,
    can_view_records: true,
    can_edit_records: true,
    can_delete_records: true,
    can_view_appointments: true,
    can_edit_appointments: true,
    can_delete_appointments: true,
    can_view_inventory: true,
    can_edit_inventory: true,
    can_view_reports: true,
    can_manage_team: true,
  },
  doctor: {
    can_view_patients: true,
    can_edit_patients: true,
    can_delete_patients: false,
    can_view_records: true,
    can_edit_records: true,
    can_delete_records: false,
    can_view_appointments: true,
    can_edit_appointments: true,
    can_delete_appointments: false,
    can_view_inventory: true,
    can_edit_inventory: false,
    can_view_reports: true,
    can_manage_team: false,
  },
  receptionist: {
    can_view_patients: true,
    can_edit_patients: true,
    can_delete_patients: false,
    can_view_records: true,
    can_edit_records: false,
    can_delete_records: false,
    can_view_appointments: true,
    can_edit_appointments: true,
    can_delete_appointments: false,
    can_view_inventory: true,
    can_edit_inventory: false,
    can_view_reports: false,
    can_manage_team: false,
  },
  viewer: {
    can_view_patients: true,
    can_edit_patients: false,
    can_delete_patients: false,
    can_view_records: true,
    can_edit_records: false,
    can_delete_records: false,
    can_view_appointments: true,
    can_edit_appointments: false,
    can_delete_appointments: false,
    can_view_inventory: true,
    can_edit_inventory: false,
    can_view_reports: true,
    can_manage_team: false,
  },
};

export const ROLE_LABELS: Record<TeamMemberRole, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  doctor: 'Doctor',
  receptionist: 'Recepcionista',
  viewer: 'Solo Lectura',
};

export const ROLE_DESCRIPTIONS: Record<TeamMemberRole, string> = {
  owner: 'Acceso completo y control total del sistema',
  admin: 'Puede gestionar todo excepto la facturación',
  doctor: 'Puede ver y editar pacientes, citas y registros médicos',
  receptionist: 'Puede agendar citas y ver información de pacientes',
  viewer: 'Solo puede ver información, sin editar',
};
