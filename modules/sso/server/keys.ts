import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  type KeyObject,
} from "node:crypto";
import { calculateJwkThumbprint, exportJWK, type JWK } from "jose";

export interface SigningKey {
  privateKey: KeyObject;
  publicKey: KeyObject;
  kid: string;
  /** JWK publik untuk endpoint JWKS (tidak pernah memuat bagian privat). */
  publicJwk: JWK;
}

const globalForKey = globalThis as unknown as {
  __ssoSigningKey?: Promise<SigningKey>;
};

async function loadSigningKey(): Promise<SigningKey> {
  // Di Vercel, PEM satu baris dengan "\n" literal.
  const pem = process.env.SSO_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();

  let privateKey: KeyObject;
  if (pem) {
    privateKey = createPrivateKey(pem);
  } else if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SSO_PRIVATE_KEY wajib diisi di production. Buat dengan `npm run sso:keys`.",
    );
  } else {
    // shortcut: kunci sementara per proses untuk development, token tidak
    // bertahan setelah restart; upgrade dengan mengisi SSO_PRIVATE_KEY.
    privateKey = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey;
  }

  const publicKey = createPublicKey(privateKey);
  const jwk = await exportJWK(publicKey);
  const kid = process.env.SSO_KEY_ID || (await calculateJwkThumbprint(jwk));

  return {
    privateKey,
    publicKey,
    kid,
    publicJwk: { ...jwk, kid, alg: "RS256", use: "sig" },
  };
}

export function getSigningKey(): Promise<SigningKey> {
  globalForKey.__ssoSigningKey ??= loadSigningKey();
  return globalForKey.__ssoSigningKey;
}

/** Hanya untuk pengujian. */
export function resetSigningKeyForTests(): void {
  delete globalForKey.__ssoSigningKey;
}
