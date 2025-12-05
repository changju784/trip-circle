/**
 * Users API module
 * Handles user-related API calls
 */

import { apiGet } from "../api";
import { Trip } from "../trips/tripsApi";

export interface User {
    _id: string;
    id?: string;
    email: string;
    trips: string[];
    dateCreated: string;
}

/**
 * Get user by ID
 */
export async function getUser(userId: string): Promise<User> {
    return apiGet<User>(`/api/users/${userId}`);
}

/**
 * Get all trips for a user
 */
export async function getUserTrips(userId: string): Promise<Trip[]> {
    // Return trips for a specific user using backend endpoint
    return apiGet<Trip[]>(`/api/users/${userId}/trips`);
}
