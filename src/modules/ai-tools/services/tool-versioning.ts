import { DEFAULT_PLATFORM_TOOL_VERSION } from "@/modules/ai-tools/constants/platform-tools";
import { platformToolRegistry } from "@/modules/ai-tools/registry/platform-tool-registry";
import type { PlatformToolVersion } from "@/modules/ai-tools/types/platform-tool";

const versionHistory = new Map<string, PlatformToolVersion[]>();

function seedVersions(): void {
  for (const tool of platformToolRegistry.list()) {
    versionHistory.set(tool.id, [
      {
        toolId: tool.id,
        version: tool.version ?? DEFAULT_PLATFORM_TOOL_VERSION,
        changelog: "Initial platform release.",
        deprecated: false,
        releasedAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
  }
}

seedVersions();

/** Tracks tool version history and deprecation (mock, in-memory). */
export class ToolVersioningService {
  getCurrentVersion(toolId: string): string | null {
    return platformToolRegistry.get(toolId)?.version ?? null;
  }

  getHistory(toolId: string): PlatformToolVersion[] {
    return versionHistory.get(toolId) ?? [];
  }

  registerVersion(entry: PlatformToolVersion): void {
    const history = versionHistory.get(entry.toolId) ?? [];
    history.push(entry);
    versionHistory.set(entry.toolId, history);
  }

  deprecate(toolId: string, version: string): void {
    const history = versionHistory.get(toolId) ?? [];

    for (const entry of history) {
      if (entry.version === version) {
        entry.deprecated = true;
      }
    }

    versionHistory.set(toolId, history);
  }

  isDeprecated(toolId: string, version?: string): boolean {
    const history = versionHistory.get(toolId) ?? [];
    const target = version ?? this.getCurrentVersion(toolId);

    return history.some((entry) => entry.version === target && entry.deprecated);
  }
}

export const toolVersioningService = new ToolVersioningService();
