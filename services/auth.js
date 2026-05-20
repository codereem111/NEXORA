/**
 * Authentication Service
 * Handles all authentication logic with Supabase
 */

import { supabase } from './supabase.js';
import ActivityLogger from '../utils/logger.js';
import { validateEmail } from '../utils/helpers.js';

class AuthService {
  /**
   * Sign up a new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Object} - User and error
   */
  static async signup(email, password) {
    try {
      email = email?.trim().toLowerCase();

      if (!validateEmail(email)) {
        throw new Error('Invalid email format');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const cooldown = this.isEmailActionAllowed('signup', email, 300);
      if (!cooldown.allowed) {
        return {
          user: null,
          error: this.getEmailCooldownMessage('signup', cooldown.remainingSeconds),
        };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/pages/dashboard.html`,
        },
      });

      if (error) {
        const message = error?.message || '';
        if (message.toLowerCase().includes('email rate limit')) {
          return {
            user: null,
            error: 'Too many signup emails sent. Please wait a few minutes before trying again.',
          };
        }
        throw error;
      }

      let user = data?.user || data?.session?.user;
      if (!user) {
        const userResponse = await supabase.auth.getUser();
        const fetchedUser = userResponse?.data?.user;

        if (userResponse?.error) {
          throw userResponse.error;
        }

        user = fetchedUser;
      }

      if (!user || !user.id) {
        return {
          user: null,
          error:
            'Signup created an account, but the user object is not available yet. Please check your auth settings.',
        };
      }

      this.recordEmailAction('signup', email, 300);

      // Create user profile in users table
      await this.createUserProfile(user.id, email);

      return { user, error: null };
    } catch (error) {
      console.error('[Auth Error - Signup]', error);
      const message = error?.message?.includes('Invalid API key')
        ? 'Supabase API key is invalid. Update your project anon key in config/config.js or localStorage.'
        : error.message;
      return { user: null, error: message };
    }
  }

  /**
   * Login with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Object} - Session and error
   */
  static async login(email, password) {
    try {
      email = email?.trim().toLowerCase();

      if (!validateEmail(email)) {
        throw new Error('Invalid email format');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const signedInUserId = data?.user?.id || data?.session?.user?.id;

      // Check if user is approved
      const isApproved = await this.isUserApproved(email, signedInUserId);
      if (!isApproved) {
        // Do not force sign-out here. Let the client decide how to handle
        // pending accounts (for example show a friendly message or redirect).
        throw new Error('Your account is pending approval');
      }

      // Log the login activity
      await ActivityLogger.logLogin(email);

      return { session: data.session, error: null };
    } catch (error) {
      console.error('[Auth Error - Login]', error);
      const message = error?.message?.includes('Invalid API key')
        ? 'Supabase API key is invalid. Update your project anon key in config/config.js or localStorage.'
        : error.message;
      return { session: null, error: message };
    }
  }

  /**
   * Logout current user
   * @returns {Object} - Error if any
   */
  static async logout() {
    try {
      const user = await this.getCurrentUser();
      if (user) {
        await ActivityLogger.logLogout(user.email);
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('[Auth Error - Logout]', error);
      return { error: error.message };
    }
  }

  /**
   * Get current authenticated user
   * @returns {Object|null} - User object or null
   */
  static async getCurrentUser() {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (!sessionError && session?.user) {
        return session.user;
      }

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;
      return user;
    } catch (error) {
      console.error('[Auth Error - Get User]', error);
      return null;
    }
  }

  /**
   * Get current session
   * @returns {Object|null} - Session object or null
   */
  static async getCurrentSession() {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;
      return session;
    } catch (error) {
      console.error('[Auth Error - Get Session]', error);
      return null;
    }
  }

  /**
   * Create user profile in database
   * @param {string} userId - User ID from auth
   * @param {string} email - User email
   * @returns {Object} - Inserted data and error
   */
  static async createUserProfile(userId, email) {
    try {
      email = email?.trim().toLowerCase();
      const { data, error } = await supabase.from('users').insert({
        id: userId,
        email,
        role: 'user',
        approved: false,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[Auth Error - Create Profile]', error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Check if user is approved
   * @param {string} email - User email
   * @returns {boolean} - Is approved
   */
  static async isUserApproved(email, userId = null) {
    try {
      if (!userId) {
        const currentUser = await this.getCurrentUser();
        userId = currentUser?.id || null;
      }

      if (userId) {
        const { data, error } = await supabase
          .from('users')
          .select('approved')
          .eq('id', userId)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data?.approved || false;
      }

      email = email?.trim().toLowerCase();
      const { data, error } = await supabase
        .from('users')
        .select('approved')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data?.approved || false;
    } catch (error) {
      console.error('[Auth Error - Check Approved]', error);
      return false;
    }
  }

  /**
   * Get user profile details
   * @param {string} email - User email
   * @returns {Object|null} - User profile or null
   */
  static async getUserProfile(email) {
    try {
      email = email?.trim().toLowerCase();
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) return data;

      const currentUser = await this.getCurrentUser();
      if (!currentUser) return null;

      const { data: fallbackData, error: fallbackError } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (fallbackError && fallbackError.code !== 'PGRST116') throw fallbackError;
      return fallbackData || null;
    } catch (error) {
      console.error('[Auth Error - Get Profile]', error);
      return null;
    }
  }

  /**
   * Build or read email action cooldown state from localStorage
   * @returns {Object}
   */
  static getEmailCooldowns() {
    try {
      const raw = window.localStorage.getItem('nexora_email_cooldowns');
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Save email cooldown state to localStorage
   * @param {Object} cooldowns
   */
  static setEmailCooldowns(cooldowns) {
    try {
      window.localStorage.setItem('nexora_email_cooldowns', JSON.stringify(cooldowns));
    } catch (error) {
      // Ignore storage failures
    }
  }

  /**
   * Check whether an email action is allowed or still cooling down
   * @param {string} action
   * @param {string} email
   * @param {number} waitSeconds
   * @returns {{ allowed: boolean, remainingSeconds: number }}
   */
  static isEmailActionAllowed(action, email, waitSeconds = 300) {
    const cooldowns = this.getEmailCooldowns();
    const key = `${action}:${email.toLowerCase()}`;
    const timestamp = cooldowns[key] || 0;
    const remaining = Math.max(0, timestamp - Date.now());
    return {
      allowed: remaining === 0,
      remainingSeconds: Math.ceil(remaining / 1000),
    };
  }

  /**
   * Record an email action timestamp so repeated requests are delayed
   * @param {string} action
   * @param {string} email
   * @param {number} waitSeconds
   */
  static recordEmailAction(action, email, waitSeconds = 300) {
    const cooldowns = this.getEmailCooldowns();
    const key = `${action}:${email.toLowerCase()}`;
    cooldowns[key] = Date.now() + waitSeconds * 1000;
    this.setEmailCooldowns(cooldowns);
  }

  /**
   * Get a friendly cooldown message for email actions
   * @param {string} action
   * @param {number} remainingSeconds
   * @returns {string}
   */
  static getEmailCooldownMessage(action, remainingSeconds) {
    const minutes = Math.ceil(remainingSeconds / 60);
    return `Please wait ${minutes} minute${minutes === 1 ? '' : 's'} before requesting another ${action} email.`;
  }

  /**
   * Check if user is admin
   * @param {string} email - User email
   * @returns {boolean} - Is admin
   */
  static async isUserAdmin(emailOrId) {
    try {
      let profile;
      if (typeof emailOrId === 'string' && emailOrId.includes('@')) {
        profile = await this.getUserProfile(emailOrId);
      } else {
        const currentUser = await this.getCurrentUser();
        const userId = emailOrId || currentUser?.id;
        if (!userId) return false;

        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        profile = data;
      }
      return profile?.role === 'admin';
    } catch (error) {
      console.error('[Auth Error - Check Admin]', error);
      return false;
    }
  }

  /**
   * Reset password
   * @param {string} email - User email
   * @returns {Object} - Error if any
   */
  static async resetPassword(email) {
    try {
      if (!validateEmail(email)) {
        throw new Error('Invalid email format');
      }

      const cooldown = this.isEmailActionAllowed('password reset', email, 300);
      if (!cooldown.allowed) {
        return {
          error: this.getEmailCooldownMessage('password reset', cooldown.remainingSeconds),
        };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/pages/login.html`,
      });

      if (error) {
        const message = error.message || 'Failed to send password reset email';
        if (message.toLowerCase().includes('email rate limit')) {
          return {
            error: 'Too many email requests. Please wait a few minutes before trying again.',
          };
        }
        throw error;
      }

      this.recordEmailAction('password reset', email, 300);
      return { error: null };
    } catch (error) {
      console.error('[Auth Error - Reset Password]', error);
      return { error: error.message };
    }
  }

  /**
   * Update user password
   * @param {string} newPassword - New password
   * @returns {Object} - User and error
   */
  static async updatePassword(newPassword) {
    try {
      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return { user: data.user, error: null };
    } catch (error) {
      console.error('[Auth Error - Update Password]', error);
      return { user: null, error: error.message };
    }
  }

  /**
   * Listen to auth state changes
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  static onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }
}

export default AuthService;
