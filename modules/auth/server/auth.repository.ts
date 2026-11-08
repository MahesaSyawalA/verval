import { db } from "@/lib/db";

export async function findUserByEmailOrNip(identifier: string) {
  const normalized = identifier.trim();
  return db.users.findFirst({
    where: {
      OR: [{ email: normalized }, { nip: normalized }],
    },
  });
}

export async function findUserById(id: string) {
  return db.users.findUnique({
    where: { id },
  });
}
