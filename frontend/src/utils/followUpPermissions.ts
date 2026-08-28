import { FollowUp } from '../types/followup';
import { User } from '../types/auth';

export interface FollowUpDeletePermissionResult {
  allowed: boolean;
  reason?: string;
  isSoftDeleteOnly?: boolean;
}

/**
 * Validates follow-up deletion rules based on user role and follow-up properties.
 *
 * Rules:
 * 1. ROLE_ADMIN: Full deletion access (can permanently hard delete or soft delete).
 * 2. ROLE_MANAGER:
 *    - Cannot delete follow-ups created by Admin.
 *    - Cannot delete another Manager's follow-up.
 *    - Cannot delete completed follow-ups.
 *    - Cannot permanently delete (only soft delete / archive active follow-ups).
 * 3. ROLE_EMPLOYEE: Deletion not permitted.
 */
export function checkFollowUpDeletePermission(
  followUp: FollowUp | null | undefined,
  user: User | null | undefined
): FollowUpDeletePermissionResult {
  if (!followUp || !user) {
    return { allowed: false, reason: 'Authentication or follow-up details missing.' };
  }

  // 1. Admin has full delete permissions
  if (user.role === 'ROLE_ADMIN') {
    return { allowed: true, isSoftDeleteOnly: false };
  }

  // 2. Manager Role Restrictions
  if (user.role === 'ROLE_MANAGER') {
    // Rule 1: Cannot delete follow-ups created by Admin
    if (followUp.createdByRole === 'ROLE_ADMIN' || followUp.createdByRole === 'ADMIN') {
      return {
        allowed: false,
        reason: 'Manager restriction: You cannot delete follow-ups created by an Administrator.',
      };
    }

    // Rule 2: Cannot delete another Manager's follow-up
    if (
      (followUp.createdByRole === 'ROLE_MANAGER' || followUp.createdByRole === 'MANAGER') &&
      followUp.createdByUserId &&
      followUp.createdByUserId !== user.id
    ) {
      return {
        allowed: false,
        reason: `Manager restriction: You cannot delete a follow-up created by another Manager (${followUp.createdByUserName || 'Peer Manager'}).`,
      };
    }

    // Rule 3: Cannot delete completed follow-ups
    if (followUp.status === 'COMPLETED') {
      return {
        allowed: false,
        reason: 'Manager restriction: You cannot delete completed follow-ups. Completed interaction logs are preserved for audit and customer history.',
      };
    }

    // Manager is permitted to soft delete / archive active follow-ups they own or employees created
    return {
      allowed: true,
      isSoftDeleteOnly: true,
      reason: 'This action will archive (soft delete) the follow-up record.',
    };
  }

  // 3. Employee / Default
  return {
    allowed: false,
    reason: 'Permission denied: Only Administrators and Managers have follow-up deletion privileges.',
  };
}
