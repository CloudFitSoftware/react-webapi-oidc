import { renew, userManager } from "./auth";

const apiUrl = import.meta.env.VITE_API_URL;

function send(path: string, token?: string) {
  const headers: HeadersInit = token
    ? { Authorization: `Bearer ${token}` }
    : {};
  return fetch(`${apiUrl}${path}`, { headers });
}

export async function apiGet(path: string) {
  const user = await userManager.getUser();
  const res = await send(path, user?.access_token);
  if (res.status !== 401 || !user) return res;

  // Expired while the tab slept?
  // Renew once and retry once.
  await res.body?.cancel();
  const renewed = await renew();
  return send(path, renewed?.access_token);
}
