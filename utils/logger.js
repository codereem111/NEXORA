/**
 * Activity Logger
 * Logs user activities to Supabase for audit trails
 */

import { supabase } from '../services/supabase.js';

class ActivityLogger {
  /**
   * Log an activity to the database
   * @param {string} action - Action description
   * @param {Object} metadata - Additional metadata
   */
  static async logActivity(action, metadata = {}) {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.warn('No user logged in, activity not logged');
        return;
      }

      const { data, error } = await supabase
        .from('activity_logs')
        .insert({
          user_email: user.email,
          action,
          metadata: JSON.stringify(metadata),
          timestamp: new Date().toISOString(),
          ip_address: await this.getClientIp(),
        });

      if (error) throw error;
      
      console.log('[Activity Logged]', action, metadata);
    } catch (error) {
      console.error('[Logger Error]', error);
      // Don't throw - logging shouldn't break the app
    }
  }

  /**
   * Get current logged-in user
   * @returns {Object|null} - User object or null
   */
  static async getCurrentUser() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Get client IP address (best effort)
   * @returns {string} - Client IP address or 'unknown'
   */
  static async getClientIp() {
    try {
      const response = await fetch('https://api.ipify.org?format=json', { 
        signal: AbortSignal.timeout(3000) 
      });
      const data = await response.json();
      return data.ip || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Log specific actions with semantic meaning
   */
  static async logLogin(email) {
    await this.logActivity('USER_LOGIN', { email });
  }

  static async logLogout(email) {
    await this.logActivity('USER_LOGOUT', { email });
  }

  static async logImageUpload(fileName, fileSize) {
    await this.logActivity('IMAGE_UPLOAD', { 
      filename: fileName, 
      filesize: fileSize 
    });
  }

  static async logImageDelete(imageId) {
    await this.logActivity('IMAGE_DELETE', { imageId });
  }

  static async logImageView(imageId) {
    await this.logActivity('IMAGE_VIEW', { imageId });
  }

  static async logUserApproval(email, approved) {
    await this.logActivity('USER_APPROVAL_CHANGED', { 
      email, 
      approved 
    });
  }

  static async logUserRoleChange(email, role) {
    await this.logActivity('USER_ROLE_CHANGED', { 
      email, 
      newRole: role 
    });
  }

  static async logUnauthorizedAccess(route) {
    await this.logActivity('UNAUTHORIZED_ACCESS_ATTEMPT', { 
      attemptedRoute: route 
    });
  }
}

export default ActivityLogger;
