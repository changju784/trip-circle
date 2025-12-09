import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Pages
import Dashboard from "./pages/dashboard/Dashboard";
import ProfilePage from "./pages/profile/Profile";
import NewTripPage from "./pages/trip/NewTrip";
import TripDetailPage from "./pages/trip/TripDetail";
import EditTripPage from "./pages/trip/EditTrip";

// Auth & Setup
import UsernameSetup from "./pages/auth/UsernameSetup";
import AuthCallbackPage from "./pages/auth/AuthCallback";

// Components
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./components/auth/AuthProvider";
import { TripsProvider } from "./contexts/TripsContext";
import AuthLayout from "./components/auth/AuthLayout";
import AuthTabs from "./components/auth/AuthTabs";
import RootRedirect from "./components/RootDirect";
import MainLayout from "./MainLayout";

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <TripsProvider>
                    <Routes>
                    <Route path="/trip-circle">

                        {/* --- PUBLIC ROUTES --- */}
                        <Route index element={<RootRedirect />} />

                        <Route path="auth" element={
                            <AuthLayout>
                                <AuthTabs />
                            </AuthLayout>
                        } />

                        <Route path="auth/callback" element={<AuthCallbackPage />} />

                        {/* --- PROTECTED APP ROUTES (With Navbar & Footer) --- */}
                        {/* We wrap these routes in ProtectedRoute AND MainLayout.
                            This applies the Navbar/Footer to all of them automatically.
                        */}
                        <Route element={
                            <ProtectedRoute>
                                <MainLayout />
                            </ProtectedRoute>
                        }>
                            <Route path="dashboard" element={<Dashboard />} />
                            <Route path="profile" element={<ProfilePage />} />
                            <Route path="trip/new" element={<NewTripPage />} />
                            <Route path="trip/:id" element={<TripDetailPage />} />
                            <Route path="trip/:id/edit" element={<EditTripPage />} />
                            <Route path="setup-username" element={<UsernameSetup />} />
                        </Route>

                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/trip-circle" replace />} />
                </Routes>
                </TripsProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;