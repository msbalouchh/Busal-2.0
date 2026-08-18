"use client";

import { useState, useTransition } from "react";

import {
  issueCustomerAiEmbedTokenAction,
  syncBusinessKnowledgeAction,
  updateCustomerAiCapabilitiesAction,
  updateCustomerAiIdentityAction,
} from "@/modules/customer-ai/actions/customer-ai-actions";
import { AiOperationsSettingsSection } from "@/modules/customer-ai/components/ai-operations-settings-section";
import { AiAvatarUploadField } from "@/modules/customer-ai/components/ai-avatar-upload-field";
import { CUSTOMER_AI_TONE_OPTIONS, CUSTOMER_AI_ROUTES } from "@/modules/customer-ai/constants/customer-ai.constants";
import { AI_PLATFORM_ROUTES } from "@/modules/ai-platform/constants/ai-platform";
import type {
  CustomerAiAnalyticsSnapshot,
  CustomerAiCapabilities,
  CustomerAiIdentity,
  CustomerConversationSummary,
  AiOperationsCapabilities,
} from "@/modules/customer-ai/types/customer-ai.types";
import type { MessagingChannelDefinition } from "@/modules/customer-ai/channels/messaging-channel-registry";

interface AiControlCenterPanelProps {
  identity: CustomerAiIdentity;
  capabilities: CustomerAiCapabilities;
  operationsCapabilities: AiOperationsCapabilities;
  analytics: CustomerAiAnalyticsSnapshot;
  conversations: CustomerConversationSummary[];
  channels: MessagingChannelDefinition[];
  knowledge: {
    publishedDocuments: number;
    totalDocuments: number;
    memoryFactTitles: string[];
  };
  canManage: boolean;
  businessId: string;
  canManageSettings: boolean;
}

export function AiControlCenterPanel({
  identity,
  capabilities,
  operationsCapabilities,
  analytics,
  conversations,
  channels,
  knowledge,
  canManage,
  businessId,
  canManageSettings,
}: AiControlCenterPanelProps) {
  const [form, setForm] = useState({
    aiName: identity.aiName,
    aiPersonality: identity.aiPersonality,
    aiAvatarUrl: identity.aiAvatarUrl ?? "",
    aiGreeting: identity.aiGreeting ?? "",
    aiTone: identity.aiTone,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capabilityForm, setCapabilityForm] = useState(capabilities);
  const [embedSnippet, setEmbedSnippet] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSaveIdentity = () => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await updateCustomerAiIdentityAction({
          aiName: form.aiName,
          aiPersonality: form.aiPersonality,
          aiAvatarUrl: form.aiAvatarUrl || null,
          aiGreeting: form.aiGreeting || null,
          aiTone: form.aiTone,
        });
        setMessage("AI identity saved.");
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Failed to save");
      }
    });
  };

  const handleSyncKnowledge = () => {
    startTransition(async () => {
      try {
        const result = await syncBusinessKnowledgeAction();
        setMessage(
          `Synced ${result.memoryFactsSynced} business facts and ${result.knowledgeDocumentsSynced} knowledge documents (${result.publishedDocumentCount} published).`,
        );
      } catch (syncError) {
        setError(syncError instanceof Error ? syncError.message : "Sync failed");
      }
    });
  };

  const handleSaveCapabilities = () => {
    startTransition(async () => {
      try {
        await updateCustomerAiCapabilitiesAction(capabilityForm);
        setMessage("AI capabilities updated.");
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Failed to save capabilities");
      }
    });
  };

  const handleGenerateEmbed = () => {
    startTransition(async () => {
      try {
        const origin = typeof window !== "undefined" ? window.location.origin : "https://localhost";
        const result = await issueCustomerAiEmbedTokenAction(origin);
        setEmbedSnippet(
          `<iframe src="${origin}${result.embedUrl}" width="400" height="600" style="border:none;border-radius:12px;" title="${form.aiName}"></iframe>`,
        );
      } catch (embedError) {
        setError(embedError instanceof Error ? embedError.message : "Failed to generate embed");
      }
    });
  };

  return (
    <div className="space-y-8">
      <section className="rounded-xl border p-6">
        <h2 className="mb-1 text-lg font-semibold">AI Identity</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Configure how your AI presents itself to customers across all channels.
        </p>

        {message ? (
          <p className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="text-destructive mb-4 rounded-lg border p-3 text-sm" role="alert">
            {error}
          </p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">AI Name</span>
            <input
              className="bg-background w-full rounded-md border px-3 py-2"
              value={form.aiName}
              disabled={!canManage || isPending}
              onChange={(e) => setForm((c) => ({ ...c, aiName: e.target.value }))}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Tone</span>
            <select
              className="bg-background w-full rounded-md border px-3 py-2"
              value={form.aiTone}
              disabled={!canManage || isPending}
              onChange={(e) =>
                setForm((c) => ({
                  ...c,
                  aiTone: e.target.value as CustomerAiIdentity["aiTone"],
                }))
              }
            >
              {CUSTOMER_AI_TONE_OPTIONS.map((tone) => (
                <option key={tone} value={tone}>
                  {tone}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm md:col-span-2">
            <span className="font-medium">Personality</span>
            <input
              className="bg-background w-full rounded-md border px-3 py-2"
              value={form.aiPersonality}
              disabled={!canManage || isPending}
              onChange={(e) => setForm((c) => ({ ...c, aiPersonality: e.target.value }))}
            />
          </label>
          <label className="space-y-1 text-sm md:col-span-2">
            <span className="font-medium">Greeting</span>
            <textarea
              className="bg-background w-full rounded-md border px-3 py-2"
              rows={2}
              value={form.aiGreeting}
              disabled={!canManage || isPending}
              onChange={(e) => setForm((c) => ({ ...c, aiGreeting: e.target.value }))}
              placeholder={`Hi! I'm ${form.aiName}, the AI assistant for ${identity.businessName}.`}
            />
          </label>
          {canManage ? (
            <div className="md:col-span-2">
              <AiAvatarUploadField
                currentUrl={form.aiAvatarUrl || null}
                disabled={isPending}
                onUploaded={(url) => setForm((c) => ({ ...c, aiAvatarUrl: url }))}
              />
            </div>
          ) : null}
        </div>

        {canManage ? (
          <button
            type="button"
            className="bg-primary text-primary-foreground mt-4 rounded-md px-4 py-2 text-sm disabled:opacity-50"
            disabled={isPending}
            onClick={handleSaveIdentity}
          >
            Save Identity
          </button>
        ) : null}
      </section>

      <section className="rounded-xl border p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Business Knowledge</h2>
            <p className="text-muted-foreground text-sm">
              Auto-sync menu, hours, locations, business info, and published knowledge documents into AI memory.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={AI_PLATFORM_ROUTES.knowledgeModule}
              className="rounded-md border px-3 py-2 text-sm hover:bg-muted/50"
            >
              Manage knowledge
            </a>
            {canManage ? (
              <button
                type="button"
                className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                disabled={isPending}
                onClick={handleSyncKnowledge}
              >
                Sync Now
              </button>
            ) : null}
          </div>
        </div>
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border p-3 text-sm">
            <p className="font-medium">Published documents</p>
            <p className="text-2xl font-semibold">{knowledge.publishedDocuments}</p>
            <p className="text-muted-foreground text-xs">of {knowledge.totalDocuments} total</p>
          </div>
          <div className="rounded-lg border p-3 text-sm sm:col-span-2">
            <p className="font-medium">Recent memory facts</p>
            {knowledge.memoryFactTitles.length === 0 ? (
              <p className="text-muted-foreground text-xs">No synced facts yet — run Sync Now.</p>
            ) : (
              <ul className="text-muted-foreground mt-1 list-inside list-disc text-xs">
                {knowledge.memoryFactTitles.slice(0, 6).map((title) => (
                  <li key={title}>{title}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Business Information",
            "Products & Menu",
            "Opening Hours",
            "Locations",
            "FAQs & Policies",
            "Uploaded Documents",
          ].map((source) => (
            <div key={source} className="rounded-lg border p-3 text-sm">
              <p className="font-medium">{source}</p>
              <p className="text-muted-foreground text-xs">
                {source.includes("Documents") || source.includes("FAQs")
                  ? "Via Knowledge module + sync"
                  : "Auto-synced"}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border p-6">
        <h2 className="mb-4 text-lg font-semibold">AI Capabilities</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ["enabled", "Customer AI enabled"],
              ["readMenu", "Read menu"],
              ["readHours", "Read hours"],
              ["readReservations", "Read reservations"],
              ["readOrders", "Read orders (verified customer)"],
              ["createReservation", "Create reservations"],
              ["createOrder", "Create orders (verified customer)"],
              ["requireConfirmation", "Require confirmation for actions"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
            >
              <span>{label}</span>
              <input
                type="checkbox"
                checked={capabilityForm[key]}
                disabled={!canManageSettings || isPending}
                onChange={(e) =>
                  setCapabilityForm((current) => ({ ...current, [key]: e.target.checked }))
                }
              />
            </label>
          ))}
        </div>
        {canManageSettings ? (
          <button
            type="button"
            className="bg-primary text-primary-foreground mt-4 rounded-md px-4 py-2 text-sm disabled:opacity-50"
            disabled={isPending}
            onClick={handleSaveCapabilities}
          >
            Save Capabilities
          </button>
        ) : null}
      </section>

      <AiOperationsSettingsSection
        capabilities={operationsCapabilities}
        canManageSettings={canManageSettings}
      />

      <section className="rounded-xl border p-6">
        <h2 className="mb-2 text-lg font-semibold">Website Chat Embed</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Generate an embed snippet for your website. Requires embed enabled in platform settings.
        </p>
        {canManage ? (
          <button
            type="button"
            className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
            disabled={isPending}
            onClick={handleGenerateEmbed}
          >
            Generate embed code
          </button>
        ) : null}
        {embedSnippet ? (
          <pre className="bg-muted mt-4 overflow-x-auto rounded-lg p-3 text-xs">{embedSnippet}</pre>
        ) : null}
        <p className="text-muted-foreground mt-2 text-xs">Business ID: {businessId}</p>
      </section>

      <section className="rounded-xl border p-6">
        <h2 className="mb-4 text-lg font-semibold">AI Analytics</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Conversations", analytics.totalConversations],
            ["Questions answered", analytics.questionsAnswered],
            ["Escalations", analytics.escalations],
            ["Reservations assisted", analytics.reservationsAssisted],
            ["Orders assisted", analytics.ordersAssisted],
            ["Unresolved", analytics.unresolvedQuestions],
            ["Tool executions", analytics.toolExecutions],
            ["Confirmations required", analytics.confirmationRequired],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-lg border p-4">
              <p className="text-muted-foreground text-xs">{label}</p>
              <p className="text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Customer Conversations</h2>
          <a href={CUSTOMER_AI_ROUTES.conversations} className="text-sm underline">
            View all
          </a>
        </div>
        {conversations.length === 0 ? (
          <p className="text-muted-foreground text-sm">No customer AI conversations yet.</p>
        ) : (
          <div className="space-y-2">
            {conversations.slice(0, 10).map((conv) => (
              <div key={conv.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <div>
                  <p className="font-medium">{conv.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {conv.customerName ?? "Guest"} · {conv.channel} · {conv.messageCount} messages
                    {conv.escalated ? " · Escalated" : ""}
                  </p>
                </div>
                <span className="text-muted-foreground text-xs">
                  {new Date(conv.lastMessageAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border p-6">
        <h2 className="mb-4 text-lg font-semibold">Messaging Channels</h2>
        <div className="space-y-2">
          {channels.map((channel) => (
            <div key={channel.channel} className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <div>
                <p className="font-medium">{channel.name}</p>
                <p className="text-muted-foreground text-xs">{channel.description}</p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs ${
                  channel.status === "implemented"
                    ? "bg-green-100 text-green-800"
                    : channel.status === "requires_credentials"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {channel.status === "implemented"
                  ? "Implemented"
                  : channel.status === "requires_credentials"
                    ? "Requires credentials"
                    : "Architecture only"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
