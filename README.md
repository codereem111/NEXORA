# Nexora - Professional Cyber Portal

A modern, secure, and elegant web application for managing private image galleries with enterprise-grade security.

![Nexora](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-production--ready-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Features

### Authentication & Security
- ✅ Supabase authentication with email/password
- ✅ Role-based access control (User, Admin)
- ✅ User approval system
- ✅ Session persistence
- ✅ Secure logout
- ✅ Password reset functionality
- ✅ Unauthorized access prevention

### User Dashboard
- 📊 Real-time statistics
- 🖼️ Image gallery with lazy loading
- 📤 Drag-and-drop upload
- 📋 Activity tracking
- 🎨 Responsive design
- ⚡ Smooth animations

### Admin Panel
- 👥 User management
- ✓ Approve/revoke users
- 🎭 Role assignment
- 📸 Image management
- 📋 Activity logs
- 🔍 Search and filter

### Security Features
- 🔒 Private Supabase storage
- 🔐 Signed URLs for image access
- 🛡️ Row Level Security (RLS)
- 🚫 Rate limiting structure
- 📝 Audit logs
- 🔑 Environment variables

### UI/UX
- ✨ Glassmorphism design
- 🎨 CSS animations
- 🌙 Dark mode optimized
- 📱 Mobile responsive
- 🎯 Toast notifications
- ⚙️ Loading states

## 📋 Requirements

- Node.js 16+ (for development)
- Supabase account (free tier works)
- Modern browser (Chrome, Firefox, Safari, Edge)
- No build process required (vanilla JS)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/nexora.git
cd nexora
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for database initialization
4. Get your credentials:
   - Project URL
   - Anon Key

### 3. Setup Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Or set them in `config/config.js`:**

```javascript
supabase: {
  url: 'https://your-project.supabase.co',
  key: 'your_anon_key_here',
}
```

### 4. Setup Supabase Database

1. Go to Supabase dashboard → SQL Editor
2. Create a new query
3. Copy and paste the contents of `supabase-setup.sql`
4. Execute the query
5. Wait for completion

### 5. Create Storage Bucket

1. Go to Supabase dashboard → Storage
2. Click "New bucket"
3. Name it: `secure-uploads`
4. Make it **Private**
5. Click "Create bucket"

### 6. Configure Admin Email

Edit `config/config.js` and add your admin email:

```javascript
adminEmails: [
  'your-email@example.com',
  'admin@example.com',
]
```

### 7. Start Development Server

```bash
# Using Python
python -m http.server 8000

# Using Node.js (http-server)
npx http-server -p 8000

# Using VS Code Live Server extension
# Right-click index.html → Open with Live Server
```

Open http://localhost:8000 in your browser

## 📁 Project Structure

```
nexora/
├── index.html                 # Home page
├── login/
│   └── index.html             # Login page
├── signup/
│   └── index.html             # Sign up page
├── workspace/
│   └── index.html             # Workspace dashboard
├── gallery/
│   └── index.html             # Image gallery
├── admin/
│   └── index.html             # Admin panel
├── admin/approvals/
│   └── index.html             # Approvals page
├── access-denied/
│   └── index.html             # Access denied page
├── assets/
│   ├── css/
│   │   ├── main.css          # Core styles
│   │   ├── animations.css    # CSS animations
│   │   ├── dashboard.css     # Dashboard styles
│   │   └── admin.css         # Admin styles
│   ├── js/
│   │   ├── main.js           # App initialization
│   │   ├── ui.js             # UI utilities
│   │   ├── gallery.js        # Gallery management
│   │   ├── admin.js          # Admin functions
│   │   └── uploads.js        # Upload management
│   └── images/               # Image assets
├── config/
│   └── config.js             # App configuration
├── services/
│   ├── auth.js               # Auth service
│   ├── supabase.js           # Supabase client
│   ├── guards.js             # Route guards
│   └── uploads.js            # Upload service
├── utils/
│   ├── helpers.js            # Utility functions
│   └── logger.js             # Activity logger
├── supabase-setup.sql        # Database setup
├── .env.example              # Environment template
└── README.md                 # This file
```

## 🔧 Configuration

### Admin Emails

Edit `config/config.js`:

```javascript
adminEmails: [
  'admin@example.com',
  'owner@example.com',
]
```

### Approved Users (Optional)

For allowlisting specific emails:

```javascript
approvedEmails: [
  'user1@example.com',
  'user2@example.com',
]
```

### Storage Settings

```javascript
storage: {
  bucket: 'secure-uploads',
  maxFileSize: 10 * 1024 * 1024,  // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
}
```

## 📝 API Endpoints (if using backend)

The app uses Supabase directly. Here are the main services:

- **Auth**: `AuthService.login()`, `AuthService.logout()`, `AuthService.signup()`
- **Storage**: `UploadService.uploadImage()`, `UploadService.deleteImage()`
- **Database**: Direct Supabase queries via `supabase` client
- **Guards**: `RouteGuard.guardRoute()`, `RouteGuard.guardAdminRoute()`

## 🔐 Security Best Practices

1. **Never commit `.env` files**
   ```bash
   echo ".env.local" >> .gitignore
   ```

2. **Use environment variables for sensitive data**
   - Store Supabase keys in `.env.local` or Vercel secrets

3. **Keep RLS policies strict**
   - Users can only access their own data
   - Admins have full access
   - Check `supabase-setup.sql` for policies

4. **Regular backups**
   - Enable Supabase backups
   - Backup your database regularly

5. **Monitor activity logs**
   - Check the Activity Logs section in admin panel
   - Review unauthorized access attempts

## 🚢 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import GitHub repository
4. Add environment variables in Vercel settings:
   ```
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   ```
5. Deploy!

### Deploy to Netlify

1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Import GitHub repository
4. Add environment variables in build settings
5. Deploy!

### Deploy to GitHub Pages

```bash
# Build static files
git add .
git commit -m "Ready for deployment"
git push origin main

# GitHub Pages settings:
# Settings → Pages → Deploy from branch: main
```

## 📚 Database Schema

### Users Table
```sql
id (UUID) - Primary key
email (TEXT) - User email
role (TEXT) - 'user' or 'admin'
approved (BOOLEAN) - Access approval status
created_at (TIMESTAMP) - Creation date
updated_at (TIMESTAMP) - Last update
```

### Uploads Table
```sql
id (UUID) - Primary key
storage_path (TEXT) - Path in Supabase storage
file_name (TEXT) - Original filename
file_size (INTEGER) - File size in bytes
uploaded_by (TEXT) - Uploader email
created_at (TIMESTAMP) - Upload date
```

### Activity Logs Table
```sql
id (UUID) - Primary key
user_email (TEXT) - User who performed action
action (TEXT) - Action description
metadata (JSONB) - Additional data
timestamp (TIMESTAMP) - When action occurred
ip_address (TEXT) - User IP address
```

## 🐛 Troubleshooting

### Login fails
- Check Supabase credentials in `.env.local`
- Verify user exists in database
- Check browser console for errors

### Images not loading
- Verify storage bucket exists and is private
- Check Supabase storage policies
- Ensure signed URLs are working

### Admin features not visible
- Add your email to `adminEmails` in `config/config.js`
- Change your role to 'admin' in database (via Supabase UI)
- Clear browser cache and refresh

### RLS errors
- Check Row Level Security policies in `supabase-setup.sql`
- Verify user is authenticated
- Check policy conditions

### Performance issues
- Enable Lazy loading (already enabled)
- Compress images before upload
- Consider using image optimization service
- Check Supabase analytics

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review Supabase documentation
3. Check browser console for errors
4. Contact your administrator

## 📄 License

MIT License - Feel free to use this project!

## 🙏 Credits

Built with:
- [Supabase](https://supabase.com) - Backend & Storage
- [Bootstrap 5](https://getbootstrap.com) - UI Framework
- Vanilla JavaScript - No dependencies
- CSS3 - Modern styling

## 🎯 Roadmap

- [ ] Two-factor authentication
- [ ] Image compression
- [ ] Advanced search and filters
- [ ] User preferences
- [ ] Email notifications
- [ ] API documentation
- [ ] Mobile app

## 📊 Statistics

- **Lines of Code**: ~3,000+
- **CSS**: ~1,500 lines
- **JavaScript**: ~1,500 lines
- **HTML**: ~500 lines
- **SQL**: ~200 lines
- **Zero external dependencies** (except Supabase JS SDK)

---

**Made with ❤️ for security and elegance**
