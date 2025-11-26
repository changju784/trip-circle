import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import DashboardPage from './pages/DashboardPage';
import ExplorePage from './pages/ExplorePage';
import ItineraryEditorPage from './pages/ItineraryEditorPage';
import { LoginSignup } from './components/LoginSignup';
import SharePage from './pages/SharePage';
import TripDetailPage from './pages/TripDetailPage';
import UserProfilePage from './pages/UserProfilePage';
import TripFormPage from './pages/TripFormPage';
import { Toaster } from './components/ui/sonner';

function RequireAuth({ children }: { children: JSX.Element }) {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;
    return children;
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginSignup />} />
                    <Route path="/signup" element={<LoginSignup />} />

                    <Route path="/" element={<RequireAuth><DashboardPage /></RequireAuth>} />

                    <Route path="/explore" element={<RequireAuth><ExplorePage /></RequireAuth>} />

                    <Route path="/trip/:id" element={<RequireAuth><TripDetailPage /></RequireAuth>} />

                    <Route path="/editor/:id?" element={<RequireAuth><ItineraryEditorPage /></RequireAuth>} />

                    <Route path="/share" element={<SharePage />} />
                    <Route path="/profile/:id" element={<UserProfilePage />} />
                    <Route path="/create" element={<RequireAuth><TripFormPage /></RequireAuth>} />

                </Routes>
                <Toaster />
            </BrowserRouter>
        </AuthProvider>
    );
}
