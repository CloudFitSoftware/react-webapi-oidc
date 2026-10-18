using System.Security.Claims;

var builder = WebApplication
    .CreateBuilder(args);

builder.AddServiceDefaults();

const string forecastPolicy = "forecast";

string Setting(string key) => builder.Configuration[key]
    ?? throw new InvalidOperationException($"{key} is not set.");

builder.Services
    .AddAuthentication()
    .AddJwtBearer(options =>
    {
        options.Authority = Setting("Authority");
        options.Audience = "weather-api";
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new()
        {
            NameClaimType = "preferred_username",
            RoleClaimType = "role",
            ClockSkew = TimeSpan.FromSeconds(30),
        };
    });

builder.Services
    .AddAuthorizationBuilder()
    .AddPolicy(forecastPolicy, p =>
        p.RequireRole("meteorologist"));

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy => policy
        .WithOrigins(Setting("SpaOrigin"))
        .WithHeaders("Authorization")
        .WithMethods("GET")));

var app = builder.Build();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapDefaultEndpoints();

app.MapGet("/forecast", (ClaimsPrincipal user) => new
{
    For = user.Identity?.Name,
    Days = new[] { "Cool", "Mild", "Warm" },
})
.RequireAuthorization(forecastPolicy);

app.Run();
