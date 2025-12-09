# TripCircle — Collaborative Travel Planner
<img width="800" height="500" alt="image" src="https://github.com/user-attachments/assets/e0a221c6-e981-4091-a6ad-5429d68facb8" />

TripCircle is a full-stack travel-planning application that lets users:

- Create and edit trips with multiple destinations
- Organize day-by-day stops (time, location, notes, coordinates)
- Explore public trips created by others
- Fork existing trips into their own workspace
- Collaborate with friends via shared trips and member access

Built with:

- Frontend: React + TypeScript, React Router, Tailwind CSS (and custom components)
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Auth: OAuth / SSO (e.g., Google) + backend user sync

---

# Links

- Live demo link: https://trip-circle-web.vercel.app
- Prototype: https://www.figma.com/make/Pmpb5O72zFjbVOmr0zHHpd/Collaborative-Travel-Planner?node-id=0-1&p=f&t=vg61q3YmHQyS0ZzC-0&fullscreen=1

## 📁 Project Structure

High-level layout:

trip-circle/
│
├── apps/
│   ├── web/                          # Frontend (React + TypeScript)
│   │   ├── src/
│   │   │   ├── components/           # Reusable UI: Navbar, Cards, Buttons, MapPreview, etc.
│   │   │   ├── pages/                # Route-level pages
│   │   │   │   ├── dashboard/        # Dashboard page (My trips, Explore snippet, etc.)
│   │   │   │   ├── profile/          # Profile page
│   │   │   │   ├── trip/             # NewTrip, TripDetail, EditTrip pages
│   │   │   │   └── auth/             # Auth layouts, login/register, OAuth callback, username setup
│   │   │   ├── lib/
│   │   │   │   ├── trips/            # Trip API client (get/create/update/delete/fork/explore)
│   │   │   │   ├── users/            # User API client (get user, user trips)
│   │   │   │   └── splashClient/     # Thumbnail/splash image helper
│   │   │   ├── auth/                 # AuthProvider, useAuth hook, ProtectedRoute
│   │   │   ├── MainLayout.tsx        # Main shell layout (navbar, container)
│   │   │   ├── App.tsx               # Route configuration
│   │   │   └── index.tsx             # React entrypoint
│   │   ├── public/                   # Static assets
│   │   ├── index.css                 # Global styles (gradient background, Tailwind base)
│   │   └── package.json
│   │
│   └── server/                       # Backend (Express + MongoDB)
│       ├── server.js                 # Express app entrypoint
│       ├── routes/
│       │   ├── auth.js               # Auth routes (OAuth callbacks, login, etc.)
│       │   ├── trips.js              # Trip CRUD, explore, fork
│       │   └── users.js              # User profile + user trips
│       ├── schema/
│       │   ├── TripSchema.js         # Trip model (members, days, stops, etc.)
│       │   └── UserSchema.js         # User model (name, email, auth provider, etc.)
│       ├── config/
│       │   └── logger.js             # Logger configuration (winston or similar)
│       ├── .env.example              # Example backend environment variables
│       └── package.json
│
├── package.json                      # Root (optional workspaces / scripts)
└── README.md                         # You are here

---

## 🗄️ Backend Overview (apps/server)

### Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- Helmet, CORS, morgan, express-mongo-sanitize, dotenv
- JSON-based REST API under /api

### server.js Summary

- Loads environment variables with dotenv
- Connects to MongoDB using mongoose
- Applies global middleware:
  - CORS
  - express.json()
  - helmet
  - morgan logger
  - express-mongo-sanitize
- Registers routes:
  - /api          -> health check ("Welcome to TripCircle API")
  - /api/auth     -> authRoutes
  - /api/trips    -> tripsRoutes
  - /api/users    -> usersRoutes (if present)
- Exposes server on process.env.PORT or a default (e.g., 5000)

---

## 🧱 Data Models (Mongoose)

### Trip Schema (TripSchema.js)

Core fields (simplified):

- members: [ObjectId ref 'User']
- title: string (required)
- description: string
- destinations: [
  - id: string
  - label: string
]
- isPublic: boolean (default false, indexed)
- thumbnail: string | null
- days: [
  - date: Date (required)
  - stops: [
    - id: string
    - title: string (required)
    - time: string (optional)
    - locationName: string (optional)
    - lat: number (optional)
    - lng: number (optional)
    - description: string (optional)
  ]
]
- startDate: Date
- endDate: Date
- dateCreated: Date (default: now)
- lastUpdated: Date (optional)

(If your actual schema includes more fields like budget, members roles, etc., they can be documented here.)

### User Schema (UserSchema.js)

Typical fields (adjust to match your code):

- name: string
- email: string (unique)
- authProvider: string (e.g., "google", "github", "password")
- avatar: string (optional)
- createdAt: Date
- updatedAt: Date

---

## 🌐 API Endpoints

All endpoints are prefixed with /api on the backend.

Base URL examples during local dev:
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

### 1. Health Check

GET /api  
- Returns a simple JSON object:
  - { "message": "Welcome to TripCircle API" }

---

### 2. Auth Routes ( /api/auth )

Exact routes may vary; typical setup includes:

POST /api/auth/login  
- Login with credentials or token.
- Request body depends on your implementation (e.g., { email, password }).

POST /api/auth/register  
- Register a new user.

GET /api/auth/me  
- Returns the authenticated user, based on session / JWT / OAuth.

GET /api/auth/oauth/:provider/callback  
- OAuth provider callback (e.g., Google).
- Frontend typically redirects here after provider login.

(If your project uses only external SSO, you can rephrase these accordingly.)

---

### 3. Trip Routes ( /api/trips )

GET /api/trips  
- Returns all trips (may be restricted or admin-only).
- Supports query params (optional): pagination, filtering.

GET /api/trips/explore?q=searchTerm&limit=20&skip=0  
- Returns public trips (isPublic: true).
- q: full-text search against title/description/destinations.
- limit: number of results (default: 20).
- skip: offset for pagination.

GET /api/trips/:id  
- Fetch a single trip by ID.
- Only accessible if:
  - trip.isPublic === true OR
  - requesting user is in trip.members

POST /api/trips  
- Create a new trip.
- Request body (typical):
  - title: string (required)
  - description?: string
  - destinations?: [{ id, label }]
  - startDate: string (ISO)
  - endDate: string (ISO)
  - days?: [
      { date: string (ISO), stops: [{ id, title, time, locationName, lat, lng, description }] }
    ]
  - isPublic?: boolean
  - thumbnail?: string
  - members?: [userId]

PUT /api/trips/:id  
- Update an existing trip.
- Only allowed for members.
- Backend usually whitelists allowed fields (e.g., title, description, destinations, isPublic, thumbnail, days, startDate, endDate, members).

DELETE /api/trips/:id  
- Delete a trip.
- Only allowed for members/owner.

POST /api/trips/:id/fork  
- Fork an existing trip into a new trip owned by the current user.
- Typically:
  - Copied fields: title, description, destinations, days, thumbnail
  - New owner: current user
  - isPublic: can be copied or defaulted to false
  - Adds fork relationship internally if needed

(If you add share links / invite endpoints, document them under this section.)

---

### 4. User Routes ( /api/users )

GET /api/users/:id  
- Fetch a user profile.

GET /api/users/:id/trips  
- Fetch all trips where the user is a member.

(You can add endpoints here for updating profile, avatar, preferences, etc.)

---

## 🎨 Frontend Overview (apps/web)

### Tech Stack

- React + TypeScript
- React Router v6
- Tailwind CSS
- Custom UI components (Button, Card, Navbar, Input, etc.)
- AuthProvider + useAuth for auth context

### Routing Structure (App.tsx)

Under base path (example): /trip-circle

- /trip-circle
  - /trip-circle (index)  
    - RootRedirect (redirects based on auth state, e.g., to /dashboard or /auth)
  - /trip-circle/auth  
    - AuthLayout + AuthTabs (login/register/OAuth)
  - /trip-circle/auth/callback  
    - AuthCallbackPage (handles OAuth redirect)
  - /trip-circle/auth/username-setup  
    - UsernameSetup (first-time user setup)
  - /trip-circle/dashboard  
    - ProtectedRoute → Dashboard (requires auth)
  - /trip-circle/profile  
    - ProtectedRoute → Profile page
  - /trip-circle/trips/new  
    - ProtectedRoute → NewTripPage (trip creation)
  - /trip-circle/trips/:id  
    - ProtectedRoute → TripDetailPage
  - /trip-circle/trips/:id/edit  
    - ProtectedRoute → EditTripPage

(Adjust if your base path is simply / rather than /trip-circle.)

---

## ✨ Frontend Features

### Auth & User Experience

- Login / Signup with email + password and/or OAuth (Google, etc.)
- AuthProvider wraps the app and exposes `useAuth` hook (user, loading, logOut, etc.).
- ProtectedRoute component that redirects unauthenticated users to /trip-circle/auth.
- After OAuth callback, AuthCallbackPage handles backend token exchange and user sync.

### Dashboard

- Displays:
  - “My Trips” list with quick links to edit / view
  - Create new trip button
  - Possibly explore section snippet with public trips

### My Trips & Explore

- My Trips:
  - Lists trips where the user is a member.
  - Shows date range, destination labels, and status (public/private).
- Explore:
  - Uses /api/trips/explore to show public trips.
  - Search bar for keyword filtering (`q` query parameter).
  - Cards with:
    - Title
    - Description snippet
    - Destinations
    - Thumbnail image (via splashClient)
    - Date range

### Trip Detail Page

- Shows:
  - Trip title, description, destinations.
  - Date range and public/private status.
  - Thumbnail image.
  - Day-by-day view:
    - Each day displays date and associated stops.
    - Each stop shows time, title, location, and notes.
  - MapPreview (using react-leaflet) that:
    - Centers around stops’ coordinates.
    - Renders markers for stops that have lat/lng.

### Edit Trip / New Trip Page

- Form-driven UI with:
  - Trip metadata:
    - Title
    - Description
    - Destinations (add/remove)
    - Start date / End date
    - isPublic toggle
  - Day & stops editor:
    - Add/remove days
    - Add/remove stops within a day
    - Edit stop title, time, location, coordinates, description
- Save button triggers POST/PUT to trip endpoints.

### Forking a Trip

- On a public trip’s detail page, a “Fork Trip” button calls:
  - POST /api/trips/:id/fork
- On success, user is redirected to their newly forked trip (my trip space).

---

## 🧩 Frontend–Backend Integration

Inside apps/web/src/lib/trips/ (for example):

- trips-api.ts:
  - getTrip(id)
  - getUserTrips(userId)
  - getExploreTrips({ q, limit, skip })
  - createTrip(data)
  - updateTrip(id, data)
  - deleteTrip(id)
  - forkTrip(id)

Each function wraps fetch/axios against backend URLs, e.g.:

- GET /api/trips/:id
- POST /api/trips
- PUT /api/trips/:id
- DELETE /api/trips/:id
- POST /api/trips/:id/fork
- GET /api/trips/explore

Base URL is usually read from an environment variable (e.g. REACT_APP_API_URL or VITE_API_URL).

---

## ⚙️ Environment Variables

### Backend (apps/server/.env)

Typical variables (example):

- MONGODB_URI=mongodb://localhost:27017/tripcircle
- PORT=5000
- CLIENT_URL=http://localhost:3000
- JWT_SECRET=some-secret-if-using-JWT
- OAUTH_GOOGLE_CLIENT_ID=...
- OAUTH_GOOGLE_CLIENT_SECRET=...

Create a .env file in apps/server by copying .env.example and filling in values.

### Frontend (apps/web/.env)

Depending on bundler:

- REACT_APP_API_URL=http://localhost:5000/api
or
- VITE_API_URL=http://localhost:5000/api

Make sure this matches your backend URL.

---

## 🛠️ Development Setup

### 1. Clone the Repository

From your terminal:

- git clone <your-repo-url>
- cd trip-circle

### 2. Install Dependencies

Backend:

- cd apps/server
- npm install

Frontend:

- cd ../web
- npm install

(If you use npm workspaces or pnpm at the root, you can also run a single install in the project root.)

---

## ▶️ Running the App in Development

### Start the Backend

In a terminal:

- cd apps/server
- npm run dev

Typical dev script uses nodemon to restart on file changes.

Backend will run on:
- http://localhost:5000

### Start the Frontend

In a separate terminal:

- cd apps/web
- npm start

If using CRA:
- Starts dev server at http://localhost:3000

If using Vite:
- npm run dev
- Dev server at something like http://localhost:5173

Ensure the frontend’s API base URL points to your backend (see Environment Variables section).

---

## 📦 Building for Production

### Backend

In apps/server:

- npm run build (if you have a build step, e.g. TypeScript)
- npm start or node server.js in production

### Frontend

In apps/web:

- npm run build

This generates a production build into a build/ (CRA) or dist/ (Vite) folder.
You can serve this with:

- A static hosting provider (Netlify, Vercel, etc.), or
- Express static middleware from your backend.

---

## ✅ Testing

If you add tests, document them here; e.g.:

- Backend tests: npm test in apps/server
- Frontend tests: npm test in apps/web
