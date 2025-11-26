import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Explore } from '../components/Explore';
import { useAuth } from '../lib/auth';

export default function ExplorePage() {
    const navigate = useNavigate();
    const auth = useAuth();
    if (!auth.user) return null;
    const user = { id: auth.user.uid, name: auth.user.displayName || auth.user.email || 'Traveler' };

    return (
        <Explore user={user} onViewTrip={(id: string) => navigate(`/trip/${id}`)} />
    );
}
