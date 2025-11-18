import { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Search, MapPin, TrendingUp, Heart } from 'lucide-react';
import { getPublicTrips, getTrendingTrips, getFollowingTrips, searchTrips, type Trip, type User } from '../lib/storage';
import { TripCard } from './TripCard';

interface ExploreProps {
    user: User;
    onViewTrip: (tripId: string) => void;
}

export function Explore({ user, onViewTrip }: ExploreProps) {
    const [activeTab, setActiveTab] = useState('trending');
    const [searchQuery, setSearchQuery] = useState('');
    const [trips, setTrips] = useState<Trip[]>([]);
    const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);

    useEffect(() => {
        loadTrips();
    }, [activeTab, user]);

    useEffect(() => {
        if (searchQuery) {
            const results = searchTrips(searchQuery);
            setFilteredTrips(results);
        } else {
            setFilteredTrips(trips);
        }
    }, [searchQuery, trips]);

    const loadTrips = () => {
        let loadedTrips: Trip[] = [];

        switch (activeTab) {
            case 'trending':
                loadedTrips = getTrendingTrips(20);
                break;
            case 'following':
                loadedTrips = getFollowingTrips(user.id);
                break;
            case 'all':
                loadedTrips = getPublicTrips();
                break;
        }

        setTrips(loadedTrips);
        setFilteredTrips(loadedTrips);
    };

    const formatDateRange = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

        return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
    };

    const getDaysCount = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return days;
    };

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                    placeholder="Search trips by destination or title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="trending">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Trending
                    </TabsTrigger>
                    <TabsTrigger value="following">
                        <Heart className="h-4 w-4 mr-2" />
                        Following
                    </TabsTrigger>
                    <TabsTrigger value="all">
                        <MapPin className="h-4 w-4 mr-2" />
                        All Trips
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                    {filteredTrips.length === 0 ? (
                        <Card className="text-center py-12">
                            <CardContent className="pt-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                                    <MapPin className="h-8 w-8 text-blue-600" />
                                </div>
                                <h3 className="text-xl mb-2 text-gray-900">
                                    {activeTab === 'following'
                                        ? 'No trips from people you follow'
                                        : searchQuery
                                            ? 'No trips found'
                                            : 'No public trips yet'}
                                </h3>
                                <p className="text-gray-600">
                                    {activeTab === 'following' && 'Start following other travelers to see their adventures!'}
                                    {searchQuery && 'Try a different search term'}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredTrips.map((trip) => (
                                <TripCard
                                    key={trip.id}
                                    trip={trip}
                                    onClick={() => onViewTrip(trip.id)}
                                    showSocial={true}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
