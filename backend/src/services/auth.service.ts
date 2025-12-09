import { getCurrentUser, login, logout, refreshToken, register } from './api/authApi';

export const authService = {
  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
      const data = await login(email, password);
    return data;
  },

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string) {
      const data = await register(email, password, ''); // Name would need to be provided in a real implementation
    return data;
  },

  /**
   * Sign out the current user
   */
  async signOut() {
    await logout();
  },

  /**
   * Get the current session
   */
  async getSession() {
      const data = await refreshToken();
    return data;
  },

  /**
   * Check if a user is an admin
   */
  async isAdmin() {
    try {
      const user = await getCurrentUser();
      return user && user.role === 'admin';
    } catch (error) {
      return false;
    }
  }
};
