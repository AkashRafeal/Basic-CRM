export type Role = 'ROLE_ADMIN' | 'ROLE_MANAGER' | 'ROLE_EMPLOYEE';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  roleName: string;
  department?: string;
  departmentId?: number;
  phoneNumber?: string;
  managerId?: number;
  managerName?: string;
  teamName?: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  createdAt?: string;
  managerCount?: number;
  employeeCount?: number;
}

export interface EmployeeSummary {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  active: boolean;
  createdAt: string;
}

export interface ManagerHierarchy {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  teamName?: string;
  active: boolean;
  employees: EmployeeSummary[];
}

export interface DepartmentHierarchy {
  id: number;
  name: string;
  code: string;
  description?: string;
  managers: ManagerHierarchy[];
  unassignedEmployees: EmployeeSummary[];
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: Role;
  department?: string;
  departmentId?: number;
  phoneNumber?: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: Role;
  department?: string;
  departmentId?: number;
  managerId?: number;
  teamName?: string;
  autoAssignManager?: boolean;
  phoneNumber?: string;
}

export interface UpdateUserPayload {
  name: string;
  department?: string;
  departmentId?: number;
  managerId?: number;
  teamName?: string;
  phoneNumber?: string;
  active?: boolean;
}

export interface UpdateRolePayload {
  role: Role;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface AdminResetPasswordPayload {
  newPassword: string;
}
