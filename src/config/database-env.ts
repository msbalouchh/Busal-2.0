import "server-only";

export type EnvPresence = "configured" | "missing";

export function getDatabaseEnvStatus(): {
  databaseUrl: EnvPresence;
  directUrl: EnvPresence;
} {
  return {
    databaseUrl: process.env.DATABASE_URL?.trim() ? "configured" : "missing",
    directUrl: process.env.DIRECT_URL?.trim() ? "configured" : "missing",
  };
}

export function isDatabaseConfigured(): boolean {
  return getDatabaseEnvStatus().databaseUrl === "configured";
}
