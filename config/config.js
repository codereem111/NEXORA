/**
 * Application Configuration
 * Centralized configuration for the entire application
 */

const CONFIG = {
  // Supabase Configuration (set from provided credentials)
  supabase: {
    url: "https://zgotfrybaajysuexhuxk.supabase.co",
    key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpnb3RmcnliYWFqeXN1ZXhodXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5OTkzNjEsImV4cCI6MjA5NDU3NTM2MX0.aRoc2Dlqgy1XYqtULcLSs02XHbC3-UgjU7L5fFP5Uxo",
  },

  // Admin emails - add approved admin emails here
  adminEmails: ["alabiabdulkareem567@gmailcom", "owner@example.com"],

  // Approved emails for access (if using allowlist)
  approvedEmails: ["user@example.com", "client@example.com"],

  // App Configuration
  app: {
    name: "CPE Nexora",
    version: "1.0.0",
    description: "Computer engineering student asset protection workspace",
  },

  // Storage Configuration
  storage: {
    bucket: "secure-uploads",
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  },

  // UI Configuration
  ui: {
    toastDuration: 3000, // milliseconds
    animationDuration: 300, // milliseconds
    imagesPerPage: 20,
  },

  // API Endpoints (if needed for future expansion)
  api: {
    timeout: 30000, // milliseconds
    retries: 3,
  },

  // Routes
  routes: {
    home: "/index.html",
    login: "/pages/login.html",
    dashboard: "/pages/dashboard.html",
    gallery: "/pages/gallery.html",
    admin: "/pages/admin.html",
    accessDenied: "/index.html",
    adminUsers: "/pages/admin-users.html",
    adminLogs: "/pages/admin-logs.html",
  },
};

// Freeze config to prevent accidental modifications
Object.freeze(CONFIG);

export default CONFIG;
