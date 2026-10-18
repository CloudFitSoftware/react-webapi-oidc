import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "react-oidc-context";
import { userManager } from "./auth";
import App from "./App";

// Remove the code and state from
// the address bar after sign-in.
function cleanUrl() {
  history.replaceState({}, document.title, location.pathname);
}

const root = document.getElementById("root")!;
createRoot(root).render(
  <StrictMode>
    <AuthProvider
      userManager={userManager}
      onSigninCallback={cleanUrl}
    >
      <App />
    </AuthProvider>
  </StrictMode>,
);
