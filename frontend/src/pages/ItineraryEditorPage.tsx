import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ItineraryEditor } from '../components/ItineraryEditor';
import { useAuth } from '../lib/auth';

export default function ItineraryEditorPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const auth = useAuth();
    if (!auth.user) return null;

    return <ItineraryEditor tripId={id || ''} onBack={() => navigate('/')} />;
}
