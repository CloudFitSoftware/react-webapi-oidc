import React, {useCallback, useState} from 'react';
import {useAxios} from '../hooks/useAxios';

export function CallApi() {

    const [data, setData] = useState(undefined);

    const axiosInstance = useAxios('https://backend.example.com:7094');

    const callApi = useCallback(() => {
        !!axiosInstance.current && axiosInstance.current.get('/WeatherForecast')
            .then(res => setData(res.data))
            .catch(err => setData(err))
        ;
    }, [axiosInstance]);

    return (
        <><h2>Call API</h2>
            <button type="button" onClick={callApi}>
                Call API
            </button>
            <div>
                <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
        </>
    );
}