// Edge-uyumlu JWT yardımcıları. Bağımlılık: jose.
import { SignJWT, jwtVerify } from "jose";

export type SessionPayload = { sub: string; role: string; schoolId: string | null; name: string; email: string };

const secret = () => {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET en az 32 karakter olmalı (.env)");
  return new TextEncoder().encode(s);
};

export async function signSession(payload: SessionPayload, maxAgeSec = 60 * 60 * 24 * 7) {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${maxAgeSec}s`).setIssuer("virel-drive").sign(secret());
}

export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: "virel-drive" });
    return {
      sub: String(payload.sub),
      role: String(payload.role),
      schoolId: (payload.schoolId as string | null) ?? null,
      name: String(payload.name ?? ""),
      email: String(payload.email ?? ""),
    };
  } catch {
    return null;
  }
}
