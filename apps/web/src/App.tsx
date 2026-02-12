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
import MainLayout from "./MainLayout";
import MyTripsSection from "./pages/dashboard/MyTripsSection";
import ExploreSection from "./pages/dashboard/ExploreSection";
import { Toaster } from "./components/ui/toaster";

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <TripsProvider>
                    <Routes>
                        <Route path="/trip-circle">
                            {/* PUBLIC ROUTES */}
                            <Route element={<MainLayout />}>
                                <Route path="auth" element={<AuthLayout><AuthTabs /></AuthLayout>} />
                                <Route path="auth/callback" element={<AuthCallbackPage />} />
                                <Route index element={<Navigate to="dashboard/explore" replace />} />

                                <Route path="dashboard" element={<Dashboard />}>
                                    <Route path="explore" element={<ExploreSection />} />
                                    <Route path="my-trips" element={<MyTripsSection />} />
                                    <Route index element={<Navigate to="explore" replace />} />
                                </Route>

                                <Route path="trip/:id" element={<TripDetailPage />} />
                            </Route>

                            {/* PROTECTED ROUTES */}
                            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                                <Route path="profile" element={<ProfilePage />} />
                                <Route path="trip/new" element={<NewTripPage />} />
                                <Route path="trip/:id/edit" element={<EditTripPage />} />
                                <Route path="setup-username" element={<UsernameSetup />} />
                            </Route>

                        </Route>

                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/trip-circle" replace />} />
                    </Routes>
                    <Toaster />
                </TripsProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;