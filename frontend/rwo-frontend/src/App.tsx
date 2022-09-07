import React from 'react';
import './App.css';

import {ReactKeycloakProvider} from '@react-keycloak/web';
import keycloak from './keycloak';
import {Header} from './components/Header';
import {CallApi} from './components/CallApi';

const eventLogger = (event: unknown, error: unknown) => {
    console.log('onKeycloakEvent', event, error);
};

const tokenLogger = (tokens: unknown) => {
    console.log('onKeycloakTokens', tokens);
};

function App() {
    console.log(keycloak);
    return (
        <ReactKeycloakProvider
            authClient={keycloak}
            onEvent={eventLogger}
            onTokens={tokenLogger}
            initOptions={{
                    pkceMethod: 'S256'
                }}
        >
            <React.StrictMode>
                <Header/>
                <h1>Hello</h1>
                <CallApi/>
            </React.StrictMode>
        </ReactKeycloakProvider>
    );
}

export default App;
