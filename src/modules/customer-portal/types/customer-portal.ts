import type {
  getCustomerDashboard,
  getCustomerInvoiceDetail,
  getCustomerLoyaltyDashboard,
  getCustomerOrderDetail,
  getCustomerPreferences,
  getCustomerReservationDetail,
  getCustomerWallet,
  listCustomerAddresses,
  listCustomerCoupons,
  listCustomerFavorites,
  listCustomerGiftCards,
  listCustomerInvoices,
  listCustomerMessages,
  listCustomerNotifications,
  listCustomerOrders,
  listCustomerPaymentMethods,
  listCustomerReceipts,
  listCustomerReservations,
  listCustomerRewards,
  listCustomerSupportTickets,
} from "@/services/customer-portal.service";
import type { CustomerPortalContextData } from "@/services/customer-portal.service";

export type CustomerPortalContext = CustomerPortalContextData;
export type CustomerDashboardData = Awaited<ReturnType<typeof getCustomerDashboard>>;
export type CustomerOrderList = Awaited<ReturnType<typeof listCustomerOrders>>;
export type CustomerOrderDetail = Awaited<ReturnType<typeof getCustomerOrderDetail>>;
export type CustomerReservationList = Awaited<ReturnType<typeof listCustomerReservations>>;
export type CustomerReservationDetail = Awaited<ReturnType<typeof getCustomerReservationDetail>>;
export type CustomerLoyaltyDashboard = Awaited<ReturnType<typeof getCustomerLoyaltyDashboard>>;
export type CustomerRewardList = Awaited<ReturnType<typeof listCustomerRewards>>;
export type CustomerWalletData = Awaited<ReturnType<typeof getCustomerWallet>>;
export type CustomerGiftCardList = Awaited<ReturnType<typeof listCustomerGiftCards>>;
export type CustomerCouponList = Awaited<ReturnType<typeof listCustomerCoupons>>;
export type CustomerAddressList = Awaited<ReturnType<typeof listCustomerAddresses>>;
export type CustomerPaymentMethodsData = Awaited<ReturnType<typeof listCustomerPaymentMethods>>;
export type CustomerNotificationList = Awaited<ReturnType<typeof listCustomerNotifications>>;
export type CustomerMessageList = Awaited<ReturnType<typeof listCustomerMessages>>;
export type CustomerSupportTicketList = Awaited<ReturnType<typeof listCustomerSupportTickets>>;
export type CustomerReceiptList = Awaited<ReturnType<typeof listCustomerReceipts>>;
export type CustomerInvoiceList = Awaited<ReturnType<typeof listCustomerInvoices>>;
export type CustomerInvoiceDetail = Awaited<ReturnType<typeof getCustomerInvoiceDetail>>;
export type CustomerFavoriteList = Awaited<ReturnType<typeof listCustomerFavorites>>;
export type CustomerPreferencesData = Awaited<ReturnType<typeof getCustomerPreferences>>;
