const COOKIE_NAME = "sami_session";
const MAX_AGE_SECONDS = 60 * 60 * 8;

function secret() {
  return process.env.SESSION_SECRET || "test-sami-session-secret-change-me-32chars-min";
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function createSessionToken(adminId: string, username: string): Promise<string> {
  const payload = btoa(
    JSON.stringify({ adminId, username, exp: Date.now() + MAX_AGE_SECONDS * 1000 })
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const sig = await hmac(payload);
  return `${payload}.${sig}`;
}

export async function verifySessionToken(
  token: string | undefined
): Promise<{ adminId: string; username: string } | null> {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = await hmac(payload);
  if (sig.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return null;
  try {
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const data = JSON.parse(atob(b64));
    if (!data.adminId || typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return { adminId: data.adminId, username: data.username };
  } catch {
    return null;
  }
}

export { COOKIE_NAME, MAX_AGE_SECONDS };
