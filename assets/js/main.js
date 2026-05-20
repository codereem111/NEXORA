/**
 * Main Application Initialization
 * Entry point for the application
 */

import AuthService from '../../services/auth.js';
import RouteGuard from '../../services/guards.js';
import { Toast, Dropdown } from './ui.js';

class App {
  static async init() {
    try {
      // Initialize UI components
      Dropdown.init();

      // Setup auth state listener
      this.setupAuthListener();

      // Setup navigation
      this.setupNavigation();

      // Check if user is authenticated
      const session = await AuthService.getCurrentSession();
      if (session) {
        // User is authenticated
        const user = await AuthService.getCurrentUser();
        console.log('[App] User logged in:', user?.email);
        this.updateUserUI(user);
      } else {
        // User is not authenticated
        this.updateUserUI(null);
      }
    } catch (error) {
      console.error('[App Init Error]', error);
    }
  }

  /**
   * Setup authentication state listener
   */
  static setupAuthListener() {
    AuthService.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        console.log('[Auth Event] User signed in');
        if (session?.user) {
          // Only redirect to dashboard if the user is approved by the server
          try {
            const approved = await AuthService.isUserApproved(session.user.email);
            if (
              approved &&
              (window.location.pathname.endsWith('/login') || window.location.pathname.endsWith('/login/') || window.location.pathname.endsWith('/login/index.html'))
            ) {
              window.location.href = '/workspace';
              return;
            }

            if (!approved) {
              // Show a friendly message and update UI; do not force navigation.
              Toast.error('Your account is pending approval.');
            }

            await this.updateUserUI(session.user);
          } catch (err) {
            console.error('[Auth Listener - approval check]', err);
            Toast.error('Login succeeded but approval check failed. Check console.');
            await this.updateUserUI(session.user);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('[Auth Event] User signed out');
        window.location.href = '/login';
      }
    });
  }

  /**
   * Setup global navigation
   */
  static setupNavigation() {
    // Logout buttons
    document.querySelectorAll('[data-logout]').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.preventDefault();
        await this.logout();
      });
    });

    // Home button
    document.querySelectorAll('[data-home]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        window.location.href = '/index.html';
      });
    });

    // Mobile sidebar toggles
    const sidebar = document.querySelector('.sidebar');
    const sidebarOpenButtons = document.querySelectorAll('[data-sidebar-open]');
    const sidebarCloseButtons = document.querySelectorAll('[data-sidebar-close]');

    const closeSidebar = () => {
      if (!sidebar) return;
      sidebar.classList.remove('mobile-visible');
      sidebar.classList.add('mobile-hidden');
    };

    const openSidebar = () => {
      if (!sidebar) return;
      sidebar.classList.add('mobile-visible');
      sidebar.classList.remove('mobile-hidden');
    };

    sidebarOpenButtons.forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        openSidebar();
      });
    });

    sidebarCloseButtons.forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        closeSidebar();
      });
    });

    if (sidebar && window.innerWidth <= 768) {
      sidebar.classList.add('mobile-hidden');
    }
  }

  /**
   * Update UI based on authentication status
   */
  static async updateUserUI(user) {
    // Update user avatar/name
    const userElements = document.querySelectorAll('[data-user-name]');
    const avatarElements = document.querySelectorAll('[data-user-avatar]');

    if (user) {
      const initials = user.email
        .split('@')[0]
        .split('.')
        .map(p => p[0].toUpperCase())
        .join('')
        .substring(0, 2);

      userElements.forEach(el => {
        el.textContent = user.email;
      });

      avatarElements.forEach(el => {
        el.textContent = initials;
      });

      // Show authenticated UI elements
      document.querySelectorAll('[data-auth-required]').forEach(el => {
        el.classList.remove('hidden');
      });
      document.querySelectorAll('[data-guest-only]').forEach(el => {
        el.classList.add('hidden');
      });
    } else {
      // Show guest UI elements
      document.querySelectorAll('[data-auth-required]').forEach(el => {
        el.classList.add('hidden');
      });
      document.querySelectorAll('[data-guest-only]').forEach(el => {
        el.classList.remove('hidden');
      });
    }
  }

  /**
   * Logout user
   */
  static async logout() {
    try {
      const { error } = await AuthService.logout();
      if (error) throw error;

      Toast.success('Logged out successfully');
      window.location.href = '/index.html';
    } catch (error) {
      console.error('[Logout Error]', error);
      Toast.error('Logout failed');
    }
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}

export default App;
