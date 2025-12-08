import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
// shadcn utils
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}