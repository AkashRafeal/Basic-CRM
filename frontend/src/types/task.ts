export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TaskType = 
  | 'FOLLOW_UP'
  | 'CALL'
  | 'MEETING'
  | 'EMAIL'
  | 'PROPOSAL'
  | 'ONBOARDING'
  | 'OTHER';

export type RelatedEntityType = 'LEAD' | 'CUSTOMER' | 'GENERAL';

export interface Task {
  id: number;
  title: string;
  description?: string;
  taskType: TaskType;
  taskTypeDisplayName: string;
  priority: TaskPriority;
  priorityDisplayName: string;
  status: TaskStatus;
  statusDisplayName: string;
  dueDate?: string;
  completedAt?: string;
  assignedToUserId?: number;
  assignedToUserName?: string;
  relatedEntityType: RelatedEntityType;
  relatedEntityDisplayName: string;
  relatedEntityId?: number;
  relatedEntityName?: string;
  productId?: number;
  productName?: string;
  createdByUserId?: number;
  createdByUserName?: string;
  createdByRole?: string;
  isDeleted?: boolean;
  isOverdue: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  taskType?: TaskType;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
  assignedToUserId?: number;
  assignedToUserName?: string;
  relatedEntityType?: RelatedEntityType;
  relatedEntityId?: number;
  relatedEntityName?: string;
  productId?: number;
  productName?: string;
}

export interface UpdateTaskRequest {
  title: string;
  description?: string;
  taskType?: TaskType;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
  assignedToUserId?: number;
  assignedToUserName?: string;
  relatedEntityType?: RelatedEntityType;
  relatedEntityId?: number;
  relatedEntityName?: string;
  productId?: number;
  productName?: string;
}

export interface TaskStats {
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  cancelledTasks: number;
  overdueTasks: number;
  completionRate: number;
  tasksByPriority: Record<string, number>;
  tasksByStatus: Record<string, number>;
  tasksByType: Record<string, number>;
}
