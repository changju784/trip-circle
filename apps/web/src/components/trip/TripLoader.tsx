import React from 'react';

export const TripLoader = ({ fullPage = false }) => {
    return (
        <div className={`flex flex-col items-center justify-center ${fullPage ? 'h-screen w-screen' : 'p-20 w-full'}`}>
            <div className="relative">
                <img
                    src="/tripcircle.svg"
                    className="w-16 h-16 animate-pulse-slow animate-spin-slow"
                    alt="Loading..."
                />

                <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full animate-ping"></div>
            </div>

            <span className="mt-4 text-zinc-500 dark:text-zinc-400 text-[10px] font-black uppercase tracking-[0.3em] opacity-80">
                Fetching Adventures
            </span>
        </div>
    );
};
