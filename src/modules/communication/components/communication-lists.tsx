interface CommunicationListsProps {
  conversations?: Array<{
    id: string;
    subject: string | null;
    status: string;
    priority: string;
    sourceChannel: string;
    inboxType: string;
    tags: string[];
    lastMessageAt: string;
  }>;
  timeline?: Array<{
    id: string;
    messageType: string;
    senderType: string;
    channel: string;
    body: string;
    deliveryStatus: string;
    isInternal: boolean;
    createdAt: string;
  }>;
  channels?: Array<{
    id: string;
    channel: string;
    name: string;
    isEnabled: boolean;
  }>;
  auditLogs?: Array<{
    id: string;
    eventType: string;
    createdAt: string;
  }>;
  activity?: Array<{
    id: string;
    eventType: string;
    description: string | null;
    createdAt: string;
  }>;
}

export function CommunicationLists({
  conversations = [],
  timeline = [],
  channels = [],
  auditLogs = [],
  activity = [],
}: CommunicationListsProps) {
  return (
    <div className="space-y-8">
      {conversations.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Conversations</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Subject</th>
                  <th className="px-4 py-2 text-left">Channel</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Priority</th>
                  <th className="px-4 py-2 text-left">Last Message</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((conversation) => (
                  <tr key={conversation.id} className="border-t">
                    <td className="px-4 py-2">{conversation.subject ?? "—"}</td>
                    <td className="px-4 py-2">{conversation.sourceChannel}</td>
                    <td className="px-4 py-2">{conversation.status}</td>
                    <td className="px-4 py-2">{conversation.priority}</td>
                    <td className="px-4 py-2">
                      {new Date(conversation.lastMessageAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {timeline.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Unified Timeline</h2>
          <div className="space-y-2">
            {timeline.map((message) => (
              <div
                key={message.id}
                className={`rounded-xl border p-4 text-sm ${message.isInternal ? "bg-muted/30" : "bg-card"}`}
              >
                <div className="text-muted-foreground mb-1 flex flex-wrap gap-2 text-xs">
                  <span>{message.channel}</span>
                  <span>{message.senderType}</span>
                  <span>{message.deliveryStatus}</span>
                  <span>{new Date(message.createdAt).toLocaleString()}</span>
                  {message.isInternal ? <span>Internal</span> : null}
                </div>
                <p>{message.body}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {channels.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Channel Connectors</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Channel</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Enabled</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((channel) => (
                  <tr key={channel.id} className="border-t">
                    <td className="px-4 py-2">{channel.channel}</td>
                    <td className="px-4 py-2">{channel.name}</td>
                    <td className="px-4 py-2">{channel.isEnabled ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activity.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Activity Log</h2>
          <div className="space-y-2">
            {activity.map((entry) => (
              <div key={entry.id} className="rounded-lg border p-3 text-sm">
                <p className="font-medium">{entry.eventType}</p>
                <p className="text-muted-foreground">{entry.description ?? "—"}</p>
                <p className="text-muted-foreground text-xs">
                  {new Date(entry.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {auditLogs.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Audit Log</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Event</th>
                  <th className="px-4 py-2 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="border-t">
                    <td className="px-4 py-2">{log.eventType}</td>
                    <td className="px-4 py-2">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
