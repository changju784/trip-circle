import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShareView } from '../components/ShareView';

export default function SharePage() {
    const navigate = useNavigate();
    const { search } = useLocation();
    const params = new URLSearchParams(search);
    const trip = params.get('trip') || undefined;
    const token = params.get('share') || undefined;

    return <ShareView tripId={trip} shareToken={token} onBack={() => navigate(-1)} />;
}
