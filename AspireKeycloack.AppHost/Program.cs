using AspireKeycloack.AppHost;

var builder = DistributedApplication.CreateBuilder(args);

var weatherApi = builder.AddProject<Projects.backend>("backend");

builder.AddNpmApp("frontend", "../frontend", "dev")
    .WaitFor(weatherApi)
    .WithEnvironment("BROWSER", "none")
    .WithHttpsEndpoint(env: "VITE_PORT")
    .WithEnvironment("VITE_API_URL", weatherApi.GetEndpoint("https"))
    .RunWithHttpsDevCertificate("CERT_PATH", "CERT_KEY_PATH")
;

builder.Build().Run();
