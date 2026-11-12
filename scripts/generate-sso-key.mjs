// Membuat pasangan kunci RS256 untuk SSO. Jalankan: npm run sso:keys
// Hanya kunci privat yang disimpan; kunci publik diturunkan otomatis dan
// disajikan lewat GET /api/sso/jwks.
import { generateKeyPairSync } from "node:crypto";

const { privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});

console.log("Tambahkan ke environment (rahasia: jangan di-commit, jangan dibagikan):\n");
console.log(`SSO_PRIVATE_KEY="${privateKey.trim().replace(/\n/g, "\\n")}"`);
console.log(
  "\nMengganti kunci membatalkan semua access token yang beredar; refresh token tetap berlaku.",
);
