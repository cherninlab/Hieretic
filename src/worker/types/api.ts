/**
 * API related types and interfaces
 */

export interface APIError {
  code: string;
  message: string;
  status: number;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: APIError;
}

export interface APIContext {
  userId: string;
}
