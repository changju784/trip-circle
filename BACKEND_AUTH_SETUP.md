# Backend Authentication System - Setup & Implementation Summary

## ✅ Migration Complete

You have successfully migrated from Firebase Authentication to a pure backend authentication system with JWT tokens and optional Google OAuth support.

## 🚀 Quick Start

### Backend Setup

1. **Install dependencies:**
   ```bash
   cd apps/api
   npm install
   ```

2. **Configure environment variables** (`.env`):
   ```bash
   cp .env.example .env
   ```
   
   Update these required variables:
   ```env
   JWT_SECRET=generate_a_random_string_here
   MONGODB_URI=mongodb://localhost:27017/tripcircle
   FRONTEND_URL=http://localhost:3000
   BACKEND_URL=http://localhost:5000
   
   # Optional: Google OAuth
   GOOGLE_OAUTH_CLIENT_ID=your_client_id
   GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret
   ```

3. **Start the backend:**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd apps/web
   npm install
   ```

2. **Configure environment variables** (`.env.local`):
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

3. **Start the frontend:**
   ```bash
   npm start
   ```

## 📋 Files Changed

### Backend (`apps/api`)
| File | Change |
|------|--------|
| `models/user.js` | Added `name` and `googleId` fields |
| `routes/auth.js` | **NEW** - Register, login, Google OAuth |
| `routes/login.js` | Deprecated (redirects to `/api/auth`) |
| `server.js` | Mounted new auth routes |
| `package.json` | Added `axios` dependency |
| `.env.example` | Updated with auth config |

### Frontend (`apps/web`)
| File | Change |
|------|--------|
| `src/lib/auth/useBackendAuth.ts` | Simplified for backend JWT only |
| `src/lib/auth/authApi.ts` | Updated API calls |
| `src/auth/hook/use-auth.ts` | **REWRITTEN** - Backend auth only |
| `src/components/auth/AuthProvider.tsx` | Removed Firebase dependency |
| `src/pages/auth/AuthCallback.tsx` | **NEW** - OAuth redirect handler |
| `src/pages/auth/Login.tsx` | Updated for backend auth |
| `src/pages/auth/UsernameSetup.tsx` | Uses backend instead of Firebase |
| `src/App.tsx` | Added OAuth callback route |
| `package.json` | Removed Firebase |

### Deleted
- `apps/web/src/auth/firebase.ts` ✓

## 🔐 API Endpoints

### Public (No Auth Required)

**Register:**
```
POST /api/auth/register
Body: { email, password, name? }
Response: { token, user: { id, email, name, dateCreated } }
```

**Login:**
```
POST /api/auth/login
Body: { email, password }
Response: { token, user: { id, email, name, dateCreated } }
```

**Google OAuth Start:**
```
GET /api/auth/google
Redirects to Google OAuth login
```

**Google OAuth Callback:**
```
GET /api/auth/google/callback?code=...&state=...
Backend handles Google exchange
Redirects to: frontend_url/auth/callback?token=<jwt>
```

### Protected (Require Bearer JWT Token)

```
Authorization: Bearer <jwt_token>
```

All other routes under `/api/trips`, `/api/users` require valid token.

## 🧪 Testing the System

### 1. Test Email/Password Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123",
    "name": "Test User"
  }'
```

### 2. Test Email/Password Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }'
```

### 3. Test Protected Route
```bash
curl -X GET http://localhost:5000/api/users/me \
  -H "Authorization: Bearer <token_from_login>"
```

### 4. Test Google OAuth
1. Go to `http://localhost:3000/trip-circle/auth`
2. Click "Continue with Google"
3. Should redirect to Google login
4. After approval, redirects back with JWT token

## 🔑 Authentication Flow

### Email/Password Flow
```
User submits form
    ↓
POST /api/auth/login or /api/auth/register
    ↓
Backend validates/creates user
    ↓
Backend issues JWT token (expires 24h)
    ↓
Frontend stores token in localStorage
    ↓
Frontend calls setApiToken(token)
    ↓
All API requests include: Authorization: Bearer <token>
```

### Google OAuth Flow
```
User clicks "Continue with Google"
    ↓
Frontend redirects to: /api/auth/google
    ↓
Backend redirects to Google OAuth
    ↓
User approves in Google
    ↓
Backend receives authorization code
    ↓
Backend exchanges code for Google ID token
    ↓
Backend creates/finds MongoDB user
    ↓
Backend issues JWT token
    ↓
Backend redirects to: /auth/callback?token=<jwt>
    ↓
Frontend extracts token from URL
    ↓
Frontend stores and redirects to dashboard
```

## 📊 Token Structure

JWT tokens are signed with `JWT_SECRET` and contain:
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "iat": 1673529600,
  "exp": 1673616000
}
```

## ⚠️ Important Notes

### Development
- JWT tokens expire after 24 hours
- No refresh token mechanism yet (implement for production)
- Google OAuth requires credentials from Google Cloud Console

### Production Checklist
- [ ] Change `JWT_SECRET` to strong random string
- [ ] Use HTTPS (required for Google OAuth)
- [ ] Configure CORS for your domain
- [ ] Set `FRONTEND_URL` and `BACKEND_URL` to production URLs
- [ ] Implement refresh token rotation
- [ ] Add email verification on signup
- [ ] Add password reset flow
- [ ] Set up rate limiting on auth endpoints
- [ ] Configure proper error logging

## 🐛 Troubleshooting

### "Invalid credentials" Error
- Verify user exists: `db.users.findOne({ email: "..." })`
- Check password with: `bcrypt.compare(password, hash)`

### 401 Unauthorized on Protected Routes
- Check token is in `Authorization: Bearer <token>` header
- Verify token hasn't expired (24h)
- Verify token signature matches `JWT_SECRET`

### Google OAuth Redirect Not Working
- Verify `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` in `.env`
- Verify redirect URI in Google Console matches backend URL
- Check browser console for CORS errors

### Frontend Can't Reach Backend
- Verify `REACT_APP_API_URL` in `.env.local`
- Verify backend is running on correct port
- Check CORS is enabled in `server.js`

## 📚 Further Reading

See `FIREBASE_TO_BACKEND_MIGRATION.md` for:
- Detailed technical changes
- File-by-file modifications
- API changes documentation
- Future improvements
- Rollback procedures

## 🎯 Next Steps

1. ✅ Backend auth setup complete
2. ✅ Frontend auth integration complete
3. ⬜ Test entire flow end-to-end
4. ⬜ Set up Google OAuth credentials (optional)
5. ⬜ Deploy to staging environment
6. ⬜ Implement password reset (recommended)
7. ⬜ Implement refresh tokens (production)
8. ⬜ Add email verification (recommended)

## 📞 Support

For issues or questions:
1. Check `FIREBASE_TO_BACKEND_MIGRATION.md` for detailed docs
2. Review error messages in browser console and backend logs
3. Verify all environment variables are set correctly
4. Check that MongoDB connection is working: `mongosh tripcircle`

---

**Migration Date:** December 2024
**Status:** ✅ Complete & Ready for Testing
