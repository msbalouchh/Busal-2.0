export interface RestaurantSettingsRecord {
  id: string;
  businessId: string;
  defaultBranchId: string | null;
  businessRegistrationNumber: string | null;
  foodLicenseNumber: string | null;
  vatNumber: string | null;
  defaultCurrency: string | null;
  defaultTaxRate: number | null;
  serviceChargeEnabled: boolean;
  serviceChargePercentage: number | null;
  allowTakeaway: boolean;
  allowDelivery: boolean;
  allowDineIn: boolean;
  allowReservations: boolean;
  reservationIntervalMinutes: number;
  reservationBufferMinutes: number;
  kitchenDisplayEnabled: boolean;
  qrOrderingEnabled: boolean;
  posEnabled: boolean;
  loyaltyEnabled: boolean;
  onlineOrderingEnabled: boolean;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantBrandingRecord {
  id: string;
  businessId: string;
  logo: string | null;
  coverImage: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  receiptFooter: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantFoundationBundle {
  settings: RestaurantSettingsRecord;
  branding: RestaurantBrandingRecord;
  moduleEnabled: boolean;
  moduleInstalled: boolean;
}

export interface RestaurantSettingsInput {
  defaultBranchId?: string | null;
  businessRegistrationNumber?: string;
  foodLicenseNumber?: string;
  vatNumber?: string;
  defaultCurrency?: string;
  defaultTaxRate?: number | null;
  serviceChargeEnabled?: boolean;
  serviceChargePercentage?: number | null;
  allowTakeaway?: boolean;
  allowDelivery?: boolean;
  allowDineIn?: boolean;
  allowReservations?: boolean;
  reservationIntervalMinutes?: number;
  reservationBufferMinutes?: number;
  kitchenDisplayEnabled?: boolean;
  qrOrderingEnabled?: boolean;
  posEnabled?: boolean;
  loyaltyEnabled?: boolean;
  onlineOrderingEnabled?: boolean;
  settings?: Record<string, unknown>;
}

export interface RestaurantBrandingInput {
  logo?: string;
  coverImage?: string;
  primaryColor?: string;
  secondaryColor?: string;
  receiptFooter?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
}

export interface RestaurantFeatureToggleInput {
  kitchenDisplayEnabled?: boolean;
  qrOrderingEnabled?: boolean;
  posEnabled?: boolean;
  loyaltyEnabled?: boolean;
  onlineOrderingEnabled?: boolean;
}

export interface RestaurantPreferencesInput {
  allowTakeaway?: boolean;
  allowDelivery?: boolean;
  allowDineIn?: boolean;
  allowReservations?: boolean;
  reservationIntervalMinutes?: number;
  reservationBufferMinutes?: number;
  serviceChargeEnabled?: boolean;
  serviceChargePercentage?: number | null;
}
