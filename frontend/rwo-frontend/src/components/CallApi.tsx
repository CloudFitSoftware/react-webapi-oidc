import React, {useEffect, useState} from 'react';
import {useAxios} from '../hooks/useAxios';

export function CallApi() {

    const axiosInstance = useAxios('https://backend.example.com:7094');
    const [readyForApi, setReadyForApi] = useState(false);
    const [data, setData] = useState(undefined);

    useEffect(() => {
        if (!axiosInstance.current || !readyForApi) return;

        console.log('Initiating the API call...');
        axiosInstance.current.get('/WeatherForecast')
            .then(res => setData(res.data))
            .catch(err => setData(err));

        setReadyForApi(false);
    }, [readyForApi, axiosInstance]);

    const callApi = () => setReadyForApi(true);

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