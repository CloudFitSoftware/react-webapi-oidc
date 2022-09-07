import {useEffect, useRef} from 'react';
import type {AxiosInstance} from 'axios';
import axios from 'axios';

import {useKeycloak} from '@react-keycloak/web';

export const useAxios = (baseURL: string) => {
    const axiosInstance = useRef<AxiosInstance>();
    const {keycloak, initialized} = useKeycloak();
    const kcToken = keycloak?.token ?? '';

    useEffect(() => {
        axiosInstance.current = axios.create({
            baseURL,
            headers: {
                Authorization: initialized && keycloak.authenticated ? `Bearer ${kcToken}` : false,
            },
        });

        return () => {
            axiosInstance.current = undefined;
        };
    }, [baseURL, initialized, kcToken]);

    return axiosInstance;
};
