/**
 * Admin Dashboard Management
 * Handles admin operations: user management, approvals, image management
 */

import AuthService from '../../services/auth.js';
import UploadService from '../../services/uploads.js';
import { supabase } from '../../services/supabase.js';
import ActivityLogger from '../../utils/logger.js';
import { formatDate, formatFileSize } from '../../utils/helpers.js';
import {
  Toast,
  Modal,
  ConfirmDialog,
  Spinner,
  Skeleton,
  FormValidator,
} from './ui.js';
import CONFIG from '../../config/config.js';

class AdminDashboard {
  constructor() {
    this.users = [];
    this.images = [];
    this.logs = [];
  }

  /**
   * Initialize admin dashboard
   */
  async init() {
    try {
      // Check admin status
      const user = await AuthService.getCurrentUser();
      if (!user) {
        window.location.href = CONFIG.routes.login;
        return;
      }

      const isAdmin = await AuthService.isUserAdmin(user.id);
      if (!isAdmin) {
        window.location.href = CONFIG.routes.dashboard;
        return;
      }

      // Setup navigation
      this.setupNavigation();
      
      // Load initial data
      await this.loadUsers();
      await this.loadImages();
      await this.loadActivityLogs();
    } catch (error) {
      console.error('[Admin Init Error]', error);
      Toast.error('Failed to initialize admin dashboard');
    }
  }

  /**
   * Setup navigation between admin sections
   */
  setupNavigation() {
    const navLinks = document.querySelectorAll('[data-admin-nav]');
    const sections = document.querySelectorAll('[data-admin-section]');

    navLinks.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const sectionName = link.dataset.adminNav;

        navLinks.forEach(l => l.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));

        link.classList.add('active');
        const section = document.querySelector(`[data-admin-section="${sectionName}"]`);
        if (section) section.classList.add('active');
      });
    });
  }

  /**
   * Load all users
   */
  async loadUsers() {
    try {
      const container = document.getElementById('users-table');
      if (!container) return;

      Skeleton.show(container, 'item', 5);

      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.users = users || [];
      this.renderUsers();
    } catch (error) {
      console.error('[Load Users Error]', error);
      Toast.error('Failed to load users');
    }
  }

  /**
   * Render users table
   */
  renderUsers() {
    const container = document.getElementById('users-table');
    if (!container) return;

    if (this.users.length === 0) {
      container.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: rgba(255,255,255,0.6);">
          No users found
        </div>
      `;
      return;
    }

    let html = `
      <div class="table-wrapper animate-fade-in">
        <table class="table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
    `;

    this.users.forEach(user => {
      const approved = user.approved ? 'approved' : 'pending';
      const statusClass = approved === 'approved' ? 'success' : 'warning';

      html += `
        <tr>
          <td>${user.email}</td>
          <td>
            <span class="badge badge-${user.role === 'admin' ? 'primary' : 'secondary'}">
              ${user.role}
            </span>
          </td>
          <td>
            <span class="status-badge ${approved}">
              ${approved}
            </span>
          </td>
          <td>${formatDate(user.created_at)}</td>
          <td>
            <div class="action-buttons">
              <button class="btn-icon approve-btn" title="Toggle Approval" data-user-id="${user.id}" data-approved="${user.approved}">
                ${user.approved ? '✗' : '✓'}
              </button>
              <button class="btn-icon role-btn" title="Change Role" data-user-id="${user.id}" data-role="${user.role}">
                👤
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = html;

    // Attach event listeners
    container.querySelectorAll('.approve-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.toggleUserApproval(btn.dataset.userId, !JSON.parse(btn.dataset.approved));
      });
    });

    container.querySelectorAll('.role-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.changeUserRole(btn.dataset.userId, btn.dataset.role);
      });
    });
  }

  /**
   * Toggle user approval status
   */
  async toggleUserApproval(userId, approved) {
    try {
      const user = this.users.find(u => u.id === userId);
      if (!user) return;

      const { error } = await supabase
        .from('users')
        .update({ approved })
        .eq('id', userId);

      if (error) throw error;

      await ActivityLogger.logUserApproval(user.email, approved);
      Toast.success(`User ${approved ? 'approved' : 'revoked'}`);
      await this.loadUsers();
    } catch (error) {
      console.error('[Approval Error]', error);
      Toast.error('Failed to update user');
    }
  }

  /**
   * Change user role
   */
  changeUserRole(userId, currentRole) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;

    const newRole = currentRole === 'admin' ? 'user' : 'admin';

    ConfirmDialog.show(
      `Change ${user.email} role to ${newRole}?`,
      async () => {
        try {
          const { error } = await supabase
            .from('users')
            .update({ role: newRole })
            .eq('id', userId);

          if (error) throw error;

          await ActivityLogger.logUserRoleChange(user.email, newRole);
          Toast.success(`Role changed to ${newRole}`);
          await this.loadUsers();
        } catch (error) {
          console.error('[Role Change Error]', error);
          Toast.error('Failed to change role');
        }
      }
    );
  }

  /**
   * Load all images
   */
  async loadImages() {
    try {
      const container = document.getElementById('images-gallery');
      if (!container) return;

      Skeleton.show(container, 'item', 8);

      this.images = await UploadService.getAllImages();
      this.renderImages();
    } catch (error) {
      console.error('[Load Images Error]', error);
      Toast.error('Failed to load images');
    }
  }

  /**
   * Render images gallery
   */
  async renderImages() {
    const container = document.getElementById('images-gallery');
    if (!container) return;

    if (!this.images || this.images.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; padding: 2rem; text-align: center; color: rgba(255,255,255,0.6);">
          No images uploaded
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    container.className = 'gallery-grid animate-fade-in';

    for (const image of this.images) {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.innerHTML = `
        <img class="gallery-image" 
             src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23222' width='200' height='200'/%3E%3C/svg%3E"
             alt="Loading..."
             data-src="${image.storage_path}"
             loading="lazy">
        <div class="gallery-overlay">
          <button class="gallery-btn delete-btn" title="Delete">🗑️</button>
        </div>
        <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 0.5rem; background: rgba(0,0,0,0.7); font-size: 0.75rem; color: rgba(255,255,255,0.8);">
          ${formatFileSize(image.file_size)} • ${formatDate(image.created_at)}
        </div>
      `;

      item.querySelector('.delete-btn').addEventListener('click', async () => {
        this.deleteImage(image);
      });

      container.appendChild(item);
    }

    // Lazy load images
    this.setupImageLazyLoading(container);
  }

  /**
   * Setup lazy loading for admin images
   */
  setupImageLazyLoading(container) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(async entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.dataset.src;
          if (src) {
            try {
              const signedUrl = await UploadService.getSignedUrl(src);
              if (signedUrl) {
                img.src = signedUrl;
                img.classList.add('animate-fade-in');
              }
            } catch (error) {
              console.error('[Lazy Load Error]', error);
            }
          }
          observer.unobserve(img);
        }
      });
    });

    container.querySelectorAll('[data-src]').forEach(img => {
      observer.observe(img);
    });
  }

  /**
   * Delete image
   */
  deleteImage(image) {
    ConfirmDialog.show(
      `Delete image "${image.file_name}"?`,
      async () => {
        try {
          const { error } = await UploadService.deleteImage(
            image.storage_path,
            image.id
          );

          if (error) throw error;

          Toast.success('Image deleted');
          await this.loadImages();
        } catch (error) {
          console.error('[Delete Error]', error);
          Toast.error('Failed to delete image');
        }
      }
    );
  }

  /**
   * Load activity logs
   */
  async loadActivityLogs() {
    try {
      const container = document.getElementById('activity-logs');
      if (!container) return;

      Skeleton.show(container, 'item', 5);

      const { data: logs, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;

      this.logs = logs || [];
      this.renderActivityLogs();
    } catch (error) {
      console.error('[Load Logs Error]', error);
      Toast.error('Failed to load activity logs');
    }
  }

  /**
   * Render activity logs
   */
  renderActivityLogs() {
    const container = document.getElementById('activity-logs');
    if (!container) return;

    if (this.logs.length === 0) {
      container.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: rgba(255,255,255,0.6);">
          No activity logs
        </div>
      `;
      return;
    }

    let html = `<div class="activity-feed animate-fade-in">`;

    this.logs.forEach(log => {
      const icon = this.getActivityIcon(log.action);
      html += `
        <div class="activity-item">
          <div class="activity-icon">${icon}</div>
          <div class="activity-content">
            <div class="activity-title">${log.action.replace(/_/g, ' ')}</div>
            <div style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">
              ${log.user_email} • ${formatDate(log.timestamp)}
            </div>
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  }

  /**
   * Get activity icon based on action
   */
  getActivityIcon(action) {
    const icons = {
      USER_LOGIN: '🔓',
      USER_LOGOUT: '🔒',
      IMAGE_UPLOAD: '📤',
      IMAGE_DELETE: '🗑️',
      USER_APPROVAL_CHANGED: '✓',
      USER_ROLE_CHANGED: '👤',
      UNAUTHORIZED_ACCESS_ATTEMPT: '⚠️',
    };
    return icons[action] || '•';
  }
}

export default AdminDashboard;
