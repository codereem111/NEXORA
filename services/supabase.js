/**
 * Supabase Client Configuration
 * Central Supabase client setup and utilities
 */

// Import Supabase client library
// Note: Add this to your index.html: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
import CONFIG from '../config/config.js';

let supabaseClient = null;

function normalizeSupabaseUrl(url) {
  if (!url) return url;
  url = url.trim();
  url = url.replace(/\/+$/, '');
  url = url.replace(/\/rest\/v1$/i, '');
  return url;
}

/**
 * Initialize Supabase client
 * @returns {Object} - Supabase client instance
 */
export function initSupabase() {
  const rawUrl =
    localStorage.getItem('sb_url') ||
    (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_URL) ||
    (CONFIG && CONFIG.supabase && CONFIG.supabase.url);
  const supabaseUrl = normalizeSupabaseUrl(rawUrl);

  const supabaseKey =
    localStorage.getItem('sb_key') ||
    (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_ANON_KEY) ||
    (CONFIG && CONFIG.supabase && CONFIG.supabase.key);

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase credentials not found. Please set environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
    );
  }

  console.debug('[Supabase Init]', {
    url: supabaseUrl,
    keyPreview: supabaseKey ? `${supabaseKey.slice(0, 10)}...${supabaseKey.slice(-10)}` : null,
  });

  // Use the global Supabase library provided by the CDN (loaded in pages before modules).
  if (!globalThis.supabase || !globalThis.supabase.createClient) {
    throw new Error(
      'Supabase client library not found. Include the CDN script (https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2) before your module scripts.'
    );
  }

  supabaseClient = globalThis.supabase.createClient(supabaseUrl, supabaseKey);
  return supabaseClient;
}

/**
 * Get Supabase client instance
 * @returns {Object} - Supabase client
 */
export function getSupabase() {
  if (!supabaseClient) {
    initSupabase();
  }
  return supabaseClient;
}

// Export for easier importing
export const supabase = new Proxy(
  {},
  {
    get: (target, prop) => {
      const client = getSupabase();
      return client[prop];
    },
  }
);

/**
 * Check if Supabase is configured
 * @returns {boolean} - Is configured
 */
export function isSupabaseConfigured() {
  const rawUrl =
    localStorage.getItem('sb_url') ||
    (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_URL) ||
    (CONFIG && CONFIG.supabase && CONFIG.supabase.url);
  const url = normalizeSupabaseUrl(rawUrl);

  const key =
    localStorage.getItem('sb_key') ||
    (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_ANON_KEY) ||
    (CONFIG && CONFIG.supabase && CONFIG.supabase.key);
  return !!(url && key);
}

/**
 * Set Supabase credentials (for setup/configuration)
 * @param {string} url - Supabase project URL
 * @param {string} key - Supabase anon key
 */
export function setSupabaseCredentials(url, key) {
  localStorage.setItem('sb_url', normalizeSupabaseUrl(url));
  localStorage.setItem('sb_key', key);
  supabaseClient = null; // Reset client to reinitialize with new credentials
  initSupabase();
}

export default supabase;
