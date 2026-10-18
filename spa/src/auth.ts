import {
  ErrorResponse,
  UserManager,
  type User,
} from "oidc-client-ts";

export const userManager = new UserManager({
  authority: import.meta.env.VITE_AUTHORITY,
  client_id: "weather-spa",
  redirect_uri: `${location.origin}/`,
  post_logout_redirect_uri: `${location.origin}/`,
  scope: "openid profile",
  // Renewal runs through renew().
  automaticSilentRenew: false,
});

let renewal: Promise<User | null> | undefined;

// One renewal at a time: with
// rotation, a second refresh
// with the same token fails.
export function renew() {
  renewal ??= userManager
    .signinSilent()
    .catch(async (err: unknown) => {
      // Refresh token rejected:
      // drop the user.
      if (
        err instanceof ErrorResponse &&
        err.error === "invalid_grant"
      ) {
        await userManager.removeUser();
      }
      throw err;
    })
    .finally(() => {
      renewal = undefined;
    });
  return renewal;
}

// Renew a minute before expiry.
userManager.events
  .addAccessTokenExpiring(() => {
    // If this fails, the next API
    // call renews after its 401.
    renew().catch(() => {});
  });
