import { useState } from "react";
import { Cloud, CloudRain, Sun, CloudLightning, Snowflake, CloudFog, HelpCircle, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useWeather } from "@/lib/weather/use-weather";

interface WeatherBadgeProps {
    city: string;
    date: string;
}

export function WeatherBadge({ city, date }: WeatherBadgeProps) {
    const { data, loading } = useWeather(city, date);
    const [showDetail, setShowDetail] = useState(false);

    const formattedDate = new Date(date).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    });

    if (loading) return <Loader2 className="animate-spin size-3 text-sky-400" />;
    if (!data || data.status !== 'success') return null;

    const Icon = getWeatherIcon(data.icon || "");

    return (
        <>
            <div
                onClick={() => setShowDetail(true)}
                className="flex items-center gap-1.5 px-2 py-0.5 md:px-3 md:py-1 bg-sky-50 dark:bg-sky-900/30 border border-sky-100 dark:border-sky-800 rounded-full shrink-0 cursor-pointer hover:bg-sky-100 dark:hover:bg-sky-800/50 transition-colors h-fit"
            >
                <Icon className="w-3 h-3 md:w-3.5 md:h-3.5 text-sky-700 dark:text-sky-300" strokeWidth={2.5} />
                <span className="text-[10px] md:text-xs font-semibold text-sky-700 dark:text-sky-300 whitespace-nowrap leading-none">
                    {Math.round(data.temp || 0)}°
                </span>
            </div>
            <Modal
                isOpen={showDetail}
                onClose={() => setShowDetail(false)}
                title={`Weather for ${formattedDate} in ${city}`}
            >
                <div className="space-y-6 py-4">
                    {/* Main Display */}
                    <div className="flex flex-col items-center justify-center p-6 bg-sky-50 dark:bg-sky-900/20 rounded-2xl border border-sky-100 dark:border-sky-800 text-center">
                        <Icon size={64} className="text-sky-600 dark:text-sky-400 mb-4" strokeWidth={1.5} />
                        <h4 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                            {Math.round(data.temp || 0)}°C
                        </h4>
                        <p className="text-lg font-medium text-sky-700 dark:text-sky-300 capitalize mt-1">
                            {data.condition}
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">High / Low</p>
                            <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                                {Math.round(data.high || 0)}° / {Math.round(data.low || 0)}°
                            </p>
                        </div>
                        <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">Source Type</p>
                            <p className="text-base font-bold text-gray-900 dark:text-gray-100 capitalize">
                                {data.dataType === 'history' ? 'Historical Record' : 'Forecast'}
                            </p>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic">
                            "{data.description}"
                        </p>
                    </div>

                    <div className="pt-2 text-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                            Data provided by Visual Crossing
                        </p>
                    </div>
                </div>
            </Modal>
        </>
    );
}

function getWeatherIcon(iconName: string) {
    const name = iconName.toLowerCase();
    if (name.includes('rain')) return CloudRain;
    if (name.includes('snow')) return Snowflake;
    if (name.includes('thunder')) return CloudLightning;
    if (name.includes('fog')) return CloudFog;
    if (name.includes('clear') || name.includes('sun')) return Sun;
    if (name.includes('cloud')) return Cloud;
    return HelpCircle;
}