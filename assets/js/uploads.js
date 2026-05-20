/**
 * Image Upload Management
 * Handles image uploads, drag-drop, and form submission
 */

import UploadService from '../../services/uploads.js';
import { supabase } from '../../services/supabase.js';
import AuthService from '../../services/auth.js';
import { Toast, Modal, FormValidator } from './ui.js';
import Gallery from './gallery.js';

class UploadManager {
  constructor(uploadAreaSelector, fileInputSelector, gallerySelector) {
    this.uploadArea = document.querySelector(uploadAreaSelector);
    this.fileInput = document.querySelector(fileInputSelector);
    this.gallery = new Gallery();
    this.gallerySelector = gallerySelector;
    this.isUploading = false;
  }

  /**
   * Initialize upload manager
   */
  async init() {
    try {
      await this.gallery.init(this.gallerySelector);
      this.setupUploadArea();
      this.setupFileInput();
    } catch (error) {
      console.error('[Upload Init Error]', error);
      Toast.error('Failed to initialize upload manager');
    }
  }

  /**
   * Setup upload area drag-drop
   */
  setupUploadArea() {
    if (!this.uploadArea) return;

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      this.uploadArea.addEventListener(eventName, preventDefaults, false);
      document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight upload area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
      this.uploadArea.addEventListener(
        eventName,
        () => this.uploadArea.classList.add('dragover'),
        false
      );
    });

    ['dragleave', 'drop'].forEach(eventName => {
      this.uploadArea.addEventListener(
        eventName,
        () => this.uploadArea.classList.remove('dragover'),
        false
      );
    });

    // Handle dropped files
    this.uploadArea.addEventListener('drop', e => {
      const dt = e.dataTransfer;
      const files = dt.files;
      this.handleFiles(files);
    });

    // Click to upload
    this.uploadArea.addEventListener('click', () => {
      this.fileInput.click();
    });
  }

  /**
   * Setup file input change
   */
  setupFileInput() {
    if (!this.fileInput) return;

    this.fileInput.addEventListener('change', e => {
      this.handleFiles(e.target.files);
    });
  }

  /**
   * Handle multiple files upload
   */
  async handleFiles(files) {
    if (this.isUploading) {
      Toast.warning('Upload in progress...');
      return;
    }

    const fileArray = Array.from(files);

    if (fileArray.length === 0) return;

    // Validate files
    const validFiles = fileArray.filter(file => {
      try {
        UploadService.validateFile(file);
        return true;
      } catch (error) {
        Toast.error(`${file.name}: ${error.message}`);
        return false;
      }
    });

    if (validFiles.length === 0) return;

    // Upload files
    await this.uploadFiles(validFiles);
  }

  /**
   * Upload files one by one
   */
  async uploadFiles(files) {
    try {
      this.isUploading = true;
      const user = await AuthService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      for (const file of files) {
        try {
          const { path, error } = await UploadService.uploadImage(file, user.id);

          if (error) {
            Toast.error(`Failed to upload ${file.name}`);
            continue;
          }

          Toast.success(`Uploaded ${file.name}`);

          // Add to gallery
          const { data } = await supabase
            .from('uploads')
            .select('*')
            .eq('storage_path', path)
            .single();

          if (data) {
            await this.gallery.addImage(data);
          }
        } catch (error) {
          console.error('[Upload Error]', error);
          Toast.error(`Failed to upload ${file.name}`);
        }
      }
    } catch (error) {
      console.error('[Upload Manager Error]', error);
      Toast.error('Upload failed');
    } finally {
      this.isUploading = false;
      // Reset file input
      if (this.fileInput) this.fileInput.value = '';
    }
  }
}

/**
 * Prevent default drag behavior
 */
function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

export default UploadManager;
