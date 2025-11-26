import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Plus, MapPin, LogOut, Share2, Pencil, Trash2, Compass, Briefcase, User as UserIcon, Globe2 } from 'lucide-react';
import { getUserTrips, deleteTrip, updateTrip, type User, type Trip } from '../lib/storage';
import { toast } from 'sonner@2.0.3';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Explore } from './Explore';
import { TripCard } from './TripCard';

interface DashboardProps {
    user: User;
    onLogout: () => void;
    onCreateTrip: () => void;
    onEditTrip: (tripId: string) => void;
    onShareTrip: (tripId: string) => void;
    onViewTripDetail: (tripId: string) => void;
    onViewProfile: (userId: string) => void;
}

export function Dashboard({ user, onLogout, onCreateTrip, onEditTrip, onShareTrip, onViewTripDetail, onViewProfile }: DashboardProps) {
    const [activeTab, setActiveTab] = useState('my-trips');
    const [trips, setTrips] = useState<Trip[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [tripToDelete, setTripToDelete] = useState<string | null>(null);

    useEffect(() => {
        loadTrips();
    }, [user]);

    const loadTrips = () => {
        const userTrips = getUserTrips(user.id);
        setTrips(userTrips);
    };

    const handleDeleteClick = (tripId: string) => {
        setTripToDelete(tripId);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (tripToDelete) {
            deleteTrip(tripToDelete);
            loadTrips();
            toast.success('Trip deleted successfully');
        }
        setDeleteDialogOpen(false);
        setTripToDelete(null);
    };

    const handleTogglePublic = (tripId: string, isPublic: boolean) => {
        updateTrip(tripId, { isPublic: !isPublic });
        loadTrips();
        toast.success(isPublic ? 'Trip set to private' : 'Trip published!');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="flex items-center">
                            <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" transform="rotate(-45 12 12)" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl text-gray-900">TripCircle</h1>
                                <p className="text-sm text-gray-500">Welcome, {user.name}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => onViewProfile(user.id)}>
                            <UserIcon className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" onClick={onLogout}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <div className="flex items-center justify-between mb-6">
                        <TabsList>
                            <TabsTrigger value="my-trips">
                                <Briefcase className="h-4 w-4 mr-2" />
                                My Trips
                            </TabsTrigger>
                            <TabsTrigger value="explore">
                                <Compass className="h-4 w-4 mr-2" />
                                Explore
                            </TabsTrigger>
                        </TabsList>
                        {activeTab === 'my-trips' && (
                            <Button onClick={onCreateTrip} size="lg">
                                <Plus className="h-5 w-5 mr-2" />
                                New Trip
                            </Button>
                        )}
                    </div>

                    <TabsContent value="my-trips">\n

                        {trips.length === 0 ? (
                            <Card className="text-center py-12">
                                <CardContent className="pt-6">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                                        <MapPin className="h-8 w-8 text-blue-600" />
                                    </div>
                                    <h3 className="text-xl mb-2 text-gray-900">No trips yet</h3>
                                    <p className="text-gray-600 mb-6">Start planning your next adventure!</p>
                                    <Button onClick={onCreateTrip}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Your First Trip
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {trips.map((trip) => (
                                    <div key={trip.id} className="relative">
                                        <TripCard
                                            trip={trip}
                                            onClick={() => onEditTrip(trip.id)}
                                            showSocial={false}
                                        />
                                        <div className="flex gap-2 mt-3">
                                            <Button
                                                variant="default"
                                                className="flex-1"
                                                onClick={() => onEditTrip(trip.id)}
                                            >
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleTogglePublic(trip.id, trip.isPublic);
                                                }}
                                                title={trip.isPublic ? 'Make private' : 'Make public'}
                                            >
                                                <Globe2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onShareTrip(trip.id);
                                                }}
                                            >
                                                <Share2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClick(trip.id);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="explore">
                        <Explore user={user} onViewTrip={onViewTripDetail} />
                    </TabsContent>
                </Tabs>
            </main>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Trip</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this trip? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
