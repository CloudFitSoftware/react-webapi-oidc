import { useState } from "react";
import { useAuth } from "react-oidc-context";
import { apiGet } from "./api";

export default function App() {
  const auth = useAuth();
  const [result, setResult] = useState("");

  if (auth.isLoading) return <p>Loading...</p>;
  if (!auth.isAuthenticated) {
    return (
      <>
        {auth.error && <p>{auth.error.message}</p>}
        <button onClick={() => auth.signinRedirect()}>
          Sign in
        </button>
      </>
    );
  }

  async function showForecast() {
    try {
      const res = await apiGet("/forecast");
      setResult(res.ok ? await res.text() : `API: ${res.status}`);
    } catch {
      setResult("The request failed. Try again.");
    }
  }

  const profile = auth.user?.profile;
  return (
    <>
      <p>Signed in as {profile?.preferred_username}</p>
      <button onClick={showForecast}>Show forecast</button>
      <button onClick={() => auth.signoutRedirect()}>
        Sign out
      </button>
      <pre>{result}</pre>
    </>
  );
}
