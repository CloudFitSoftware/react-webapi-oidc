import {useCallback, useEffect, useRef, useState} from "react";
import axios, {AxiosRequestConfig} from "axios";
import {useAuth} from "react-oidc-context";

/**
 * Interface representing options for configuring Axios requests.
 *
 * These options can be used to customize the behavior of Axios calls,
 * providing control over retry logic, request parameters, caching,
 * and whether requests are fetched automatically upon initialization.
 *
 * Properties:
 * @property {number} [retries] - Specifies the number of retry attempts for failed requests.
 * @property {number} [delay] - The delay (in milliseconds) between retry attempts; also used to calculate exponential back-off.
 * @property {boolean} [autoFetch] - Indicates whether the request should be automatically fetched upon initialization.
 * @property {Record<string, unknown>} [params] - An object representing the query parameters to include in the request.
 * @property {boolean} [cacheEnabled] - Determines if caching is enabled for the request.
 */
interface UseAxiosOptions {
    retries?: number;
    delay?: number;
    autoFetch?: boolean;
    params?: Record<string, unknown>;
    cacheEnabled?: boolean;
}

/**
 * Interface representing the result of a custom hook implementation for managing Axios HTTP requests.
 *
 * @template T - The type of the data returned by the Axios response.
 */
interface UseAxiosResult<T> {
    data: T | null;
    loading: boolean;
    isInitialLoading: boolean;
    isRefreshing: boolean;
    error: string | null;
    fetchData: (params?: Record<string, unknown>) => Promise<void>;
}

/**
 * Retrieves cached data from the session storage using the specified cache key.
 * If the data exists, it attempts to parse the JSON string into a JavaScript object.
 * If parsing fails or the key does not exist, it returns null.
 *
 * @param {string} cacheKey - The key used to identify the cached item in session storage.
 * @returns {unknown | null} - The parsed JavaScript object if the key is found and valid, or null otherwise.
 */
const getCachedData = (cacheKey: string): unknown | null => {
    try {
        const cachedEntry = sessionStorage.getItem(cacheKey);
        return cachedEntry ? JSON.parse(cachedEntry) : null;
    } catch {
        console.warn("Failed to parse cache data");
        return null;
    }
};

/**
 * Saves a specified value to the browser's session storage under the provided cache key.
 * If storing the value fails (e.g., due to storage limits or other errors),
 * a warning is logged to the console.
 *
 * @param {string} cacheKey - The key under which the value will be saved in the session storage.
 * @param {unknown} value - The value to be saved in the session storage. This value will be serialized to JSON.
 * @returns {void}
 */
const saveToCache = (cacheKey: string, value: unknown): void => {
    try {
        sessionStorage.setItem(cacheKey, JSON.stringify(value));
    } catch {
        console.warn("Failed to save data to cache");
    }
};

/**
 * A custom hook for managing Axios requests with support for
 * retries, delays, exponential back-off, caching, and dynamic parameters.
 *
 * It provides utility functions for data fetching and state management in React applications.
 *
 * @template T - The type of the data returned by the Axios response.
 *
 * @param {AxiosRequestConfig} config The Axios request configuration object for the HTTP request.
 * @param {Object} [options] An optional configuration object for the hook.
 * @param {number} [options.retries=5] The number of retries to attempt in case of failure. Default: five retries.
 * @param {number} [options.delay=1000] The delay (in milliseconds) until first retry. Default: one second.
 * @param {boolean} [options.autoFetch=true] Whether to automatically fetch data on initial render. Default: true.
 * @param {Object} [options.params={}] Initial request parameters to include in the Axios request.
 * @param {boolean} [options.cacheEnabled=false] Whether to enable caching of responses for identical requests. Default: false.
 * @return {UseAxiosResult<T>} An object containing the response data, loading states, error information, and a function to manually trigger the data fetch.
 */
function useAxios<T>(
    config: AxiosRequestConfig,
    {
        retries = 5,
        delay = 1000,
        autoFetch = true,
        params: initialParams = {},
        cacheEnabled = false,
    }: UseAxiosOptions = {}
): UseAxiosResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [params, setParams] = useState<Record<string, unknown>>(initialParams);

    const abortController = useRef<AbortController | null>(null);
    const initialFetchTriggered = useRef<boolean>(false);

    const auth = useAuth(); // Access authentication context

    useEffect(() => {
        // Add request interceptor
        const requestInterceptor = axios.interceptors.request.use(
            (request) => {
                if (auth.user?.access_token) {
                    if (!request.headers) {
                        request.headers = new axios.AxiosHeaders();
                    }
                    request.headers.set('Authorization', `Bearer ${auth.user.access_token}`);
                }
                return request;
            },
            (error) => Promise.reject(error)
        );

        // Add response interceptor
        const responseInterceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                if (
                    error.response?.status === 401
                    && (!auth.isAuthenticated || auth.user?.access_token && auth.user.expired)
                ) {
                    console.warn("Unauthorized, attempting token refresh...");
                    // Attempt silent token refresh
                    if (await auth.signinSilent()) {
                        error.config.headers['Authorization'] = `Bearer ${auth.user?.access_token}`;
                        return axios.request(error.config); // Retry the original request
                    }
                    console.warn("Token refresh failed, redirecting to login...");
                    await auth.signinRedirect(); // Redirect to log in if refresh fails
                }
                return Promise.reject(error);
            }
        );

        // Cleanup interceptors on unmount
        return () => {
            axios.interceptors.request.eject(requestInterceptor);
            axios.interceptors.response.eject(responseInterceptor);
        };
    }, [auth, auth.user]);

    const fetchData = useCallback(
        async (newParams?: Record<string, unknown>) => {
            const combinedParams = {...params, ...newParams};
            setParams(combinedParams);

            let cacheKey: string | undefined;

            if (cacheEnabled) {
                cacheKey = JSON.stringify({...config, params: combinedParams});
                const cachedData = getCachedData(cacheKey) as T | null;
                if (cachedData) {
                    console.log("Using cached data");
                    setData(cachedData);
                    setIsInitialLoading(false);
                    return;
                }
            }

            if (abortController.current) {
                abortController.current.abort();
            }

            abortController.current = new AbortController();

            setData(null); // Clear data immediately on re-fetch
            setIsInitialLoading(!initialFetchTriggered.current);
            setIsRefreshing(initialFetchTriggered.current);
            setLoading(true);
            setError(null);

            const attemptRequest = async (attempt = 1): Promise<void> => {
                try {
                    const response = await axios({
                        ...config,
                        params: combinedParams,
                        signal: abortController.current?.signal,
                    });

                    if (cacheEnabled && cacheKey) saveToCache(cacheKey, response.data);

                    setData(response.data);
                } catch (err) {
                    if (axios.isCancel(err)) {
                        console.warn("Request canceled");
                    } else if (
                        attempt < retries &&
                        axios.isAxiosError(err) &&
                        [500, 502, 503, 504].includes(err.response?.status || 0)

                        // The HTTP response codes we want to retry on:

                        // 500 (Internal Server Error):
                        // A general error indicating the server encountered an unexpected condition preventing it from fulfilling the request.

                        // 502 (Bad Gateway):
                        // The server, acting as a gateway or proxy, received an invalid response from the upstream server.

                        // 503 (Service Unavailable):
                        // The server is currently unavailable, often due to being overloaded or undergoing maintenance.

                        // 504 (Gateway Timeout):
                        // The server, acting as a gateway or proxy, did not receive a timely response from the upstream server.

                    ) {
                        // For each retry, the delay is multiplied by `2` raised to the power of `(attempt - 1)`.
                        // This formula scales the initial delay exponentially based on the current retry count.
                        const nextDelay = delay * 2 ** (attempt - 1);

                        console.warn(`Retrying attempt ${attempt} in ${nextDelay}ms...`);
                        await new Promise((res) => setTimeout(res, nextDelay));
                        await attemptRequest(attempt + 1);
                    } else {
                        setError(err instanceof Error ? err.message : "An unknown error occurred");
                    }
                } finally {
                    setIsInitialLoading(false);
                    setIsRefreshing(false);
                    setLoading(false);
                }
            };

            await attemptRequest();
        },
        [config, params, retries, delay, cacheEnabled]
    );

    useEffect(() => {
        if (autoFetch && !initialFetchTriggered.current) {
            initialFetchTriggered.current = true;
            fetchData().then();
        }
    }, [fetchData, autoFetch]);

    return {
        data,
        loading,
        isInitialLoading,
        isRefreshing,
        error,
        fetchData,
    };
}

export default useAxios;
