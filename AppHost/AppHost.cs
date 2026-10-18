var builder = DistributedApplication
    .CreateBuilder(args);

// The realm's redirect URIs and
// the issuer URL use these ports.
const int keycloakPort = 3443;
const int spaPort = 3446;
const string realm = "demo";
const string keycloakImageTag = "26.8.1";

var keycloakUrl = $"https://localhost:{keycloakPort}";
var spaUrl = $"https://localhost:{spaPort}";
var authority = $"{keycloakUrl}/realms/{realm}";

var keycloak = builder
    .AddKeycloak("keycloak", keycloakPort)
    .WithImageTag(keycloakImageTag)
    .WithRealmImport("./realms");

var api = builder
    .AddProject<Projects.Api>("api")
    .WithEnvironment("Authority", authority)
    .WithEnvironment("SpaOrigin", spaUrl)
    .WithHttpHealthCheck("/health")
    .WaitFor(keycloak);

builder.AddViteApp("spa", "../spa")
    .WithHttpsDeveloperCertificate()
    .WithEndpoint("http", e => e.Port = spaPort)
    .WithEnvironment("VITE_AUTHORITY", authority)
    .WithEnvironment("VITE_API_URL", api.GetEndpoint("https"))
    .WaitFor(api);

builder.Build().Run();
