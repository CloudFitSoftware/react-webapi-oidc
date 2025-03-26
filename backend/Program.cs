using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

// Auth configuration options

const string authPolicyName = "weather-auth-policy";
const string corsPolicyName = "cors-app-policy";

var issuingAuthority = Environment.GetEnvironmentVariable("BACKEND_AUTH_AUTHORITY") ??
                       throw new InvalidOperationException("Environment variable BACKEND_AUTH_AUTHORITY is not set.");

var corsOrigin = Environment.GetEnvironmentVariable("BACKEND_CORS_ORIGIN") ??
                 throw new InvalidOperationException("Environment variable BACKEND_CORS_ORIGIN is not set.");

var validAudience = Environment.GetEnvironmentVariable("BACKEND_VALID_AUDIENCE") ??
                    throw new InvalidOperationException("Environment variable BACKEND_VALID_AUDIENCE is not set.");

var requiredRole = Environment.GetEnvironmentVariable("BACKEND_REQUIRED_ROLE") ??
                   throw new InvalidOperationException("Environment variable BACKEND_REQUIRED_ROLE is not set.");

builder.Services.AddAuthentication().AddJwtBearer(jwtBearerOptions =>
{
    jwtBearerOptions.Authority = issuingAuthority;
    jwtBearerOptions.TokenValidationParameters = new TokenValidationParameters
    {
        ValidIssuer = issuingAuthority,
        ValidAudience = validAudience,
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true
    };
});

builder.Services.AddAuthorization(authorizationOptions =>
{
    authorizationOptions.AddPolicy(authPolicyName, policy =>
    {
        policy.AuthenticationSchemes.Add(JwtBearerDefaults.AuthenticationScheme);
        policy.RequireAuthenticatedUser();
        policy.RequireRole(requiredRole);
    });
});

builder.Services.AddControllers(mvcOptions =>
{
    // Require authorization for all controllers.
    // You can use Authorize attributes in individual controllers instead.

    mvcOptions.Filters.Add(new AuthorizeFilter(authPolicyName));
});

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Add CORS policy
builder.Services.AddCors(p => p.AddPolicy(corsPolicyName,
    corsPolicyBuilder => corsPolicyBuilder
        .WithOrigins(corsOrigin)
        .AllowAnyMethod()
        .AllowAnyHeader()
));

var app = builder.Build();

app.MapDefaultEndpoints();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment()) app.MapOpenApi();

app.UseCors(corsPolicyName);

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();