using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Auth configuration options displayed here for convenience.
// In a real application please load these from configuration.

const string authPolicyName = "weather-auth-policy";
const string corsPolicyName = "cors-app-policy";
const string issuingAuthority = @"https://keycloak.example.com/auth/realms/CloudFit";
const string validAudience = "account";
const string requiredRole = "meteorologist";

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

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(p => p.AddPolicy(corsPolicyName,
    corsPolicyBuilder =>
    {
        corsPolicyBuilder.WithOrigins("https://frontend.example.com:3000").AllowAnyMethod().AllowAnyHeader();
    }));

var app = builder.Build();

// Configure the HTTP request pipeline.

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(corsPolicyName);
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();