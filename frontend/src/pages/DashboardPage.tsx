import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dashboard } from '../components/Dashboard';
import { useAuth } from '../lib/auth';

function mapAuthUser() {
    const { user } = useAuth();
    if (!user) return null;
    return { id: user.uid, name: user.displayName || user.email || 'Traveler' };
}

export default function DashboardPage() {
    const navigate = useNavigate();
    const auth = useAuth();
    const user = auth.user ? { id: auth.user.uid, name: auth.user.displayName || auth.user.email || 'Traveler' } : null;

    if (!user) return null;

    return (
        <Dashboard
            user={user}
            onLogout={() => { auth.logout(); navigate('/login'); }}
            onCreateTrip={() => navigate('/create')}
            onEditTrip={(id: string) => navigate(`/editor/${id}`)}
            onShareTrip={(id: string) => navigate(`/share?trip=${id}`)}
            onViewTripDetail={(id: string) => navigate(`/trip/${id}`)}
            onViewProfile={(id: string) => navigate(`/profile/${id}`)}
        />
    );
}
