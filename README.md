# TripCircle - MERN Stack Trip Planning App

A full-stack trip planning and sharing application built with MongoDB, Express, React, and Node.js.

## Project Structure

```
trip-circle/
├── frontend/          # React frontend application
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/           # Express.js backend API
│   ├── models/        # MongoDB models
│   ├── routes/        # API routes
│   ├── controllers/   # Route controllers
│   ├── server.js      # Server entry point
│   └── package.json
└── package.json       # Root package.json with scripts
```

## Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd trip-circle
```

2. Install all dependencies (frontend + backend)
```bash
npm run install-all
```

Or install individually:
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd frontend && npm install
```

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tripcircle
NODE_ENV=development
```

### Running the Application

**Run both frontend and backend concurrently:**
```bash
npm start
# or
npm run dev
```

**Run individually:**
```bash
# Backend only (from root)
npm run server

# Frontend only (from root)
npm run client
```

**Or from their respective directories:**
```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm start
```

### Available Scripts

From root directory:
- `npm start` - Run both frontend and backend
- `npm run dev` - Same as npm start
- `npm run server` - Run backend only
- `npm run client` - Run frontend only
- `npm run install-all` - Install all dependencies

## Tech Stack

### Frontend
- React 19.2.0
- React Router DOM
- Firebase Authentication
- React Hook Form
- Testing Library

### Backend
- Node.js
- Express.js 5.1.0
- MongoDB with Mongoose 9.0.0
- CORS
- dotenv

## API Endpoints

Backend runs on: `http://localhost:5000`
Frontend runs on: `http://localhost:3000`

### Base API
- `GET /api` - API health check

## Features

- User authentication (Firebase)
- Create, edit, and delete trips
- Public/private trip visibility
- Explore public trips
- Trip sharing
- User profiles
- Dashboard with trip management

## Development

The app is currently in development. Missing components:
- Backend API routes and controllers
- MongoDB models implementation
- Frontend-Backend integration
- UI component library

## License

ISC
