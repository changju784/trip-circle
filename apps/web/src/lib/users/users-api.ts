/**
 * Users API module
 * Handles user-related API calls
 */

import { apiGet } from "../api";
import { Trip } from "../trips/trips-api";

export interface User {
    _id: string;
    id?: string; // normalized alias for frontend convenience
    username: string;
    email: string;
    trips?: string[];
    dateCreated?: string;
}

/**
 * Normalize backend user object
 * Ensures `id` is available along with `_id`
 */
function normalizeUser(user: User): User {
    return {
        ...user,
        id: user._id,
    };
}

/**
 * Get user by ID
 */
export async function getUser(userId: string): Promise<User> {
    const data = await apiGet<User>(`/api/users/${userId}`);
    return normalizeUser(data);
}

/**
 * Get all trips for a user
 */
export async function getUserTrips(userId: string): Promise<Trip[]> {
    return apiGet<Trip[]>(`/api/users/${userId}/trips`);
}

/**
 * Search users by username or email (supports backend route /search/:query)
 */
export async function searchUsers(query: string): Promise<User[]> {
    if (!query.trim()) return [];

    const data = await apiGet<User[]>(`/api/users/search/${query}`);

    return data.map(normalizeUser);
}
