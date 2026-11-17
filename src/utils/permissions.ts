import { User, UserRole } from '../types';

export const ROOT_FOUNDER_EMAIL = 'asadullah6959@gmail.com';
export const ROOT_FOUNDER_MEMBERSHIP_ID = 'KC-ADM-001';

export function isFounderIdentity(user?: Partial<User> | null): boolean {
  if (!user) return false;
  const email = (user.email || '').trim().toLowerCase();
  const membershipId = (user.membershipId || user.memberId || '').trim().toUpperCase();
  return Boolean(
    user.isFounder ||
      email === ROOT_FOUNDER_EMAIL ||
      membershipId === ROOT_FOUNDER_MEMBERSHIP_ID
  );
}

export function isAdditionalSuperAdmin(user?: Partial<User> | null): boolean {
  if (!user) return false;
  return user.role === 'SUPER_ADMIN' && !isFounderIdentity(user);
}

export function isChatModerator(user?: Partial<User> | null): boolean {
  if (!user) return false;
  if (isFounderIdentity(user)) return true;
  const role: UserRole | undefined = user.role;
  return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'CO_ADMIN';
}

export function canViewRestrictedGovernancePanels(user?: Partial<User> | null): boolean {
  return isFounderIdentity(user);
}

export function canAccessRouteTab(user: Partial<User> | null | undefined, tabId: string): boolean {
  if (!user) return false;
  if (isFounderIdentity(user)) return true;

  switch (tabId) {
    case 'manage_app':
    case 'staff':
      // Strictly Founder-only
      return false;

    case 'office_bearers':
    case 'audit':
    case 'reports':
      // Hidden completely for Regular Members AND Additional Super Admins;
      // Preserved for District Admins & Provincial Co-Admins
      return user.role === 'ADMIN' || user.role === 'CO_ADMIN';

    case 'approvals':
    case 'verification':
      // Accessible to Additional Super Admins and District Admins (hidden for Regular Members & Co-Admins)
      return user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';

    case 'dashboard':
    case 'chat':
    case 'members':
    case 'funds':
    case 'announcements':
    case 'complaints':
    case 'digital-card':
    case 'profile':
    default:
      return true;
  }
}
