import {
    Utensils, Bed, Binoculars, Palmtree,
    ShoppingBag, Plane, Music, MoreHorizontal, HelpCircle
} from "lucide-react";

export const CATEGORY_CONFIG = {
    dining: { label: "Dining", icon: Utensils, color: "bg-red-200 text-red-800 border-red-300" },
    lodging: { label: "Lodging", icon: Bed, color: "bg-orange-200 text-orange-800 border-orange-300" },
    sightseeing: { label: "Sightseeing", icon: Binoculars, color: "bg-amber-200 text-amber-800 border-amber-300" },
    activity: { label: "Activity", icon: Palmtree, color: "bg-lime-200 text-lime-800 border-lime-300" },
    shopping: { label: "Shopping", icon: ShoppingBag, color: "bg-emerald-200 text-emerald-800 border-emerald-300" },
    transit: { label: "Transit", icon: Plane, color: "bg-cyan-200 text-cyan-800 border-cyan-300" },
    nightlife: { label: "Nightlife", icon: Music, color: "bg-violet-200 text-violet-800 border-violet-300" },
    other: { label: "Other", icon: MoreHorizontal, color: "bg-slate-200 text-slate-800 border-slate-300" },
    none: { label: "None", icon: HelpCircle, color: "bg-gray-100 text-gray-600 border-gray-200" },
} as const;

export const STOP_CATEGORIES = Object.entries(CATEGORY_CONFIG).map(([id, config]) => ({
    id,
    label: config.label,
    icon: config.icon,
    color: config.color
}));