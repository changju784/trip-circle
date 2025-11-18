import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TripForm } from '../components/TripForm';
import { useAuth } from '../lib/auth';

export default function TripFormPage() {
    const navigate = useNavigate();
    const auth = useAuth();
    if (!auth.user) return null;

    const currentUser = { id: auth.user.uid, name: auth.user.displayName || auth.user.email || 'Traveler' };

    return <TripForm user={currentUser} onBack={() => navigate(-1)} onTripCreated={(id: string) => navigate(`/editor/${id}`)} />;
}
