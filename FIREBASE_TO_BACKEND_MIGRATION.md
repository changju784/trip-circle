# Firebase → Backend Authentication Migration Guide

## Overview
This guide documents the migration from Firebase Authentication to a pure backend authentication system with JWT tokens and optional Google OAuth support.

## Changes Made

### Backend Changes

#### 1. **User Model (`apps/api/models/user.js`)**
- Added `name: String` field for user display name
- Added `googleId: String` field for Google OAuth linking
- Changed `password` field to optional (for OAuth-only users)

#### 2. **New Auth Routes (`apps/api/routes/auth.js`)**

**POST /api/auth/register**
- Accepts: `{ email, password, name }`
- Returns: `{ token: string, user: { id, email, name, dateCreated } }`
- Hashes password with bcrypt
- Creates user in MongoDB

**POST /api/auth/login**
- Accepts: `{ email, password }`
- Returns: `{ token: string, user: { id, email, name, dateCreated } }`
- Verifies bcrypt hash
- Issues JWT token signed with `JWT_SECRET`

**GET /api/auth/google**
- Redirects to Google OAuth login
- Requires: `GOOGLE_OAUTH_CLIENT_ID` environment variable

**GET /api/auth/google/callback**
- Handles Google OAuth callback
- Creates/finds user by Google ID
- Issues backend JWT token
- Redirects frontend to `/auth/callback?token=<jwt>`

#### 3. **Auth Middleware (`apps/api/middleware/auth.js`)**
- No changes needed - already validates JWT tokens signed with `JWT_SECRET`
- Finds users by MongoDB `_id` (not Firebase UID)

#### 4. **Server Configuration (`apps/api/server.js`)**
- Auth routes registered at `/api/auth` (public, no middleware)
- Legacy `/api/login` route deprecated (redirects to `/api/auth`)
- Auth middleware protects all routes below it

### Frontend Changes

#### 1. **Removed Firebase**
- Deleted `src/auth/firebase.ts`
- Removed `firebase` from `package.json`

#### 2. **Backend Auth Management (`src/lib/auth/useBackendAuth.ts`)**
- Simplified to manage backend JWT tokens only
- Functions:
  - `saveAuthState(token, user)` - Store token and user in localStorage
  - `restoreBackendAuthState()` - Restore from localStorage on mount
  - `clearBackendAuthState()` - Clear on logout

#### 3. **Auth API (`src/lib/auth/authApi.ts`)**
- `registerUser(email, password, name)` - POST /api/auth/register
- `loginUser(email, password)` - POST /api/auth/login
- `loginWithGoogle()` - Redirects to backend OAuth
- `getTokenFromCallback()` - Extract token from OAuth redirect URL

#### 4. **useAuth Hook (`src/auth/hook/use-auth.ts`)**
- Completely rewritten for backend auth only
- Functions:
  - `signUp(email, password, name)` - Register with backend
  - `signIn(email, password)` - Login with backend
  - `signInWithGoogle()` - Start OAuth flow
  - `logOut()` - Clear session

#### 5. **AuthProvider (`src/components/auth/AuthProvider.tsx`)**
- Removed Firebase `onAuthStateChanged`
- Restores JWT from localStorage on mount
- Handles OAuth callback tokens from URL
- Provides backend user and error state

#### 6. **Auth Callback Page (`src/pages/auth/AuthCallback.tsx`)**
- New page for OAuth redirects
- Extracts JWT from URL query parameter
- Saves to localStorage
- Redirects to dashboard

#### 7. **Login/Register Pages**
- Updated to use new backend auth functions
- Google button now redirects to backend (no async waiting)
- Error handling for backend responses

#### 8. **Username Setup Page (`src/pages/auth/UsernameSetup.tsx`)**
- Changed from Firebase `updateProfile` to backend `apiPut`
- Calls `PUT /api/users/:id` with name update

### Routes Added

**Frontend Router (src/App.tsx)**
- New route: `/trip-circle/auth/callback` - Handles OAuth redirects
- Existing protected routes still work with new auth

## Configuration

### Backend (.env)

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/tripcircle

# JWT
JWT_SECRET=your_super_secret_key_change_this

# Frontend/Backend URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

# Google OAuth (optional)
GOOGLE_OAUTH_CLIENT_ID=your_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret
```

### Frontend (.env.local)

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Migration Path

### For Existing Firebase Users
1. Export Firebase users from Firebase Console
2. Create migration script to:
   - Read Firebase user emails
   - Generate temporary passwords
   - Create new MongoDB users
   - Notify users to reset password on first login

### For New Users
- Use new registration form at `/trip-circle/auth`
- Can sign up with email/password or Google SSO

## Google OAuth Setup

1. **Google Cloud Console:**
   - Create OAuth 2.0 credentials
   - Add redirect URI: `http://localhost:5000/api/auth/google/callback` (dev)
   - Copy Client ID and Client Secret to `.env`

2. **Frontend:**
   - No additional setup needed
   - Users click "Continue with Google"
   - Backend handles OAuth flow
   - Users are redirected with JWT token

## API Changes

### Authentication Headers
```javascript
// All authenticated requests now use:
Authorization: Bearer <jwt_token>

// Token obtained from:
// 1. POST /api/auth/login
// 2. POST /api/auth/register  
// 3. GET /api/auth/google/callback
```

### User Object Structure
```javascript
// Old Firebase:
{
  uid: "firebase_uid_...",
  email: "user@example.com",
  displayName: "John Doe"
}

// New Backend:
{
  id: "507f1f77bcf86cd799439011",  // MongoDB ObjectId
  email: "user@example.com",
  name: "John Doe",
  dateCreated: "2024-01-15T10:30:00Z"
}
```

## Testing Checklist

- [ ] Register new user with email/password
- [ ] Login with registered credentials
- [ ] Password hashing verified (check bcrypt)
- [ ] JWT token issued and stored
- [ ] Protected routes require valid token
- [ ] Invalid token returns 401
- [ ] Logout clears localStorage
- [ ] Page refresh restores session from token
- [ ] Google OAuth redirect works
- [ ] Google OAuth user creation/linking works
- [ ] OAuth callback redirects with token
- [ ] Can create trips after auth
- [ ] Dashboard loads user trips
- [ ] Explore section works

## Troubleshooting

### "Invalid credentials" on login
- Verify user exists in MongoDB
- Check password hashing: `bcrypt.compare(password, hash)`
- Check email is case-insensitive in database query

### 401 on protected routes
- Verify token is attached: Check `Authorization` header
- Verify token is valid: Check JWT signature
- Verify token hasn't expired: Check `expiresIn: "24h"`

### Google OAuth not working
- Verify `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` in `.env`
- Verify redirect URI matches Google Console settings
- Check browser console for errors
- Verify `FRONTEND_URL` and `BACKEND_URL` environment variables

### User trips not loading
- Verify `Authorization` header is present
- Verify user `_id` in trips `members` array
- Check MongoDB query includes correct user ID

## Security Notes

1. **JWT Secret**: Change `JWT_SECRET` in production to a strong random string
2. **HTTPS**: Use HTTPS in production (Google OAuth requires it)
3. **CORS**: Configure CORS properly for your frontend domain
4. **Token Expiry**: Tokens expire after 24h - implement refresh token for long-lived sessions
5. **Password**: Hash with bcrypt (already implemented)
6. **Environment Variables**: Never commit `.env` files

## Future Improvements

1. **Refresh Tokens**: Implement refresh token rotation for better security
2. **Email Verification**: Send verification email on registration
3. **Password Reset**: Implement forgot password flow
4. **2FA**: Add optional two-factor authentication
5. **Rate Limiting**: Add rate limiting to auth endpoints
6. **Audit Logging**: Log authentication events
7. **OAuth Providers**: Add Facebook, GitHub OAuth support

## Rollback Plan

If you need to revert to Firebase:
1. Keep Git history - can revert commits
2. Firebase data still accessible via Firebase Console
3. Create migration script to sync MongoDB users back to Firebase if needed

## Files Modified

### Backend
- `apps/api/models/user.js` - Added fields
- `apps/api/routes/auth.js` - New file
- `apps/api/routes/login.js` - Deprecated
- `apps/api/server.js` - New auth routes
- `apps/api/package.json` - Added axios
- `apps/api/.env.example` - Updated

### Frontend
- `apps/web/src/lib/auth/useBackendAuth.ts` - Simplified
- `apps/web/src/lib/auth/authApi.ts` - Updated
- `apps/web/src/auth/hook/use-auth.ts` - Rewritten
- `apps/web/src/components/auth/AuthProvider.tsx` - Removed Firebase
- `apps/web/src/pages/auth/AuthCallback.tsx` - New file
- `apps/web/src/pages/auth/Login.tsx` - Updated
- `apps/web/src/pages/auth/UsernameSetup.tsx` - Updated
- `apps/web/src/App.tsx` - New auth callback route
- `apps/web/package.json` - Removed firebase

### Deleted Files
- `apps/web/src/auth/firebase.ts`
