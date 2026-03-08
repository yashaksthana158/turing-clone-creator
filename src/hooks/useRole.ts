import { useAuth } from '@/contexts/AuthContext';

type AppRole = 'SUPER_ADMIN' | 'PRESIDENT' | 'TEAM_LEAD' | 'TEAM_MEMBER' | 'PARTICIPANT';

const ROLE_LEVELS: Record<AppRole, number> = {
  SUPER_ADMIN: 5,
  PRESIDENT: 4,
  TEAM_LEAD: 3,
  TEAM_MEMBER: 2,
  PARTICIPANT: 1,
};

export function useRole() {
  const { roles, hasRole, hasMinRoleLevel } = useAuth();

  const isSuperAdmin = () => hasRole('SUPER_ADMIN');
  const isPresident = () => hasRole('PRESIDENT') || hasRole('SUPER_ADMIN');
  const isTeamLead = () => hasMinRoleLevel(ROLE_LEVELS.TEAM_LEAD);
  const isTeamMember = () => hasMinRoleLevel(ROLE_LEVELS.TEAM_MEMBER);
  const isParticipant = () => hasMinRoleLevel(ROLE_LEVELS.PARTICIPANT);

  const canManageRoles = () => isSuperAdmin();
  const canApproveEvents = () => isTeamLead();
  const canFinalApprove = () => isPresident();
  const canCreateEvents = () => isTeamMember();
  const canRegisterForEvents = () => isParticipant();

  const getHighestRole = (): AppRole | null => {
    if (roles.length === 0) return null;
    return roles.reduce((highest, current) => {
      return ROLE_LEVELS[current] > ROLE_LEVELS[highest] ? current : highest;
    });
  };

  const getRoleLevel = (role: AppRole) => ROLE_LEVELS[role];

  return {
    roles,
    hasRole,
    hasMinRoleLevel,
    isSuperAdmin,
    isPresident,
    isTeamLead,
    isTeamMember,
    isParticipant,
    canManageRoles,
    canApproveEvents,
    canFinalApprove,
    canCreateEvents,
    canRegisterForEvents,
    getHighestRole,
    getRoleLevel,
  };
}
