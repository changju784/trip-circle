export type UserRole = "owner" | "editor" | "reader";

export type TripAccess = {
    userId: string;
    email?: string;
    role: UserRole;
};

/**
 * Determine the role of a user for a given trip
 */
export function getUserRoleForTrip(
    userId: string | null | undefined,
    ownerId: string | null | undefined,
    collaborators: TripAccess[] | undefined
): UserRole {
    if (!userId) return "reader";
    if (userId === ownerId) return "owner";
    const collab = collaborators?.find((c) => c.userId === userId);
    return collab?.role ?? "reader";
}

/**
 * Check if user can edit a trip
 */
export function canEditTrip(userId: string | null | undefined, role: UserRole): boolean {
    return role === "owner" || role === "editor";
}

/**
 * Check if user can delete a trip
 */
export function canDeleteTrip(userId: string | null | undefined, role: UserRole): boolean {
    return role === "owner";
}

/**
 * Check if user can share a trip
 */
export function canShareTrip(userId: string | null | undefined, role: UserRole): boolean {
    return role === "owner";
}
