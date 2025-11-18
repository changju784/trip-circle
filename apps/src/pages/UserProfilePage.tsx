import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserProfile } from '../components/UserProfile';
import { useAuth } from '../lib/auth';

export default function UserProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const auth = useAuth();
    if (!auth.user) return null;

    return (
        <UserProfile
            userId={id || ''}
            currentUser={{ id: auth.user.uid, name: auth.user.displayName || auth.user.email || 'Traveler' }}
            onBack={() => navigate(-1)}
            onViewTrip={(tripId: string) => navigate(`/trip/${tripId}`)}
        />
    );
}
