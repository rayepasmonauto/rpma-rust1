import { ipcClient } from '@/lib/ipc';
import type { AuthResponse } from '@/types';
import type { UserSession } from '@/lib/backend';
import type { LoginCredentials } from '@/types/auth.types';

export type { LoginCredentials };

export interface SignupCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'admin' | 'technician' | 'supervisor' | 'viewer';
}

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<AuthResponse<UserSession>> {
    try {
      const data = await ipcClient.auth.login(credentials.email, credentials.password);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  static async signup(credentials: SignupCredentials): Promise<AuthResponse<UserSession>> {
    try {
      const data = await ipcClient.auth.createAccount({
        email: credentials.email,
        first_name: credentials.firstName,
        last_name: credentials.lastName,
        password: credentials.password,
        role: credentials.role,
      });
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Signup failed',
      };
    }
  }

  static async logout(token: string): Promise<AuthResponse<void>> {
    try {
      await ipcClient.auth.logout();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      };
    }
  }

  static async validateSession(token: string): Promise<AuthResponse<UserSession>> {
    try {
      const data = await ipcClient.auth.validateSession();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Session validation failed',
      };
    }
  }

  static async updateUserEmail(
    userId: string,
    newEmail: string,
    sessionToken?: string
  ): Promise<AuthResponse<UserSession>> {
    try {
      if (sessionToken) {
        const data = await ipcClient.users.updateEmail(userId, newEmail) as UserSession;
        return { success: true, data };
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update email',
      };
    }
  }

  static async updateUserPassword(
    userId: string,
    newPassword: string,
    sessionToken?: string
  ): Promise<AuthResponse<void>> {
    try {
      if (sessionToken) {
        await ipcClient.users.changePassword(userId, newPassword);
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update password',
      };
    }
  }

  static async banUser(userId: string, sessionToken?: string): Promise<AuthResponse<void>> {
    try {
      if (sessionToken) {
        await ipcClient.users.banUser(userId);
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to ban user',
      };
    }
  }

  static async deleteUser(userId: string, sessionToken?: string): Promise<AuthResponse<void>> {
    try {
      if (sessionToken) {
        await ipcClient.users.delete(userId);
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete user',
      };
    }
  }
}

export const authService = AuthService;
