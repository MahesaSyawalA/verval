/**
 * Mengelola modul (klien) yang boleh login lewat SSO.
 *
 *   npm run sso:client -- create --client-id modul-x --name "Modul X" \
 *     --launch-url https://x.example.com/login/sso \
 *     --redirect-uri https://x.example.com/auth/callback \
 *     --logout-uri https://x.example.com/ \
 *     --roles Dosen,Kaprodi [--description "..."] [--public]
 *   npm run sso:client -- list
 *   npm run sso:client -- rotate-secret --client-id modul-x
 *   npm run sso:client -- disable --client-id modul-x
 *
 * Memakai DATABASE_URL dari .env; periksa dulu database mana yang dituju.
 */
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ROLES } from "../config/roles";

const prisma = new PrismaClient();

function parseArgs(argv: string[]): { command: string; flags: Record<string, string> } {
  const [command = "", ...rest] = argv;
  const flags: Record<string, string> = {};
  for (let i = 0; i < rest.length; i++) {
    if (!rest[i].startsWith("--")) continue;
    const key = rest[i].slice(2);
    const next = rest[i + 1];
    flags[key] = next && !next.startsWith("--") ? (i++, next) : "true";
  }
  return { command, flags };
}

function fail(message: string): never {
  console.error(`Galat: ${message}`);
  process.exit(1);
}

function requireFlag(flags: Record<string, string>, name: string): string {
  const value = flags[name];
  if (!value || value === "true") fail(`--${name} wajib diisi.`);
  return value;
}

function parseUrls(value: string, label: string): string[] {
  return value.split(",").map((raw) => {
    const url = raw.trim();
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return fail(`${label} bukan URL yang valid: ${url}`);
    }
    const isLocal = ["localhost", "127.0.0.1"].includes(parsed.hostname);
    if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && isLocal)) {
      fail(`${label} harus https (http hanya untuk localhost): ${url}`);
    }
    if (parsed.hash) fail(`${label} tidak boleh memuat fragmen (#): ${url}`);
    return url;
  });
}

async function newSecret(): Promise<{ plain: string; hash: string }> {
  const plain = randomBytes(32).toString("base64url");
  return { plain, hash: await bcrypt.hash(plain, 10) };
}

async function create(flags: Record<string, string>) {
  const clientId = requireFlag(flags, "client-id");
  if (!/^[a-z0-9][a-z0-9._-]{1,99}$/.test(clientId)) {
    fail("--client-id hanya boleh huruf kecil, angka, titik, garis bawah, atau strip (2-100 karakter).");
  }

  const roles = requireFlag(flags, "roles").split(",").map((r) => r.trim());
  const unknownRole = roles.find((role) => !(ROLES as readonly string[]).includes(role));
  if (unknownRole) fail(`role tidak dikenal: ${unknownRole}. Pilihan: ${ROLES.join(", ")}`);

  const isPublic = flags.public === "true";
  const secret = isPublic ? null : await newSecret();

  await prisma.sso_clients.create({
    data: {
      client_id: clientId,
      name: requireFlag(flags, "name"),
      description: flags.description && flags.description !== "true" ? flags.description : null,
      launch_url: parseUrls(requireFlag(flags, "launch-url"), "--launch-url")[0],
      client_secret_hash: secret?.hash ?? null,
      redirect_uris: parseUrls(requireFlag(flags, "redirect-uri"), "--redirect-uri"),
      post_logout_redirect_uris: flags["logout-uri"]
        ? parseUrls(flags["logout-uri"], "--logout-uri")
        : [],
      allowed_roles: roles,
    },
  });

  console.log(`Klien "${clientId}" dibuat.`);
  if (secret) {
    console.log("\nclient_secret (hanya tampil sekali, simpan di env modul tersebut):");
    console.log(secret.plain);
  } else {
    console.log("\nKlien publik: tanpa client_secret, wajib memakai PKCE (S256).");
  }
}

async function list() {
  const clients = await prisma.sso_clients.findMany({ orderBy: { created_at: "asc" } });
  if (clients.length === 0) return console.log("Belum ada klien terdaftar.");
  for (const c of clients) {
    console.log(
      `${c.is_active ? "aktif " : "NONAKTIF"}  ${c.client_id}  (${c.client_secret_hash ? "rahasia" : "publik"})  ${c.name}`,
    );
    console.log(`    roles: ${JSON.stringify(c.allowed_roles)}  redirect: ${JSON.stringify(c.redirect_uris)}`);
  }
}

async function rotateSecret(flags: Record<string, string>) {
  const clientId = requireFlag(flags, "client-id");
  const client = await prisma.sso_clients.findUnique({ where: { client_id: clientId } });
  if (!client) fail(`klien "${clientId}" tidak ditemukan.`);
  if (!client.client_secret_hash) fail("klien publik tidak memiliki client_secret.");

  const secret = await newSecret();
  await prisma.sso_clients.update({
    where: { client_id: clientId },
    data: { client_secret_hash: secret.hash },
  });
  console.log(`client_secret baru untuk "${clientId}" (secret lama langsung tidak berlaku):`);
  console.log(secret.plain);
}

async function disable(flags: Record<string, string>) {
  const clientId = requireFlag(flags, "client-id");
  const client = await prisma.sso_clients.findUnique({ where: { client_id: clientId } });
  if (!client) fail(`klien "${clientId}" tidak ditemukan.`);

  await prisma.sso_clients.update({ where: { client_id: clientId }, data: { is_active: false } });
  await prisma.sso_refresh_tokens.updateMany({
    where: { client_id: client.id, revoked_at: null },
    data: { revoked_at: new Date() },
  });
  console.log(`Klien "${clientId}" dinonaktifkan dan semua refresh token-nya dicabut.`);
}

async function main() {
  const { command, flags } = parseArgs(process.argv.slice(2));
  switch (command) {
    case "create":
      return create(flags);
    case "list":
      return list();
    case "rotate-secret":
      return rotateSecret(flags);
    case "disable":
      return disable(flags);
    default:
      return fail("perintah: create | list | rotate-secret | disable (lihat komentar di atas file).");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
