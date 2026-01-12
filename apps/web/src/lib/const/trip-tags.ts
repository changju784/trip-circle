import {
    CloudSnow, Sun, Leaf, Thermometer,
    User, Users, Heart, Baby,
    Wallet, Gem, Mountain,
    Trees, Building, Umbrella, Utensils,
    Coffee, Camera, Footprints, Landmark
} from "lucide-react";
import { TripTag } from "../trips/trips-api";

export const TAG_CONFIG: Record<TripTag, { label: string; icon: any; category: string }> = {
    // Seasons
    spring: { label: "Spring", icon: Leaf, category: "season" },
    summer: { label: "Summer", icon: Sun, category: "season" },
    fall: { label: "Fall", icon: Thermometer, category: "season" },
    winter: { label: "Winter", icon: CloudSnow, category: "season" },

    // Group Types
    solo: { label: "Solo", icon: User, category: "group" },
    couple: { label: "Couple", icon: Heart, category: "group" },
    family: { label: "Family", icon: Baby, category: "group" },
    friends: { label: "Friends", icon: Users, category: "group" },

    // Style
    budget: { label: "Budget", icon: Wallet, category: "style" },
    luxury: { label: "Luxury", icon: Gem, category: "style" },
    adventure: { label: "Adventure", icon: Mountain, category: "style" },

    // Vibe
    nature: { label: "Nature", icon: Trees, category: "vibe" },
    "city break": { label: "City Break", icon: Building, category: "vibe" },
    beach: { label: "Beach", icon: Umbrella, category: "vibe" },
    foodie: { label: "Foodie", icon: Utensils, category: "vibe" },

    // Activity
    relaxing: { label: "Relaxing", icon: Coffee, category: "activity" },
    photography: { label: "Photography", icon: Camera, category: "activity" },
    hiking: { label: "Hiking", icon: Footprints, category: "activity" },
    historic: { label: "Historic", icon: Landmark, category: "activity" },
} as const;

export const TRIP_TAGS = Object.entries(TAG_CONFIG).map(([id, config]) => ({
    id: id as TripTag,
    ...config
}));