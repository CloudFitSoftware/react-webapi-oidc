import {useEffect, useRef} from 'react';
import type {AxiosInstance} from 'axios';
import axios from 'axios';

import {useKeycloak} from '@react-keycloak/web';

export const useAxios = (baseURL: string) => {
    const axiosInstance = useRef<AxiosInstance>();
    const {keycloak, initialized} = useKeycloak();
    const kcToken = keycloak?.token ?? '';
    const authenticated = keycloak.authenticated;
    const invalidateClient =  initialized && authenticated && keycloak.isTokenExpired(10);

    useEffect(() => {

        console.log("Creating a new HTTP client (axios).")

        axiosInstance.current = axios.create({
            baseURL,
            headers: {
                Authorization: initialized && authenticated ? `Bearer ${kcToken}` : false,
            },
        });

        return () => {
            axiosInstance.current = undefined;
        };
    }, [baseURL, initialized, kcToken, authenticated, invalidateClient]);

    return axiosInstance;
};
