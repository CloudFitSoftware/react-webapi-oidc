import './App.css'
import WeatherForecast from "./weather-forecast/WeatherForecast.tsx";
import {Header} from "./header/Header.tsx";

function App() {

    return (
        <>
            <Header/>
            <div className="card">
                <WeatherForecast/>
            </div>
        </>
    )
}

export default App
