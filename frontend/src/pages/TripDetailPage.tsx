import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TripDetail } from '../components/TripDetail';
import { useAuth } from '../lib/auth';

export default function TripDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const auth = useAuth();
    if (!auth.user) return null;

    return (
        <TripDetail
            tripId={id || ''}
            currentUser={{ id: auth.user.uid, name: auth.user.displayName || auth.user.email || 'Traveler' }}
            onBack={() => navigate(-1)}
            onViewProfile={(uid: string) => navigate(`/profile/${uid}`)}
        />
    );
}
