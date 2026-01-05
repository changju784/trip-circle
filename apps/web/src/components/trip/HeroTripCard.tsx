import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trip } from '@/lib/trips/trips-api';
import { ArrowRight, Calendar, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar } from '../ui/Avatar';
import { useGetTripOwners } from '@/pages/trip/hooks/use-get-trip-owners';

interface HeroTripCardProps {
    trip: Trip & {
        daysUntil: number;
        isLive: boolean;
        progress: number;
        destinationSummary: string;
        totalStops: number;
    };
}

export const HeroTripCard: React.FC<HeroTripCardProps> = ({ trip }) => {
    const navigate = useNavigate();
    const { owner, contributors } = useGetTripOwners(trip);

    // Formatting the date range for the sub-header
    const dateRange = `${format(new Date(trip.startDate), 'MMM d')} - ${format(new Date(trip.endDate), 'MMM d, yyyy')}`;
    const isComplete = trip.progress === 100;

    // Navigation handler
    const handleNavigation = () => {
        navigate(`/trip-circle/trip/${trip._id}`);
    };

    return (
        <div
            onClick={handleNavigation}
            className="relative w-full min-h-[500px] md:h-[500px] rounded-[32px] overflow-hidden group shadow-2xl border border-white/10 bg-gray-900 cursor-pointer"
        >
            {/* Background Image Layer */}
            <img
                src={trip.thumbnail || ''}
                alt={trip.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent" />

            {/* Top Status Badge */}
            <div className="absolute top-6 right-6 md:top-8 md:right-8">
                <div className="bg-black/40 backdrop-blur-md border border-white/20 px-3 py-1.5 md:px-4 md:py-2 rounded-full flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${trip.isLive ? 'bg-green-400 animate-pulse' : 'bg-blue-400'}`} />
                    <span className="text-[9px] md:text-[10px] font-bold text-white uppercase tracking-widest">
                        {trip.isLive ? 'Live Now' : `${trip.daysUntil} Days to Departure`}
                    </span>
                </div>
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6 md:gap-8">

                {/* Left Side: Title & Meta Info */}
                <div className="space-y-3 md:space-y-4 w-full md:max-w-xl">
                    <div className="space-y-1">
                        <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-[0.9]">
                            {trip.title}
                        </h1>
                        <p className="text-white/70 text-sm md:text-lg font-medium line-clamp-2">
                            {trip.description}
                        </p>
                    </div>

                    {/* Streamlined Meta Row: Date + Avatars */}
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 text-white/50 text-[10px] md:text-xs font-bold uppercase tracking-widest">
                            <Calendar size={14} className="text-blue-400 shrink-0" />
                            {dateRange}
                        </div>

                        <div className="flex -space-x-2">
                            {owner && (
                                <Avatar user={owner} size={24} className="ring-2 ring-black z-30" showPopover={true} />
                            )}
                            {contributors.slice(0, 3).map((c) => (
                                <Avatar key={c.id} user={c} size={24} className="ring-2 ring-black z-20" showPopover={true} />
                            ))}
                            {contributors.length > 3 && (
                                <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-black bg-white/10 backdrop-blur-md text-[8px] text-white font-bold z-10">
                                    +{contributors.length - 3}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Progress Circle & Action */}
                <div className="flex flex-row md:flex-col items-center justify-between md:justify-center w-full md:w-auto gap-4 md:gap-6 pt-4 md:pt-0 border-t border-white/5 md:border-0">
                    <div className="relative flex items-center justify-center scale-90 md:scale-100">
                        <svg className="w-24 h-24 md:w-32 md:h-32 transform -rotate-90">
                            <circle cx="50%" cy="50%" r="44%" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                            <circle
                                cx="50%" cy="50%" r="44%"
                                stroke="currentColor" strokeWidth="8" fill="transparent"
                                strokeDasharray="276"
                                strokeDashoffset={276 - (276 * trip.progress) / 100}
                                strokeLinecap="round"
                                className={`transition-all duration-1000 ${isComplete ? 'text-emerald-400' : 'text-white'}`}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            {isComplete ? (
                                <CheckCircle2 className="text-emerald-400 w-6 h-6 md:w-8 md:h-8" />
                            ) : (
                                <>
                                    <span className="text-xl md:text-3xl font-black text-white">{trip.progress}%</span>
                                    <span className="text-[7px] md:text-[9px] text-white/40 uppercase font-bold tracking-widest">Planned</span>
                                </>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleNavigation();
                        }}
                        className="flex-1 md:w-full bg-white text-black py-3.5 md:py-4 px-6 md:px-8 rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-blue-50 transition-all active:scale-95 shadow-xl"
                    >
                        Continue <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};