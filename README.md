# react-webapi-oidc

A React single-page app signs users in through Keycloak with OpenID Connect, using the authorization code flow with PKCE, and calls an ASP.NET Core API with the access token. Aspire starts Keycloak, the API, and the app with one command.

This repository is the companion to the article [OpenID Connect End to End: React, ASP.NET Core, and Keycloak](https://www.orderfactory.com/articles/openid-connect-end-to-end.html), which explains every setting below.

> [!IMPORTANT]
> The app is a browser-based OAuth client: it holds its own tokens. [RFC 10017](https://www.rfc-editor.org/rfc/rfc10017.html) does not recommend that design for business applications, sensitive applications, or applications that handle personal data, and Microsoft recommends a backend for frontend (BFF) instead. The article's section *When to Use a Backend for Frontend* describes the move.

## Features

- Sign-in with the authorization code flow and PKCE (S256). The implicit flow and the password grant are off.
- Exact redirect and post-logout redirect URIs, with no wildcards.
- The API's role belongs to the API's own Keycloak client, `weather-api`. The role mapper is scoped to that client, and Full Scope Allowed is off.
- Access tokens name the API as their audience. The API checks the signature, issuer, audience, expiry (with a 30-second clock tolerance), and the `meteorologist` role.
- The app removes the code and state from the address bar after sign-in, so a reload keeps the user signed in.
- Refresh tokens rotate. Every renewal runs through one function, and the app drops the stored user when Keycloak rejects its refresh token.

## System overview

| Component | Project | URL |
|-----------|---------|-----|
| Keycloak 26.8.1, realm `demo` | container started by `AppHost` | https://localhost:3443 |
| ASP.NET Core API on .NET 10 | `Api` | https://localhost:3445/forecast |
| React 19 app on Vite 8 | `spa` | https://localhost:3446 |
| Aspire 13 dashboard | `AppHost` | https://localhost:17175 |

The ports are fixed: the realm's redirect URIs and the token issuer depend on them. Every component serves HTTPS with the ASP.NET Core development certificate.

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js](https://nodejs.org/) 22.12 or later
- A container runtime: [Docker Desktop](https://www.docker.com/products/docker-desktop/), [Rancher Desktop](https://rancherdesktop.io/) with the dockerd (moby) engine, or [Podman](https://podman.io/) with `ASPIRE_CONTAINER_RUNTIME` set to `podman`
- A trusted ASP.NET Core development certificate. Aspire serves Keycloak and the app over HTTPS only when the certificate is present and trusted:

  ```shell
  dotnet dev-certs https --trust
  ```

The [Aspire CLI](https://aspire.dev/get-started/install-cli/) is optional. Without it, `dotnet run` and the IDEs fetch the matching version through `dnx`.

## Run

Clone the repository and start the AppHost from the repository root, in any of three ways:

- `aspire run`
- `dotnet run --project AppHost`
- In Visual Studio 2026 or Rider, open `react-webapi-oidc.slnx` and run the `AppHost` project.

The command line prints a sign-in link to the Aspire dashboard, which lists four resources. `spa-installer` runs `npm install` and finishes. `keycloak` starts in a container, imports the realm, and turns healthy in about a minute, longer on the first run while the image downloads. Then `api` starts, then `spa`.

## Usage

1. Open https://localhost:3446 and select **Sign in**.
2. Sign in as one of the two users from the realm file. Both use the password `password`.

   | User | Role | Show forecast |
   |------|------|---------------|
   | `jane` | `meteorologist` | `{"for":"jane","days":["Cool","Mild","Warm"]}` |
   | `bob` | none | `API: 403` |

3. Select **Show forecast**, then **Sign out**.

### Keycloak admin console

Open https://localhost:3443/admin and sign in as `admin`. To find the generated password, open **View details** for the `keycloak` resource in the dashboard and reveal `KC_BOOTSTRAP_ADMIN_PASSWORD` under **Environment variables**, or run `dotnet user-secrets list --project AppHost` and look for `Parameters:keycloak-password`.

Keycloak runs without a data volume. It starts empty and imports `AppHost/realms/demo-realm.json` on every run, so changes made in the admin console last only until the AppHost stops. Put lasting changes in the realm file.

## Keycloak configuration

`AppHost/realms/demo-realm.json` holds only the settings that differ from Keycloak's defaults.

**Realm `demo`:** Revoke Refresh Token on, with Refresh Token Max Reuse at 0. Keycloak then rotates refresh tokens and refuses a used one.

**Client `weather-api`**, the API: every flow off. It owns the client role `meteorologist`, which `jane` holds.

**Client `weather-spa`**, the browser app:

| Setting | Value |
|---------|-------|
| Client authentication | Off (a public client) |
| Standard flow | On |
| Direct access grants, Implicit flow, Service accounts roles | Off |
| Require PKCE | On (S256) |
| Valid redirect URIs | `https://localhost:3446/` |
| Valid post logout redirect URIs | `https://localhost:3446/` |
| Web origins | `https://localhost:3446` |
| Dedicated scope, Scope tab | Full scope allowed off; role `meteorologist` of `weather-api` assigned |
| Dedicated scope, Audience mapper | Included Client Audience `weather-api`, added to the access token |
| Dedicated scope, User Client Role mapper | Client ID `weather-api`, Token Claim Name `role`, added to the ID and access tokens |

## Project layout

```text
AppHost/                   Aspire AppHost
  AppHost.cs               Keycloak container, API, and Vite app on fixed ports
  realms/demo-realm.json   The realm Keycloak imports at startup
Api/                       ASP.NET Core minimal API
  Program.cs               Token validation, role policy, CORS, GET /forecast
ServiceDefaults/           Aspire service defaults: OpenTelemetry, health checks
spa/                       React, TypeScript, and Vite
  src/auth.ts              The UserManager and the one renew() function
  src/api.ts               apiGet(): sends the access token; renews and retries once after a 401
  src/App.tsx              Sign in, Show forecast, Sign out
  src/main.tsx             AuthProvider, and URL cleanup after sign-in
```

In `spa`, `npm run lint` runs [Oxlint](https://oxc.rs/docs/guide/usage/linter.html), and `npm run build` type-checks and builds the app.

## Troubleshooting

- **Keycloak or the app is served over `http://`, or sign-in fails:** the development certificate is missing or untrusted. Run `dotnet dev-certs https --check --trust`. If it finds no trusted certificate, run `dotnet dev-certs https --trust` and restart the AppHost.
- **A resource fails with an address already in use:** ports 3443, 3445, and 3446 must be free.
- **`keycloak` stays unhealthy:** make sure the container runtime is running, and read the resource's console logs in the dashboard.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
