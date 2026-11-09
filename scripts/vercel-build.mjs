// Dipakai Vercel sebagai `vercel-build`.
// Migrasi hanya dijalankan di environment Production agar deploy Preview tidak
// menyentuh database produksi. Preview memakai database terpisah dan dimigrasi manual.
import { execSync } from "node:child_process";

const run = (command) => execSync(command, { stdio: "inherit" });

run("npx prisma generate");

if (process.env.VERCEL_ENV === "production") {
  console.log("VERCEL_ENV=production: menjalankan prisma migrate deploy");
  run("npx prisma migrate deploy");
} else {
  console.log(
    `VERCEL_ENV=${process.env.VERCEL_ENV ?? "(tidak diatur)"}: migrasi dilewati`,
  );
}

run("npx next build");
