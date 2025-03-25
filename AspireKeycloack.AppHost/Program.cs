using AspireKeycloack.AppHost;
using Projects;

var builder = DistributedApplication.CreateBuilder(args);

var keycloak = builder.AddHttpsKeycloak("keycloak", 3443, 3444)
        .WithDataVolume()
        .WithRealmImport("./Realms")
    ;

// the backend port number 3445 comes from its launchSettings.json
var weatherApi = builder.AddProject<backend>("backend")
        .WaitFor(keycloak)
        .WithReference(keycloak)
    ;

builder.AddNpmApp("frontend", "../frontend", "dev")
    .WaitFor(weatherApi)
    .WithHttpsEndpoint(3446, env: "VITE_PORT")
    .RunWithHttpsDevCertificate("CERT_PATH", "CERT_KEY_PATH")
    .WithEnvironment("BROWSER", "none")
    .WithEnvironment("VITE_API_URL", weatherApi.GetEndpoint("https"))
    .WithEnvironment("VITE_AUTH_AUTHORITY", "https://localhost:3443/realms/CloudFit/")
    .WithEnvironment("VITE_AUTH_CLIENT_ID", "rwo-frontend")
    .WithEnvironment("VITE_AUTH_REDIRECT_URI", "https://localhost:3446/")
    .WithEnvironment("VITE_ROLE_HASH", "316e3d139119d88c58df1e0dadea404ebec601bbeb80ab19ab19a9f4aa0df5d9")
    ;

builder.Build().Run();