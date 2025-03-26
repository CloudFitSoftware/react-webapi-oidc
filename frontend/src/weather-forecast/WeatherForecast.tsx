import React from 'react';
import useAxios from "../hooks/useAxios.ts";

export interface Forecast {
    date: string;
    temperatureC: number;
    temperatureF: number;
    summary: string;
}

const WeatherForecast: React.FC = () => {

    const {data: forecasts, loading, fetchData, error} = useAxios<Forecast[]>(
        {method: "GET", url: `${import.meta.env.VITE_API_URL}/WeatherForecast`},
        {retries: 7, delay: 50, autoFetch: false, cacheEnabled: false}
    );

    function ForecastDisplay() {
        if (loading) return <p>Loading...</p>;
        return <table>
            <thead>
            <tr>
                <th>Date</th>
                <th>Temp. (C)</th>
                <th>Temp. (F)</th>
                <th>Summary</th>
            </tr>
            </thead>
            <tbody>
            {(
                forecasts ?? [
                    {
                        date: "N/A",
                        temperatureC: "",
                        temperatureF: "",
                        summary: "No forecasts",
                    },
                ]
            ).map((w) => {
                return (
                    <tr key={w.date}>
                        <td>{w.date}</td>
                        <td>{w.temperatureC}</td>
                        <td>{w.temperatureF}</td>
                        <td>{w.summary}</td>
                    </tr>
                );
            })}
            </tbody>
        </table>;
    }

    return (
        <div className="App">
            <header className="App-header">
                <h1>React (Vite) Weather</h1>
                <button onClick={() => fetchData()}>
                    Fetch Weather
                </button>
                {ForecastDisplay()}
                {error && <p className="error">Error: {error}</p>}
            </header>
        </div>
    );
};

export default WeatherForecast;