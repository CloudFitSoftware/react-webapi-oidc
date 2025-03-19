import React, {useState, useEffect} from 'react';

export interface Forecast {
    date: string;
    temperatureC: number;
    temperatureF: number;
    summary: string;
}

const WeatherForecast: React.FC = () => {
    const [forecasts, setForecasts] = useState<Array<Forecast>>([]);

    const requestWeather = async () => {
        const weather = await fetch(`${import.meta.env.VITE_API_URL}/weatherforecast`);
        console.log(weather);

        const weatherJson = await weather.json();
        console.log(weatherJson);

        setForecasts(weatherJson);
    };

    useEffect(() => {
        console.log("VITE_API_URL", import.meta.env.VITE_API_URL);
        requestWeather().then();
    }, []);

    return (
        <div className="App">
            <header className="App-header">
                <h1>React (Vite) Weather</h1>
                <table>
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
                </table>
            </header>
        </div>
    );
};

export default WeatherForecast;