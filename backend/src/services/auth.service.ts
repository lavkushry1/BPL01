import { getCurrentUser, login, logout, refreshToken, register } from './api/authApi';

export const authService = {
  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    try {
      const data = await login(email, password);
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string) {
    try {
      const data = await register(email, password, ''); // Name would need to be provided in a real implementation
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Sign out the current user
   */
  async signOut() {
    try {
      await logout();
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get the current session
   */
  async getSession() {
    try {
      const data = await refreshToken();
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Check if a user is an admin
   */
  async isAdmin(email: string) {
    try {
      const user = await getCurrentUser();
      return user && user.role === 'admin';
    } catch (error) {
      return false;
    }
  }
};
