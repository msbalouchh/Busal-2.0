"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { AI_MEMORY_ROUTES } from "@/modules/ai-memory-management/constants/routes";
import { requireAiMemoryActionContext } from "@/modules/ai-memory-management/lib/get-ai-memory-context";
import type {
  MemoryCollectionInput,
  MemoryInput,
  MemoryMergeInput,
  MemoryUpdateInput,
} from "@/modules/ai-memory-management/types/ai-memory-types";
import { runMemoryRetentionJob } from "@/services/ai-memory-cleanup.service";
import { indexMemoryContent } from "@/services/ai-memory-index.service";
import {
  assignMemoryToCollection,
  createMemoryCollection,
  deleteMemoryCollection,
  mergeMemories,
} from "@/services/ai-memory-manager.service";
import {
  archiveMemory,
  createMemory,
  deleteMemory,
  pinMemory,
  updateMemory,
} from "@/services/ai-memory.service";

function revalidateMemoryPages(memoryId?: string) {
  revalidatePath(AI_MEMORY_ROUTES.dashboard());
  revalidatePath(AI_MEMORY_ROUTES.explorer());
  revalidatePath(AI_MEMORY_ROUTES.search());
  revalidatePath(AI_MEMORY_ROUTES.timeline());
  revalidatePath(AI_MEMORY_ROUTES.collections());
  revalidatePath(AI_MEMORY_ROUTES.analytics());
  if (memoryId) {
    revalidatePath(AI_MEMORY_ROUTES.memory(memoryId));
  }
}

export async function createMemoryAction(input: MemoryInput) {
  const context = await requireAiMemoryActionContext(PERMISSION_CODES.AI_MEMORY_CREATE);
  const memory = await createMemory(context.user.id, input);
  await indexMemoryContent(context.user.id, memory.id, memory.content, memory.metadata);
  revalidateMemoryPages(memory.id);
  return memory;
}

export async function updateMemoryAction(memoryId: string, input: MemoryUpdateInput) {
  const context = await requireAiMemoryActionContext(PERMISSION_CODES.AI_MEMORY_UPDATE);
  const memory = await updateMemory(context.user.id, memoryId, input);
  revalidateMemoryPages(memoryId);
  return memory;
}

export async function deleteMemoryAction(memoryId: string) {
  const context = await requireAiMemoryActionContext(PERMISSION_CODES.AI_MEMORY_DELETE);
  await deleteMemory(context.user.id, memoryId);
  revalidateMemoryPages(memoryId);
  return { success: true };
}

export async function pinMemoryAction(memoryId: string, pinned = true) {
  const context = await requireAiMemoryActionContext(PERMISSION_CODES.AI_MEMORY_UPDATE);
  const memory = await pinMemory(context.user.id, memoryId, pinned);
  revalidateMemoryPages(memoryId);
  return memory;
}

export async function archiveMemoryAction(memoryId: string, archived = true) {
  const context = await requireAiMemoryActionContext(PERMISSION_CODES.AI_MEMORY_UPDATE);
  const memory = await archiveMemory(context.user.id, memoryId, archived);
  revalidateMemoryPages(memoryId);
  return memory;
}

export async function mergeMemoriesAction(input: MemoryMergeInput) {
  const context = await requireAiMemoryActionContext(PERMISSION_CODES.AI_MEMORY_UPDATE);
  const memory = await mergeMemories(context.user.id, input);
  revalidateMemoryPages(memory.id);
  return memory;
}

export async function createMemoryCollectionAction(input: MemoryCollectionInput) {
  const context = await requireAiMemoryActionContext(PERMISSION_CODES.AI_MEMORY_CREATE);
  const collection = await createMemoryCollection(context.user.id, input);
  revalidateMemoryPages();
  return collection;
}

export async function deleteMemoryCollectionAction(collectionId: string) {
  const context = await requireAiMemoryActionContext(PERMISSION_CODES.AI_MEMORY_DELETE);
  await deleteMemoryCollection(context.user.id, collectionId);
  revalidateMemoryPages();
  return { success: true };
}

export async function assignMemoryToCollectionAction(memoryId: string, collectionId: string) {
  const context = await requireAiMemoryActionContext(PERMISSION_CODES.AI_MEMORY_UPDATE);
  await assignMemoryToCollection(context.user.id, memoryId, collectionId);
  revalidateMemoryPages(memoryId);
  return { success: true };
}

export async function runMemoryRetentionAction() {
  const context = await requireAiMemoryActionContext(PERMISSION_CODES.AI_MEMORY_UPDATE);
  const result = await runMemoryRetentionJob(context.user.id);
  revalidateMemoryPages();
  return result;
}
