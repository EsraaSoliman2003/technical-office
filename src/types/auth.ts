// Auth types (match the .NET API contract)

export type UserRole = "Admin" | "Manager" | "Employee";

export interface LoginRequest {
  email: string;
  password: string;
}

/** POST /api/auth/login */
export interface LoginResponse {
  accessToken: string;
  expiresAt: string;
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
}

/** GET /api/auth/me */
export interface MeResponse {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

