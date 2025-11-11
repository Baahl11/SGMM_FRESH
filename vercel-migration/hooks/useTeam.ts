/**
 * useTeam Hook
 * Centralized team management and permissions
 */

import { useState, useEffect, useCallback } from 'react';
import type { TeamMember, TeamStats } from '@/lib/types/team';

export function useTeam() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTeam = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/team/members');
      
      if (!response.ok) {
        throw new Error('Error al cargar equipo');
      }

      const data = await response.json();
      setMembers(data.members || []);
      setStats(data.stats || null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading team:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const inviteMember = useCallback(async (email: string, role: string) => {
    const response = await fetch('/api/team/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al invitar miembro');
    }

    await loadTeam(); // Refresh
    return response.json();
  }, [loadTeam]);

  const removeMember = useCallback(async (memberId: string) => {
    const response = await fetch(`/api/team/members/${memberId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar miembro');
    }

    await loadTeam(); // Refresh
    return response.json();
  }, [loadTeam]);

  const updateMember = useCallback(async (memberId: string, updates: any) => {
    const response = await fetch(`/api/team/members/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar miembro');
    }

    await loadTeam(); // Refresh
    return response.json();
  }, [loadTeam]);

  return {
    members,
    stats,
    loading,
    error,
    refresh: loadTeam,
    inviteMember,
    removeMember,
    updateMember,
  };
}

// Hook to check if current user has specific permission
export function useTeamPermission(permission: string): boolean {
  // TODO: Implement permission check
  // For now, return true (all permissions granted)
  return true;
}
