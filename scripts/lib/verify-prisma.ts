import { PrismaClient } from "@prisma/client";

const globalForVerify = globalThis as unknown as {
  verifyPrisma: PrismaClient | undefined;
};

/** Singleton Prisma client for verification scripts — avoids pool exhaustion. */
export function getVerifyPrisma(): PrismaClient {
  if (!globalForVerify.verifyPrisma) {
    globalForVerify.verifyPrisma = new PrismaClient({
      log: process.env.VERIFY_PRISMA_LOG === "1" ? ["error", "warn"] : ["error"],
    });
  }

  return globalForVerify.verifyPrisma;
}

export async function disconnectVerifyPrisma(): Promise<void> {
  if (globalForVerify.verifyPrisma) {
    await globalForVerify.verifyPrisma.$disconnect();
    globalForVerify.verifyPrisma = undefined;
  }
}
