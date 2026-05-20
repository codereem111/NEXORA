/**
 * Gallery Management
 * Handles gallery display, lazy loading, and image interactions
 */

import UploadService from '../../services/uploads.js';
import AuthService from '../../services/auth.js';
import ActivityLogger from '../../utils/logger.js';
import { formatDate } from '../../utils/helpers.js';
import {
  Toast,
  Modal,
  ImageViewer,
  ConfirmDialog,
  Spinner,
  Skeleton,
} from './ui.js';

class Gallery {
  constructor() {
    this.images = [];
    this.container = null;
    this.isLoading = false;
    this.observer = null;
  }

  /**
   * Initialize gallery
   * @param {string} containerId - Container element ID
   */
  async init(containerId) {
    const query = String(containerId || '').trim();
    this.container = query.startsWith('#')
      ? document.querySelector(query)
      : document.getElementById(query) || document.querySelector(query);

    if (!this.container) {
      console.error('Gallery container not found');
      return;
    }

    await this.loadImages();
    this.setupLazyLoading();
  }

  /**
   * Load images from database
   */
  async loadImages() {
    try {
      this.isLoading = true;
      Skeleton.show(this.container, 'item', 8);

      const user = await AuthService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      this.images = await UploadService.getGalleryImages();

      if (!this.images || this.images.length === 0) {
        this.container.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
            <p style="color: rgba(255,255,255,0.6); font-size: 1.125rem;">
              No images uploaded yet
            </p>
          </div>
        `;
        return;
      }

      await this.render();
    } catch (error) {
      console.error('[Gallery Load Error]', error);
      Toast.error('Failed to load images');
      this.container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
          <p style="color: var(--danger);">Failed to load images</p>
        </div>
      `;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Render gallery items
   */
  async render() {
    try {
      this.container.innerHTML = '';
      this.container.className = 'gallery-grid animate-fade-in';

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
            <button class="gallery-btn view-btn" title="View">👁️</button>
            <button class="gallery-btn delete-btn" title="Delete">🗑️</button>
          </div>
        `;

        // Attach click handlers
        const viewButton = item.querySelector('.view-btn');
        const deleteButton = item.querySelector('.delete-btn');
        const imageElement = item.querySelector('.gallery-image');

        item.addEventListener('click', async () => {
          await this.viewImage(image);
        });

        viewButton.addEventListener('click', async e => {
          e.stopPropagation();
          await this.viewImage(image);
        });

        deleteButton.addEventListener('click', async e => {
          e.stopPropagation();
          await this.deleteImage(image);
        });

        imageElement.draggable = false;
        imageElement.addEventListener('contextmenu', e => e.preventDefault());
        imageElement.addEventListener('mousedown', e => e.preventDefault());

        this.container.appendChild(item);
      }

      // Setup lazy loading for images
      this.setupLazyLoading();
    } catch (error) {
      console.error('[Gallery Render Error]', error);
      Toast.error('Failed to render gallery');
    }
  }

  /**
   * Setup lazy loading observer
   */
  setupLazyLoading() {
    if (this.observer) this.observer.disconnect();

    const options = {
      root: null,
      rootMargin: '50px',
      threshold: 0.01,
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(async entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.dataset.src;

          if (src && !img.src.includes('storage.googleapis.com') && !img.src.includes('supabase')) {
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

          this.observer.unobserve(img);
        }
      });
    }, options);

    this.container.querySelectorAll('[data-src]').forEach(img => {
      this.observer.observe(img);
    });
  }

  /**
   * View image in modal
   */
  async viewImage(image) {
    try {
      const signedUrl = await UploadService.getSignedUrl(image.storage_path);
      ImageViewer.show(
        signedUrl,
        image.file_name || 'Image'
      );

      // Log view activity
      await ActivityLogger.logImageView(image.id);
    } catch (error) {
      console.error('[View Image Error]', error);
      Toast.error('Failed to view image');
    }
  }

  /**
   * Delete image
   */
  async deleteImage(image) {
    ConfirmDialog.show(
      `Delete "${image.file_name}"?`,
      async () => {
        try {
          const { error } = await UploadService.deleteImage(
            image.storage_path,
            image.id
          );

          if (error) throw error;

          Toast.success('Image deleted successfully');
          await this.loadImages();
        } catch (error) {
          console.error('[Delete Error]', error);
          Toast.error('Failed to delete image');
        }
      }
    );
  }

  /**
   * Add new image to gallery
   */
  async addImage(image) {
    this.images.unshift(image);
    await this.render();
  }
}

export default Gallery;
