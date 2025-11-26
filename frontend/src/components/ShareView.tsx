import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { MapPin, Calendar, Clock, ArrowLeft, Share2, Copy, Check } from 'lucide-react';
import { getTripById, getTripByShareToken, type Trip } from '../lib/storage';
import { toast } from 'sonner@2.0.3';

interface ShareViewProps {
    tripId?: string;
    shareToken?: string;
    onBack: () => void;
}

export function ShareView({ tripId, shareToken, onBack }: ShareViewProps) {
    const [trip, setTrip] = useState<Trip | null>(null);
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadTrip();
        if (tripId) {
            setShareDialogOpen(true);
        }
    }, [tripId, shareToken]);

    const loadTrip = () => {
        let loadedTrip: Trip | null = null;

        if (tripId) {
            loadedTrip = getTripById(tripId);
        } else if (shareToken) {
            loadedTrip = getTripByShareToken(shareToken);
        }

        if (loadedTrip) {
            setTrip(loadedTrip);
        }
    };

    const getShareUrl = () => {
        if (!trip) return '';
        return `${window.location.origin}?share=${trip.shareToken}`;
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(getShareUrl());
        setCopied(true);
        toast.success('Link copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    };

    const formatDateRange = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };

        if (start.getFullYear() === end.getFullYear()) {
            return `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${end.toLocaleDateString('en-US', options)}`;
        }
        return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
    };

    if (!trip) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="pt-6 text-center">
                        <p className="text-gray-600">Trip not found</p>
                        <Button onClick={onBack} className="mt-4">
                            Go Back
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <Button variant="ghost" onClick={onBack}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        {tripId && (
                            <Button variant="outline" onClick={() => setShareDialogOpen(true)}>
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Trip Header */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <CardTitle className="text-3xl mb-2">{trip.title}</CardTitle>
                                <div className="flex flex-wrap gap-4 text-gray-600">
                                    <div className="flex items-center">
                                        <MapPin className="h-5 w-5 mr-2" />
                                        {trip.city}
                                    </div>
                                    <div className="flex items-center">
                                        <Calendar className="h-5 w-5 mr-2" />
                                        {formatDateRange(trip.startDate, trip.endDate)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Itinerary */}
                <div className="space-y-6">
                    {trip.itinerary.map((day, dayIndex) => (
                        <Card key={dayIndex}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Day {day.day}</CardTitle>
                                        <CardDescription>{formatDate(day.date)}</CardDescription>
                                    </div>
                                    <Badge variant="secondary">{day.stops.length} stops</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {day.stops.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No stops planned for this day</p>
                                ) : (
                                    <div className="space-y-4">
                                        {day.stops.map((stop, stopIndex) => (
                                            <div key={stop.id} className="border-l-4 border-blue-500 pl-4 py-2">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <h4 className="text-gray-900 mb-1">{stop.title}</h4>
                                                        <div className="space-y-1">
                                                            {stop.time && (
                                                                <div className="flex items-center text-sm text-gray-600">
                                                                    <Clock className="h-4 w-4 mr-2" />
                                                                    {stop.time}
                                                                </div>
                                                            )}
                                                            {stop.location && (
                                                                <div className="flex items-center text-sm text-gray-600">
                                                                    <MapPin className="h-4 w-4 mr-2" />
                                                                    {stop.location}
                                                                </div>
                                                            )}
                                                            {stop.description && (
                                                                <p className="text-sm text-gray-600 mt-2">{stop.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline">{stopIndex + 1}</Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </main>

            {/* Share Dialog */}
            <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Share Your Trip</DialogTitle>
                        <DialogDescription>
                            Anyone with this link can view your trip itinerary
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                value={getShareUrl()}
                                readOnly
                                className="flex-1"
                            />
                            <Button onClick={handleCopyLink} variant="outline">
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                        <p className="text-sm text-gray-500">
                            This is a read-only link. Viewers cannot edit your itinerary.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
