/**
 * Route Guards
 * Protects routes and ensures authorization
 */

import AuthService from './auth.js';
import ActivityLogger from '../utils/logger.js';
import CONFIG from '../config/config.js';

class RouteGuard {
  /**
   * Check if user is authenticated
   * @returns {boolean} - Is authenticated
   */
  static async isAuthenticated() {
    const session = await AuthService.getCurrentSession();
    if (session) return true;

    const user = await AuthService.getCurrentUser();
    return !!user;
  }

  /**
   * Check if user is authorized (approved)
   * @returns {boolean} - Is authorized
   */
  static async isAuthorized() {
    const user = await AuthService.getCurrentUser();
    if (!user) return false;

    const isApproved = await AuthService.isUserApproved(user.email);
    return isApproved;
  }

  /**
   * Check if user is admin
   * @returns {boolean} - Is admin
   */
  static async isAdmin() {
    const user = await AuthService.getCurrentUser();
    if (!user) return false;

    const isAdmin = await AuthService.isUserAdmin(user.email);
    return isAdmin;
  }

  /**
   * Guard a protected route
   * @param {string} currentPage - Current page URL
   * @param {string} redirectTo - Where to redirect if not authenticated
   */
  static async guardRoute(currentPage, redirectTo = CONFIG.routes.login) {
    const isAuth = await this.isAuthenticated();

    if (!isAuth) {
      sessionStorage.setItem('redirectAfterLogin', currentPage);
      window.location.href = redirectTo;
      return;
    }
  }

  /**
   * Guard admin route
   * @param {string} currentPage - Current page URL
   * @param {string} redirectTo - Where to redirect if not admin
   */
  static async guardAdminRoute(
    currentPage,
    redirectTo = CONFIG.routes.dashboard
  ) {
    const isAuth = await this.isAuthenticated();
    if (!isAuth) {
      sessionStorage.setItem('redirectAfterLogin', currentPage);
      window.location.href = CONFIG.routes.login;
      return;
    }

    const isAdminUser = await this.isAdmin();
    if (!isAdminUser) {
      await ActivityLogger.logUnauthorizedAccess(currentPage);
      window.location.href = redirectTo;
      return;
    }
  }

  /**
   * Guard approved-users-only route
   * @param {string} currentPage - Current page URL
   * @param {string} redirectTo - Where to redirect if not approved
   */
  static async guardApprovedRoute(
    currentPage,
    redirectTo = CONFIG.routes.home
  ) {
    const isAuth = await this.isAuthenticated();
    if (!isAuth) {
      sessionStorage.setItem('redirectAfterLogin', currentPage);
      window.location.href = CONFIG.routes.login;
      return;
    }

    const isAuthUser = await this.isAuthorized();
    if (!isAuthUser) {
      await ActivityLogger.logUnauthorizedAccess(currentPage);
      window.location.href = redirectTo;
      return;
    }
  }

  /**
   * Get redirect URL after successful login
   * @returns {string} - Redirect URL
   */
  static getPostLoginRedirect() {
    const redirect = sessionStorage.getItem('redirectAfterLogin');
    sessionStorage.removeItem('redirectAfterLogin');

    if (
      !redirect ||
      redirect === CONFIG.routes.login ||
      redirect === CONFIG.routes.home
    ) {
      return CONFIG.routes.dashboard;
    }

    return redirect;
  }

  /**
   * Clear all stored redirects
   */
  static clearRedirects() {
    sessionStorage.removeItem('redirectAfterLogin');
  }
}

export default RouteGuard;
