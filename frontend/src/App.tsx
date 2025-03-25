import './App.css'
import WeatherForecast from "./weather-forecast/WeatherForecast.tsx";
import {Header} from "./header/Header.tsx";

function App() {

  return (
    <>
      <Header/>
      <h1>Vite + React</h1>
      <div className="card">
        <WeatherForecast/>
      </div>
    </>
  )
}

export default App
