import type {
  CommunicationAiActionType,
  CommunicationAttachmentType,
  CommunicationChannel,
  CommunicationConversationStatus,
  CommunicationDeliveryStatus,
  CommunicationInboxType,
  CommunicationMessageType,
  CommunicationPriority,
  CommunicationSenderType,
} from "@prisma/client";

export interface ChannelConnectorDefinition {
  channel: CommunicationChannel;
  name: string;
  description: string;
  isIntegrated: boolean;
}

export interface PlatformFileReference {
  fileName: string;
  mimeType: string;
  storageKey: string;
  fileSizeBytes?: number;
}

export interface CreateConversationInput {
  branchId?: string | null;
  customerId?: string | null;
  contactId?: string | null;
  contact?: {
    name: string;
    email?: string | null;
    phone?: string | null;
    customerId?: string | null;
  };
  sourceChannel: CommunicationChannel;
  subject?: string | null;
  priority?: CommunicationPriority;
  tags?: string[];
  inboxType?: CommunicationInboxType;
  department?: string | null;
  teamSlug?: string | null;
  initialMessage?: {
    body: string;
    channel: CommunicationChannel;
    senderType: CommunicationSenderType;
    senderCustomerId?: string | null;
    senderContactId?: string | null;
  };
}

export interface SendMessageInput {
  conversationId: string;
  body: string;
  channel: CommunicationChannel;
  messageType?: CommunicationMessageType;
  subject?: string | null;
  mentions?: string[];
  attachments?: Array<PlatformFileReference & { attachmentType: CommunicationAttachmentType }>;
  autoSend?: boolean;
}

export interface AddInternalNoteInput {
  conversationId: string;
  body: string;
  mentions?: string[];
  attachments?: Array<PlatformFileReference & { attachmentType: CommunicationAttachmentType }>;
}

export interface AssignConversationInput {
  conversationId: string;
  assignedStaffId?: string | null;
  assignedAiAgentId?: string | null;
  department?: string | null;
  teamSlug?: string | null;
  inboxType?: CommunicationInboxType;
}

export interface InboxFilterInput {
  inboxType?: CommunicationInboxType;
  filter?: "unread" | "assigned" | "waiting_customer" | "waiting_staff" | "ai_handled" | "closed";
  assignedStaffId?: string;
  department?: string;
  teamSlug?: string;
}

export interface SearchConversationsInput {
  query?: string;
  customerId?: string;
  phone?: string;
  email?: string;
  channel?: CommunicationChannel;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

export interface CommunicationDashboardMetrics {
  totalConversations: number;
  openConversations: number;
  waitingStaff: number;
  aiHandled: number;
  unreadMessages: number;
  channelsConfigured: number;
}

export interface AiInsightRequest {
  conversationId: string;
  actionType: CommunicationAiActionType;
  aiAgentId?: string | null;
}

export interface TimelineMessage {
  id: string;
  messageType: CommunicationMessageType;
  senderType: CommunicationSenderType;
  channel: CommunicationChannel;
  body: string;
  deliveryStatus: CommunicationDeliveryStatus;
  isInternal: boolean;
  createdAt: Date;
  attachments: Array<{
    id: string;
    fileName: string;
    mimeType: string;
    storageKey: string;
    attachmentType: CommunicationAttachmentType;
  }>;
}

export interface ConversationWithTimeline {
  id: string;
  status: CommunicationConversationStatus;
  priority: CommunicationPriority;
  sourceChannel: CommunicationChannel;
  tags: string[];
  subject: string | null;
  timeline: TimelineMessage[];
}
