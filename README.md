# react-webapi-oidc
Prototype of a React SPA frontend with WebAPI backend using Keycloak open source OIDC provider.

This example demonstrates authentication and authorization of a *React* single page application (SPA) frontend,
backed by a *C#, .NET, WebAPI* backend, to the *Keycloak* identity provider, using 
*Authorization Code Flow with Proof Key for Code Exchange (PKCE)*.

## Parts of the system
The system consists of three separate parts. In this sample, .NET Aspire configures the endpoints as follows:

- https://localhost:3443 -- Keycloak identity provider
- https://localhost:3444 -- Keycloak management port
- https://localhost:3445 -- WebAPI backend application
- https://localhost:3446 -- React frontend application

Please note *https* is essential for authentication. When orchestrating the solution execution with .NET Aspire,
it will use the Visual Studio configured self-signed TLS developer certificates for all the components.

## Keycloak configuration

Most of the Keycloak default configuration settings work well with this setup, with two notable exceptions.

### Enable Proof Key for Code Exchange (PKCE)
First of all, in the client advanced settings, please set 
the *Proof Key for Code Exchange Code Challenge Method* to **S256**.

![PKCE Challenge Method](pictures/pkce-method.png)

This may also be good time to verify that your *Access Token Lifespan* is set to 
a relatively short value, something like 5 minutes usually works well.

### ASP.NET Role Based Authentication
For *Role Based Authentication* to work, ASP.NET expects the user roles to be listed in 
the **role** claim (singular, without “s” at the end). As such you can add role mapper to 
the `Client Scopes` – `roles` - `Mappers`:

![Role Mapper](pictures/role-mapper.png)