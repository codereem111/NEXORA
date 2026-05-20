/**
 * UI Utilities
 * Handles modals, toasts, and common UI interactions
 */

/**
 * Toast Notification
 */
class Toast {
  static container = null;

  static init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  }

  static show(message, type = 'info', duration = 3000) {
    this.init();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-icon">
        ${this.getIcon(type)}
      </div>
      <div class="toast-message">${message}</div>
      <button class="toast-close" type="button">×</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.remove();
    });

    this.container.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        toast.remove();
      }, duration);
    }

    return toast;
  }

  static success(message, duration = 3000) {
    return this.show(message, 'success', duration);
  }

  static error(message, duration = 3000) {
    return this.show(message, 'error', duration);
  }

  static warning(message, duration = 3000) {
    return this.show(message, 'warning', duration);
  }

  static info(message, duration = 3000) {
    return this.show(message, 'info', duration);
  }

  static getIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };
    return icons[type] || icons.info;
  }
}

/**
 * Modal Dialog
 */
class Modal {
  constructor(options = {}) {
    this.title = options.title || 'Modal';
    this.body = options.body || '';
    this.footer = options.footer || true;
    this.buttons = options.buttons || [];
    this.fullscreen = options.fullscreen || false;
    this.onClose = options.onClose || null;
    this.modal = null;
    this.overlay = null;
  }

  create() {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.addEventListener('contextmenu', e => e.preventDefault());

    // Create modal
    this.modal = document.createElement('div');
    this.modal.className = `modal${this.fullscreen ? ' fullscreen' : ''}`;

    // Header
    let html = `
      <div class="modal-header">
        <h3 class="modal-title">${this.title}</h3>
        <button type="button" class="modal-close">×</button>
      </div>
      <div class="modal-body">${this.body}</div>
    `;

    // Footer
    if (this.footer) {
      html += '<div class="modal-footer">';
      if (this.buttons.length > 0) {
        this.buttons.forEach(btn => {
          html += `<button class="btn ${btn.class || 'btn-primary'}" data-action="${btn.action}">${btn.text}</button>`;
        });
      } else {
        html += '<button class="btn btn-secondary" data-action="close">Close</button>';
      }
      html += '</div>';
    }

    this.modal.innerHTML = html;
    this.overlay.appendChild(this.modal);
    document.body.appendChild(this.overlay);

    // Event listeners
    this.overlay.addEventListener('click', e => {
      if (e.target === this.overlay) this.close();
    });

    this.modal.querySelector('.modal-close').addEventListener('click', () => {
      this.close();
    });

    this.modal.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', e => {
        const action = e.target.dataset.action;
        if (action === 'close') {
          this.close();
        } else if (this.buttons.length > 0) {
          const button = this.buttons.find(b => b.action === action);
          if (button && button.callback) {
            button.callback();
          }
        }
      });
    });

    return this.overlay;
  }

  open() {
    this.create();
    // Trigger animation
    setTimeout(() => {
      this.overlay.classList.add('show');
    }, 10);
    return this;
  }

  close() {
    if (this.overlay) {
      this.overlay.classList.remove('show');
      setTimeout(() => {
        this.overlay.remove();
        if (this.onClose) this.onClose();
      }, 300);
    }
    return this;
  }

  getBody() {
    return this.modal?.querySelector('.modal-body');
  }

  setLoading(isLoading) {
    const button = this.modal?.querySelector('[data-action]');
    if (button) {
      if (isLoading) {
        button.classList.add('btn-loading');
        button.disabled = true;
      } else {
        button.classList.remove('btn-loading');
        button.disabled = false;
      }
    }
  }
}

/**
 * Image Modal Viewer
 */
class ImageViewer {
  static show(imageUrl, title = '') {
    const modal = new Modal({
      title: title || 'Image Preview',
      body: `<div class="image-viewer-frame"><img src="${imageUrl}" class="image-viewer-img" draggable="false" alt="${title || 'Image'}"></div>`,
      footer: false,
      fullscreen: true,
    });
    modal.open();
  }
}

/**
 * Confirmation Dialog
 */
class ConfirmDialog {
  static show(message, onConfirm, onCancel) {
    const modal = new Modal({
      title: 'Confirm Action',
      body: `<p>${message}</p>`,
      buttons: [
        {
          text: 'Cancel',
          action: 'cancel',
          class: 'btn btn-secondary',
          callback: () => {
            modal.close();
            if (onCancel) onCancel();
          },
        },
        {
          text: 'Confirm',
          action: 'confirm',
          class: 'btn btn-danger',
          callback: () => {
            if (onConfirm) onConfirm();
            modal.close();
          },
        },
      ],
    });
    modal.open();
    return modal;
  }
}

/**
 * Loading Spinner
 */
class Spinner {
  static create(size = 'md') {
    const spinner = document.createElement('div');
    spinner.className = `spinner spinner-${size}`;
    return spinner;
  }

  static show(target, size = 'md') {
    const container = typeof target === 'string' ? document.querySelector(target) : target;
    if (container) {
      container.innerHTML = '';
      container.appendChild(this.create(size));
    }
  }

  static hide(target) {
    const container = typeof target === 'string' ? document.querySelector(target) : target;
    if (container) {
      container.innerHTML = '';
    }
  }
}

/**
 * Loading Skeleton
 */
class Skeleton {
  static createTextSkeleton(lines = 3) {
    let html = '';
    for (let i = 0; i < lines; i++) {
      html += '<div class="skeleton skeleton-text" style="margin-bottom: 0.5rem;"></div>';
    }
    return html;
  }

  static createItemSkeleton(count = 3) {
    let html = '';
    for (let i = 0; i < count; i++) {
      html += '<div class="skeleton skeleton-item"></div>';
    }
    return html;
  }

  static show(target, type = 'text', count = 3) {
    const container = typeof target === 'string' ? document.querySelector(target) : target;
    if (container) {
      if (type === 'text') {
        container.innerHTML = this.createTextSkeleton(count);
      } else if (type === 'item') {
        container.innerHTML = this.createItemSkeleton(count);
      }
    }
  }
}

/**
 * Dropdown Menu
 */
class Dropdown {
  static init() {
    document.querySelectorAll('[data-dropdown-toggle]').forEach(trigger => {
      const menu = document.querySelector(trigger.dataset.dropdownToggle);
      if (!menu) return;

      trigger.addEventListener('click', e => {
        e.stopPropagation();
        menu.classList.toggle('show');
      });

      menu.querySelectorAll('[data-action]').forEach(item => {
        item.addEventListener('click', () => {
          menu.classList.remove('show');
        });
      });
    });

    document.addEventListener('click', () => {
      document.querySelectorAll('[data-dropdown-toggle]').forEach(trigger => {
        const menu = document.querySelector(trigger.dataset.dropdownToggle);
        if (menu) menu.classList.remove('show');
      });
    });
  }
}

/**
 * Form Validation
 */
class FormValidator {
  static validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  static validateRequired(value) {
    return value && value.trim().length > 0;
  }

  static validateMinLength(value, length) {
    return value && value.length >= length;
  }

  static validateMatch(value1, value2) {
    return value1 === value2;
  }

  static showError(input, message) {
    const errorEl = input.nextElementSibling;
    if (errorEl && errorEl.classList.contains('form-error')) {
      errorEl.textContent = message;
    } else {
      const error = document.createElement('small');
      error.className = 'form-error';
      error.textContent = message;
      input.parentNode.insertBefore(error, input.nextSibling);
    }
    input.style.borderColor = 'var(--danger)';
  }

  static clearError(input) {
    const errorEl = input.nextElementSibling;
    if (errorEl && errorEl.classList.contains('form-error')) {
      errorEl.remove();
    }
    input.style.borderColor = '';
  }
}

/**
 * Tabs Component
 */
class Tabs {
  static init(container) {
    const triggers = container.querySelectorAll('[data-tab-trigger]');
    const contents = container.querySelectorAll('[data-tab-content]');

    triggers.forEach(trigger => {
      trigger.addEventListener('click', e => {
        e.preventDefault();
        const tabName = trigger.dataset.tabTrigger;

        triggers.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));

        trigger.classList.add('active');
        container.querySelector(`[data-tab-content="${tabName}"]`)?.classList.add('active');
      });
    });

    // Activate first tab by default
    if (triggers.length > 0) {
      triggers[0].click();
    }
  }
}

export default {
  Toast,
  Modal,
  ImageViewer,
  ConfirmDialog,
  Spinner,
  Skeleton,
  Dropdown,
  FormValidator,
  Tabs,
};

// Also provide named exports for consumers that import specific utilities
export {
  Toast,
  Modal,
  ImageViewer,
  ConfirmDialog,
  Spinner,
  Skeleton,
  Dropdown,
  FormValidator,
  Tabs,
};
