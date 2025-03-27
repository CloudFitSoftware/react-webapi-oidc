# react-webapi-oidc

Prototype of a React SPA frontend with WebAPI backend using Keycloak open source OIDC provider.

This example demonstrates authentication and authorization of a *React* single page application (SPA) frontend, backed by a *C#, .NET, WebAPI* backend, to the *Keycloak* identity provider, using *Authorization Code Flow with Proof Key for Code Exchange (PKCE)*.

## Features

- Secure authentication using Keycloak with PKCE.
- Role-based authorization integrated with ASP.NET.
- React frontend with dynamic role-based UI.
- Backend API protected with OAuth2.

## System Overview

The system consists of the following components:

- **Keycloak Identity Provider**: Handles authentication and authorization.
- **WebAPI Backend**: A .NET WebAPI application that serves protected resources.
- **React Frontend**: A single-page application that interacts with the backend and Keycloak.

### Endpoints

- **Keycloak Identity Provider**: `https://localhost:3443`
- **Keycloak Management Port**: `https://localhost:3444`
- **WebAPI Backend**: `https://localhost:3445`
- **React Frontend**: `https://localhost:3446`

> **Note**: HTTPS is mandatory for authentication. Self-signed TLS developer certificates are used for all components.

## Prerequisites

Before setting up the project, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or later)
- [Visual Studio](https://visualstudio.microsoft.com/) (2022 or later) with .NET SDK
- [Docker](https://github.com/rancher-sandbox/rancher-desktop/releases) (for Keycloak setup) such as Rancher Desktop in dockerd mode, or other
- [Vite](https://vitejs.dev/) (for frontend development)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone ...
cd react-webapi-oidc
```

### 2. Run the Solution

- Open the *AspireKeycloack.sln* from Visual Studio.

- Start the *AspireKeycloack.AppHost* in *https* mode.

## Usage

1. After starting the application, you will see three resources in the *.NET Aspire dashboard*: `keycloak`, `frontend`, and `backend`. The keycloak starts in a container; while the container spins up the resource will be in the *“Running (Unhealthy)”* state. Please wait for it to turn *“Running”* with a checkmark in a green circle.
2. The backend will start once the keycloak is running, and the frontend will start once the backend is running. When all three are in “Running” state, you can click on the frontend endpoint at `https://localhost:3446` to open the application.
3. The preloaded Keycloak realm comes with two users: “bob” and “jane” (with password “password” for ether). Both users can login to the application, but while “jane” has the required “meteorologist” role, “bob” does not. As such, “jane” will be ale to get weather forecast data, and “bob” will get a *403 – Forbidden* error, when attempting to do so.
4. To enter the Keycloak admin interface, first click the ellipsis “Actions” button for the keycloak resource in the .NET Aspire dashboard, and choose “View details” menu item. Then scroll-down to the “Environment variables” section, and take a note of the KC_BOOTSTRAP_ADMIN_PASSWORD and KC_BOOTSTRAP_ADMIN_USERNAME variables. Those will contain the credentials you will need to login to the Keycloak as administrator.
5. Now you can click on the Keycloak `https://localhost:3443` endpoint and proceed with logging in.

## Keycloak Configuration Details

### Enable Proof Key for Code Exchange (PKCE)

In the client advanced settings, set the *Proof Key for Code Exchange Code Challenge Method* to **S256**.

![PKCE Challenge Method](pictures/pkce-method.png)

### Role-Based Authentication

For *Role-Based Authentication* to work, ASP.NET expects the user roles to be listed in the **role** claim (singular). Add a role mapper to the `Client Scopes` – `roles` – `Mappers`:

![Role Mapper](pictures/role-mapper.png)

## Troubleshooting

- **HTTPS Issues**: Ensure a self-signed development certificate is trusted in your environment https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-dev-certs.
- **Keycloak Connection Errors**: Verify that the Keycloak container is running and accessible.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.