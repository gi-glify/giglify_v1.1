function encode(value: Uint8Array): string {
  let binary = "";
  value.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decode(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(normalized);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function secret(): string {
  const value = Deno.env.get("EMAIL_UNSUBSCRIBE_SECRET") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!value) throw new Error("EMAIL_UNSUBSCRIBE_SECRET is not configured");
  return value;
}

async function signingKey() {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function createUnsubscribeToken(userId: string): Promise<string> {
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", await signingKey(), new TextEncoder().encode(userId)));
  return `${encode(new TextEncoder().encode(userId))}.${encode(signature)}`;
}

export async function verifyUnsubscribeToken(token: string): Promise<string | null> {
  const [encodedUserId, encodedSignature] = token.split(".", 2);
  if (!encodedUserId || !encodedSignature) return null;
  try {
    const userIdBytes = decode(encodedUserId);
    const valid = await crypto.subtle.verify("HMAC", await signingKey(), decode(encodedSignature), userIdBytes);
    if (!valid) return null;
    const userId = new TextDecoder().decode(userIdBytes);
    return /^[0-9a-f-]{36}$/i.test(userId) ? userId : null;
  } catch {
    return null;
  }
}
