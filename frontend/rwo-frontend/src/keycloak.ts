import Keycloak from 'keycloak-js';

// Setup Keycloak instance as needed
// Pass initialization options as required or leave blank to load from 'keycloak.json'
const keycloak = new Keycloak({
    url: process.env.REACT_APP_AUTH_URL,
    realm: process.env.REACT_APP_AUTH_REALM ?? '',
    clientId: process.env.REACT_APP_AUTH_CLIENT_ID ?? ''
});

export default keycloak;