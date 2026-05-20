/**
 * Image Upload Service
 * Handles image uploads to Supabase storage
 */

import { supabase } from './supabase.js';
import ActivityLogger from '../utils/logger.js';
import CONFIG from '../config/config.js';
import { generateRandomId, formatFileSize } from '../utils/helpers.js';

class UploadService {
  /**
   * Upload image file
   * @param {File} file - File to upload
   * @param {string} userId - User ID
   * @returns {Object} - Uploaded data or error
   */
  static async uploadImage(file, userId) {
    try {
      // Validate file
      this.validateFile(file);

      // Generate unique filename
      const uniqueFileName = `${userId}/${Date.now()}-${generateRandomId()}-${file.name}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(CONFIG.storage.bucket)
        .upload(uniqueFileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Create database record
      const user = await this.getCurrentUser();
      const { insertError } = await supabase.from('uploads').insert({
        storage_path: data.path,
        uploaded_by: user.email,
        file_name: file.name,
        file_size: file.size,
      });

      if (insertError) {
        // Clean up: delete uploaded file if db insert fails
        await supabase.storage
          .from(CONFIG.storage.bucket)
          .remove([data.path]);
        throw insertError;
      }

      // Log activity
      await ActivityLogger.logImageUpload(file.name, file.size);

      return {
        path: data.path,
        error: null,
      };
    } catch (error) {
      console.error('[Upload Error]', error);
      let message = error.message || 'Upload failed';
      if (error?.message?.includes('Bucket not found')) {
        message = `Storage bucket "${CONFIG.storage.bucket}" not found in Supabase project ${CONFIG.supabase.url}. Create it in your Supabase Storage settings.`;
      }
      return {
        path: null,
        error: message,
      };
    }
  }

  /**
   * Validate file before upload
   * @param {File} file - File to validate
   */
  static validateFile(file) {
    if (!file) throw new Error('No file provided');

    if (file.size > CONFIG.storage.maxFileSize) {
      throw new Error(
        `File size exceeds ${formatFileSize(CONFIG.storage.maxFileSize)}`
      );
    }

    if (!CONFIG.storage.allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only images are allowed');
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
      console.error('[Upload Auth Error]', error);
      return null;
    }
  }

  /**
   * Delete image from storage and database
   * @param {string} path - Storage path
   * @param {string} imageId - Database image ID
   * @returns {Object} - Error if any
   */
  static async deleteImage(path, imageId) {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(CONFIG.storage.bucket)
        .remove([path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('uploads')
        .delete()
        .eq('id', imageId);

      if (dbError) throw dbError;

      // Log activity
      await ActivityLogger.logImageDelete(imageId);

      return { error: null };
    } catch (error) {
      console.error('[Delete Error]', error);
      return { error: error.message };
    }
  }

  /**
   * Get signed URL for secure image access
   * @param {string} path - Storage path
   * @param {number} expiresIn - Expiration time in seconds
   * @returns {string|null} - Signed URL or null
   */
  static async getSignedUrl(path, expiresIn = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from(CONFIG.storage.bucket)
        .createSignedUrl(path, expiresIn);

      if (error) throw error;

      return data.signedUrl;
    } catch (error) {
      console.error('[Signed URL Error]', error);
      return null;
    }
  }

  /**
   * Get all visible images for the gallery
   * @returns {Array|null} - Images array or null
   */
  static async getGalleryImages() {
    try {
      const { data, error } = await supabase
        .from('uploads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('[Get Gallery Images Error]', error);
      return null;
    }
  }

  /**
   * Get all images uploaded by user
   * @param {string} userEmail - User email
   * @returns {Array|null} - Images array or null
   */
  static async getUserImages(userEmail) {
    try {
      const { data, error } = await supabase
        .from('uploads')
        .select('*')
        .eq('uploaded_by', userEmail)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('[Get Images Error]', error);
      return null;
    }
  }

  /**
   * Get all images (admin only)
   * @returns {Array|null} - All images
   */
  static async getAllImages() {
    try {
      const { data, error } = await supabase
        .from('uploads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('[Get All Images Error]', error);
      return null;
    }
  }

  /**
   * Batch delete images
   * @param {Array} imageIds - Array of image IDs
   * @returns {Object} - Error if any
   */
  static async batchDeleteImages(imageIds) {
    try {
      // Get all paths for deletion
      const { data: images, error: fetchError } = await supabase
        .from('uploads')
        .select('storage_path')
        .in('id', imageIds);

      if (fetchError) throw fetchError;

      const paths = images.map(img => img.storage_path);

      // Delete from storage
      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from(CONFIG.storage.bucket)
          .remove(paths);

        if (storageError) throw storageError;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('uploads')
        .delete()
        .in('id', imageIds);

      if (dbError) throw dbError;

      return { error: null };
    } catch (error) {
      console.error('[Batch Delete Error]', error);
      return { error: error.message };
    }
  }
}

export default UploadService;
