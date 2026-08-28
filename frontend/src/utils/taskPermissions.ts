import { Task } from '../types/task';
import { User } from '../types/auth';

export interface TaskDeletePermission {
  allowed: boolean;
  reason?: string;
  isPermanentAllowed?: boolean;
}

export const checkTaskDeletePermission = (
  task: Task | null | undefined,
  user: User | null | undefined
): TaskDeletePermission => {
  if (!task || !user) {
    return { allowed: false, reason: 'You must be signed in to delete tasks.' };
  }

  const role = user.role;

  // Admin has full permissions (can soft delete or permanently delete any task)
  if (role === 'ROLE_ADMIN') {
    return { allowed: true, isPermanentAllowed: true };
  }

  // Employee cannot delete tasks
  if (role === 'ROLE_EMPLOYEE') {
    return { allowed: false, reason: 'Employees do not have permission to delete tasks.' };
  }

  // Manager Role Restrictions
  if (role === 'ROLE_MANAGER') {
    // Restriction 1: Delete tasks created by Admin
    if (task.createdByRole === 'ROLE_ADMIN' || task.createdByRole === 'ADMIN') {
      return {
        allowed: false,
        reason: 'Manager Restriction: Tasks created by an Administrator cannot be deleted by a Manager.',
        isPermanentAllowed: false,
      };
    }

    // Restriction 2: Delete another Manager's task
    if (
      (task.createdByRole === 'ROLE_MANAGER' || task.createdByRole === 'MANAGER') &&
      task.createdByUserId &&
      task.createdByUserId !== user.id
    ) {
      return {
        allowed: false,
        reason: 'Manager Restriction: You cannot delete tasks created by another Manager.',
        isPermanentAllowed: false,
      };
    }

    // Restriction 3: Delete completed tasks
    if (task.status === 'COMPLETED') {
      return {
        allowed: false,
        reason: 'Manager Restriction: Completed tasks cannot be deleted to protect audit and performance history.',
        isPermanentAllowed: false,
      };
    }

    // Restriction 4: Permanently delete any task
    // Allowed for soft delete / archive only
    return {
      allowed: true,
      isPermanentAllowed: false, // Managers cannot permanently delete any task
    };
  }

  return { allowed: false, reason: 'Unauthorized action.' };
};
