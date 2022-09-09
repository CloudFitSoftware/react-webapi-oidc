import {useEffect, useRef} from 'react';
import type {AxiosInstance} from 'axios';
import axios from 'axios';

import {useKeycloak} from '@react-keycloak/web';

export const useAxios = (baseURL: string) => {

    const axiosInstance = useRef<AxiosInstance>();
    const {keycloak, initialized} = useKeycloak();
    const kcToken = keycloak?.token ?? '';
    const authenticated = keycloak.authenticated;
    const minValidityInSeconds = 10;

    useEffect(() => {

        function cleanUp() {
            return () => axiosInstance.current = undefined;
        }

        function setAxiosInstance() {
            axiosInstance.current = axios.create({
                baseURL,
                headers: {
                    Authorization: initialized && authenticated ? `Bearer ${kcToken}` : false,
                },
            });
        }

        console.log('Setting HTTP client (axios) instance.');

        setAxiosInstance();

        keycloak.updateToken(minValidityInSeconds)
            .then((refreshed) => {
                if (refreshed) {
                    setAxiosInstance();
                    console.log('Token was successfully refreshed.');
                } else {
                    console.log('Token is still valid.');
                }
            }).catch((err) => {
            console.log('Failed to refresh the token, or the session has expired.');
            if (err) console.error(err);
        });

        return cleanUp();

    }, [baseURL, initialized, kcToken, authenticated, keycloak]);

    return axiosInstance;
};
