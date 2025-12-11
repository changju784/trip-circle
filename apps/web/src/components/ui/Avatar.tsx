import React, { useMemo } from "react";
import NiceAvatar, { type NiceAvatarProps, type Sex, type EarSize, type HairStyle, type HatStyle, type EyeStyle, type GlassesStyle, type NoseStyle, type MouthStyle, type ShirtStyle } from "react-nice-avatar";
import { cn } from "@/lib/utils";

type AvatarUser = {
    id?: string;
    email?: string;
    username?: string;
    name?: string;
};

type AvatarProps = {
    user?: AvatarUser | null;
    size?: number;
    className?: string;
};

// Acceptable option pools
const OPTION_POOLS = {
    sex: ["man", "woman"] as const,
    faceColor: ["#F9C9B6", "#F2D3B1", "#AC6651", "#8d5524"] as const,
    earSize: ["small", "big"] as const,
    hairColor: ["#171921", "#A55728", "#2c1b18", "#4A312C", "#B58143", "#6a4e42", "#D6B370"] as const,
    hairStyleMan: ["normal", "thick", "mohawk"] as const,
    hairStyleWoman: ["normal", "womanLong", "womanShort"] as const,
    hatStyle: ["none", "beanie", "turban"] as const,
    hatColor: ["#1F271B", "#E0D2C7", "#FC909F", "#F4D150", "#77311D", "#503B31"] as const,
    eyeStyle: ["circle", "oval", "smile"] as const,
    glassesStyle: ["none", "round", "square"] as const,
    noseStyle: ["short", "long", "round"] as const,
    mouthStyle: ["laugh", "smile", "peace"] as const,
    shirtStyle: ["hoody", "short", "polo"] as const,
    shirtColor: ["#9287FF", "#F4D150", "#77311D", "#503B31", "#DDDEDD", "#FAE8C8", "#E0D2C7"] as const,
    bgColor: ["#9287FF", "#F4D150", "#9287FF", "#F4D150", "#E0DDFF", "#FFEDEF", "#B1E2FF", "#A0D2DB"] as const,
    isGradient: [true, false] as const,
};

// Simple deterministic hash for repeatable picks
function hashString(value: string) {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        hash = (hash << 5) - hash + value.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

function createRandom(seedValue: string) {
    let seed = hashString(seedValue || "traveler");
    return () => {
        seed = (seed * 1664525 + 1013904223) % 0xffffffff;
        return seed / 0xffffffff;
    };
}

function pick<T extends readonly any[]>(arr: T, rand: () => number): T[number] {
    return arr[Math.floor(rand() * arr.length)];
}

function buildConfig(seed: string): NiceAvatarProps {
    const rand = createRandom(seed);
    const sex: Sex = pick(OPTION_POOLS.sex, rand);

    return {
        sex,
        faceColor: pick(OPTION_POOLS.faceColor, rand),
        earSize: pick(OPTION_POOLS.earSize, rand) as EarSize,
        hairColor: pick(OPTION_POOLS.hairColor, rand),
        hairStyle: (sex === "man" ? pick(OPTION_POOLS.hairStyleMan, rand) : pick(OPTION_POOLS.hairStyleWoman, rand)) as HairStyle,
        hatStyle: pick(OPTION_POOLS.hatStyle, rand) as HatStyle,
        hatColor: pick(OPTION_POOLS.hatColor, rand),
        eyeStyle: pick(OPTION_POOLS.eyeStyle, rand) as EyeStyle,
        glassesStyle: pick(OPTION_POOLS.glassesStyle, rand) as GlassesStyle,
        noseStyle: pick(OPTION_POOLS.noseStyle, rand) as NoseStyle,
        mouthStyle: pick(OPTION_POOLS.mouthStyle, rand) as MouthStyle,
        shirtStyle: pick(OPTION_POOLS.shirtStyle, rand) as ShirtStyle,
        shirtColor: pick(OPTION_POOLS.shirtColor, rand),
        bgColor: pick(OPTION_POOLS.bgColor, rand),
        isGradient: pick(OPTION_POOLS.isGradient, rand),
    };
}

export function Avatar({ user, size = 56, className }: AvatarProps) {
    const seed = user?.id || user?.email || user?.username || user?.name || "traveler";
    const config = useMemo(() => buildConfig(seed), [seed]);

    return (
        <div className={cn("inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
            <NiceAvatar style={{ width: size, height: size }} {...config} />
        </div>
    );
}
