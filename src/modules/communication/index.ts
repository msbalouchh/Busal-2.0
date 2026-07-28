export {
  COMMUNICATION_ROUTES,
  COMMUNICATION_NAV_ITEMS,
} from "@/modules/communication/constants/routes";
export { CommunicationNav } from "@/modules/communication/components/communication-nav";
export { CommunicationDashboard } from "@/modules/communication/components/communication-dashboard";
export { CommunicationLists } from "@/modules/communication/components/communication-lists";
export { listCommunicationChannels } from "@/modules/communication/registry/communication-registry";
export { mergeTimelineMessages } from "@/modules/communication/engine/conversation-engine";
export { generateAiInsight } from "@/modules/communication/engine/ai-engine";
