import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/dashboard/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./components/AuthProvider";
import AuthLayout from "./components/auth/AuthLayout";
import AuthTabs from "./components/auth/AuthTabs";
import RootRedirect from "./components/RootDirect";

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

                        {/* PROTECTED DASHBOARD */}
                        <Route
                            path="dashboard"
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />
                    </Route>

                    {/* Fall back → redirect to /trip-circle */}
                    <Route path="*" element={<Navigate to="/trip-circle" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
