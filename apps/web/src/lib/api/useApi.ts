/**
 * useApi hook
 * React wrapper around the central api.ts client
 * Provides automatic token management and logout callbacks
 */

import { useCallback } from "react";
import {
    apiGet,
    apiPost,
    apiPut,
    apiDelete,
    setApiToken,
    setOnUnauthorizedCallback,
    AxiosRequestConfig,
} from "../api";

export function useApi() {
    const setToken = useCallback((token: string | null) => {
        setApiToken(token);
    }, []);

    const setUnauthorizedCallback = useCallback((callback: (() => void) | null) => {
        setOnUnauthorizedCallback(callback);
    }, []);

    const get = useCallback(async <T,>(
        endpoint: string,
        config?: AxiosRequestConfig
    ): Promise<T> => {
        return apiGet<T>(endpoint, config);
    }, []);

    const post = useCallback(async <T,>(
        endpoint: string,
        data?: unknown,
        config?: AxiosRequestConfig
    ): Promise<T> => {
        return apiPost<T>(endpoint, data, config);
    }, []);

    const put = useCallback(async <T,>(
        endpoint: string,
        data?: unknown,
        config?: AxiosRequestConfig
    ): Promise<T> => {
        return apiPut<T>(endpoint, data, config);
    }, []);

    const del = useCallback(async <T,>(
        endpoint: string,
        config?: AxiosRequestConfig
    ): Promise<T> => {
        return apiDelete<T>(endpoint, config);
    }, []);

    return {
        setToken,
        setUnauthorizedCallback,
        get,
        post,
        put,
        delete: del,
    };
}
