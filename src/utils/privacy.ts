import { User } from '../types';
import { isFounderIdentity } from './permissions';

/**
 * Strict CNIC Privacy Rules:
 * 1. Founder (KC-ADM-001) CNIC is completely hidden from everyone everywhere.
 * 2. Additional Super Admins', Admins', and Co-Admins' CNICs are hidden from all regular members.
 * 3. Regular members cannot view other users' CNICs.
 */
export function canViewUserCnic(viewer?: Partial<User> | null, target?: Partial<User> | null): boolean {
  if (!target) return false;
  if (isFounderIdentity(target)) return false;
  if (!viewer) return false;

  if (viewer.id && target.id && viewer.id === target.id) {
    return true;
  }

  if (isFounderIdentity(viewer)) {
    return true;
  }

  if (viewer.role === 'MEMBER') {
    return false;
  }

  if (viewer.role === 'SUPER_ADMIN' || viewer.role === 'ADMIN' || viewer.role === 'CO_ADMIN') {
    return target.role !== 'SUPER_ADMIN';
  }

  return false;
}

/**
 * Phone number remains visible and accessible across the community directory and profile views.
 */
export function canViewUserPhone(_viewer?: Partial<User> | null, _target?: Partial<User> | null): boolean {
  return true;
}

/**
 * Email contact details remain restricted to self and governance leadership.
 */
export function canViewUserEmail(viewer?: Partial<User> | null, target?: Partial<User> | null): boolean {
  if (!viewer || !target) return false;
  if (viewer.id && target.id && viewer.id === target.id) return true;
  if (isFounderIdentity(viewer)) return true;
  return viewer.role === 'SUPER_ADMIN' || viewer.role === 'ADMIN' || viewer.role === 'CO_ADMIN';
}
