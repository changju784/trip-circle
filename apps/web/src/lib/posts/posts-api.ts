/**
 * Posts API module
 * Handles all post-related API calls
 */

import { apiGet, apiPost, apiDelete } from "../api";
import { Trip } from "../trips/trips-api";

export interface Comment {
    _id: string;
    userId: {
        _id: string;
        username: string;
    };
    commentText: string;
    dateCreated: string;
}

export interface Post {
    _id: string;
    tripId: Trip;
    userId: {
        _id: string;
        username: string;
        email: string;
    };
    likes: string[];
    comments: Comment[];
    forkCount: number;
    likeCount: number;
    commentCount: number;
    dateCreated: string;
}

/**
 * Get all posts for explore feed
 */
export async function getPosts(
    limit: number = 20,
    skip: number = 0,
    sort: "recent" | "popular" = "recent"
): Promise<Post[]> {
    const params = new URLSearchParams();
    params.append("limit", limit.toString());
    params.append("skip", skip.toString());
    params.append("sort", sort);

    return apiGet<Post[]>(`/api/posts?${params.toString()}`);
}

/**
 * Get a single post by ID
 */
export async function getPost(postId: string): Promise<Post> {
    return apiGet<Post>(`/api/posts/${postId}`);
}

/**
 * Search posts by trip fields (title, destinations, description)
 */
export async function searchPosts(
    query: string,
    limit: number = 20,
    skip: number = 0
): Promise<Post[]> {
    const params = new URLSearchParams();
    params.append("q", query);
    params.append("limit", limit.toString());
    params.append("skip", skip.toString());
    return apiGet<Post[]>(`/api/posts/search?${params.toString()}`);
}

/**
 * Get post by trip ID
 */
export async function getPostByTrip(tripId: string): Promise<Post> {
    return apiGet<Post>(`/api/posts/trip/${tripId}`);
}

/**
 * Toggle like on a post
 */
export async function toggleLike(postId: string, userId: string): Promise<Post> {
    return apiPost<Post>(`/api/posts/${postId}/like`, { userId });
}

/**
 * Add a comment to a post
 */
export async function addComment(
    postId: string,
    userId: string,
    commentText: string
): Promise<Post> {
    return apiPost<Post>(`/api/posts/${postId}/comments`, { userId, commentText });
}

/**
 * Delete a comment from a post
 */
export async function deleteComment(
    postId: string,
    commentId: string,
    userId: string
): Promise<Post> {
    return apiDelete<Post>(`/api/posts/${postId}/comments/${commentId}`, {
        data: { userId }
    });
}
