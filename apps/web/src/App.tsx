import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/dashboard/Dashboard";
import ProfilePage from "./pages/profile/Profile";
import NewTripPage from "./pages/trip/NewTrip";
import TripDetailPage from "./pages/trip/TripDetail";
import EditTripPage from "./pages/trip/EditTrip";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./components/auth/AuthProvider";
import AuthLayout from "./components/auth/AuthLayout";
import AuthTabs from "./components/auth/AuthTabs";
import RootRedirect from "./components/RootDirect";
import UsernameSetup from "./pages/auth/UsernameSetup";
import AuthCallbackPage from "./pages/auth/AuthCallback";

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>

                    {/* ROOT GROUP: /trip-circle */}
                    <Route path="/trip-circle">

                        {/* 
                          /trip-circle  → redirect to /trip-circle/auth OR /trip-circle/dashboard
                        */}
                        <Route index element={<RootRedirect />} />

                        {/* AUTH PAGE */}
                        <Route
                            path="auth"
                            element={
                                <AuthLayout>
                                    <AuthTabs />
                                </AuthLayout>
                            }
                        />

                        {/* AUTH CALLBACK (for OAuth redirects) */}
                        <Route path="auth/callback" element={<AuthCallbackPage />} />

                        {/* USERNAME SETUP (for new Google OAuth users) */}
                        <Route
                            path="setup-username"
                            element={
                                <ProtectedRoute>
                                    <UsernameSetup />
                                </ProtectedRoute>
                            }
                        />

                        {/* PROTECTED DASHBOARD */}
                        <Route
                            path="dashboard"
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                        <Route path="trip/new" element={<ProtectedRoute><NewTripPage /></ProtectedRoute>} />
                        <Route path="trip/:id" element={<ProtectedRoute><TripDetailPage /></ProtectedRoute>} />
                        <Route path="trip/:id/edit" element={<ProtectedRoute><EditTripPage /></ProtectedRoute>} />
                    </Route>

                    {/* Fall back → redirect to /trip-circle */}
                    <Route path="*" element={<Navigate to="/trip-circle" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
