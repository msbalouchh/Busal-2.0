import "server-only";

import { prisma } from "@/lib/prisma";

const BUSINESS_CODE_PREFIX = "BUS";
const BUSINESS_CODE_PAD = 6;

export function formatBusinessCode(sequence: number): string {
  return `${BUSINESS_CODE_PREFIX}-${String(sequence).padStart(BUSINESS_CODE_PAD, "0")}`;
}

export async function allocateBusinessCode(): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const sequence = await tx.businessCodeSequence.upsert({
      where: { id: 1 },
      create: { id: 1, lastValue: 1 },
      update: { lastValue: { increment: 1 } },
    });

    const nextValue = sequence.lastValue;
    const code = formatBusinessCode(nextValue);

    const existing = await tx.business.findUnique({
      where: { businessCode: code },
      select: { id: true },
    });

    if (existing) {
      throw new Error("Business code collision detected. Please retry.");
    }

    return code;
  });
}
