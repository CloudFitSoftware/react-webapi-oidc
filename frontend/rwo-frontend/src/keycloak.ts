import Keycloak from 'keycloak-js';

// Setup Keycloak instance as needed
// Pass initialization options as required or leave blank to load from 'keycloak.json'
const keycloak = new Keycloak({
    url: 'http://keycloak.example.com/auth',
    realm: 'CloudFit',
    clientId: 'rwo-frontend'
});

export default keycloak;