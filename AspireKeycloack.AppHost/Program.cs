using AspireKeycloack.AppHost;
using Projects;

var builder = DistributedApplication.CreateBuilder(args);

var keycloak = builder.AddHttpsKeycloak("keycloak", 3443, 3444)
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
    ;

builder.Build().Run();