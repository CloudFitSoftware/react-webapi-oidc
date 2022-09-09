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
    const checkpointUrgency = authenticated && keycloak.isTokenExpired(minValidityInSeconds);

    useEffect(() => {

        function cleanUp() {
            return () => axiosInstance.current = undefined;
        }

        function setAxiosInstance() {
            console.log('Setting HTTP client (axios) instance.');
            axiosInstance.current = axios.create({
                baseURL,
                headers: {
                    Authorization: initialized && authenticated ? `Bearer ${kcToken}` : false,
                },
            });
        }

        setAxiosInstance();

        if (!checkpointUrgency) return cleanUp();

        keycloak.updateToken(minValidityInSeconds)
            .then((refreshed) => {
                if (refreshed) {
                    console.log('Token was successfully refreshed.');
                    setAxiosInstance();
                } else {
                    console.log('Token is still valid.');
                }
            }).catch((err) => {
            console.log('Failed to refresh the token, or the session has expired.');
            if (err) console.error(err);
        });

        return cleanUp();

    }, [baseURL, initialized, kcToken, checkpointUrgency, authenticated, keycloak]);

    return axiosInstance;
};
