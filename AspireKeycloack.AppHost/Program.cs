using AspireKeycloack.AppHost;
using Projects;
using System.Security.Cryptography;
using System.Text;

const int keycloakPort = 3443;
const int keycloakManagementPort = 3444;
const int backendPort = 3445;
const int frontendPort = 3446;

const string realm = "CloudFit";
const string? authClientId = "rwo-frontend";
const string accessTokenAudience = "account";
const string requiredRole = "meteorologist";

const string keycloakDomain = "localhost";
const string frontendDomain = "localhost";

var authAuthority = $"https://{keycloakDomain}:{keycloakPort}/realms/{realm}/";
var corsOrigin = $"https://{frontendDomain}:{frontendPort}";
var authRedirectUrl = $"https://{frontendDomain}:{frontendPort}/";

// the hash of the role is used in the frontend application to avoid exposing the raw role name
var requiredRoleHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(requiredRole)));

var builder = DistributedApplication.CreateBuilder(args);

var keycloak = builder
        .AddHttpsKeycloak("keycloak", keycloakPort, keycloakManagementPort)
        .WithDataVolume()
        .WithRealmImport("./Realms")
    ;

var weatherApi = builder
        .AddProject<backend>("backend", o => o.ExcludeLaunchProfile = true)
        .WithHttpsEndpoint(backendPort)
        .WithEnvironment("ASPNETCORE_ENVIRONMENT", Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"))
        .WithEnvironment("DOTNET_ENVIRONMENT", Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT"))
        .WithEnvironment("BACKEND_AUTH_AUTHORITY", authAuthority)
        .WithEnvironment("BACKEND_CORS_ORIGIN", corsOrigin)
        .WithEnvironment("BACKEND_VALID_AUDIENCE", accessTokenAudience)
        .WithEnvironment("BACKEND_REQUIRED_ROLE", requiredRole)
        .WaitFor(keycloak)
        .WithReference(keycloak)
    ;

builder.AddNpmApp("frontend", "../frontend", "dev")
    .WaitFor(weatherApi)
    .WithHttpsEndpoint(frontendPort, env: "VITE_PORT")
    .RunWithHttpsDevCertificate("CERT_PATH", "CERT_KEY_PATH")
    .WithEnvironment("BROWSER", "none")
    .WithEnvironment("VITE_API_URL", weatherApi.GetEndpoint("https"))
    .WithEnvironment("VITE_AUTH_AUTHORITY", authAuthority)
    .WithEnvironment("VITE_AUTH_CLIENT_ID", authClientId)
    .WithEnvironment("VITE_AUTH_REDIRECT_URI", authRedirectUrl)
    .WithEnvironment("VITE_ROLE_HASH", requiredRoleHash)
    ;

builder.Build().Run();