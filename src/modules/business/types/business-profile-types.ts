import type { BusinessContactType, BusinessType } from "@prisma/client";

import type {
  BranchData,
  BusinessContactData,
  BusinessHoursData,
} from "@/services/business-management.service";
import type { BusinessProfileData } from "@/types/business-profile";

export interface BusinessAddress {
  country: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  mapsLocation: string | null;
}

export interface BusinessSocialLinks {
  facebook: string;
  instagram: string;
  twitter: string;
  linkedin: string;
  tiktok: string;
  youtube: string;
}

export interface BusinessBrandingAssets {
  logoFileId: string | null;
  logoUrl: string | null;
  coverFileId: string | null;
  coverUrl: string | null;
  faviconFileId: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
}

export interface BusinessRegionalSettings {
  timezone: string;
  currency: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
  weekStart: string;
}

export interface BusinessOperationalSettings {
  businessStatus: string;
  autoConfirmOrders: boolean;
  allowOnlineOrdering: boolean;
  requireStaffPin: boolean;
}

export interface SerializedBusinessProfile {
  id: string;
  businessName: string;
  legalName: string;
  businessType: BusinessType | null;
  industry: string;
  description: string;
  ownerName: string | null;
  branding: BusinessBrandingAssets;
  regional: BusinessRegionalSettings;
  operational: BusinessOperationalSettings;
  address: BusinessAddress;
  supportEmail: string;
  socialLinks: BusinessSocialLinks;
  contacts: BusinessContactData[];
  branches: BranchData[];
  hours: BusinessHoursData[];
  canEdit: boolean;
  canManageBranding: boolean;
  canManageSettings: boolean;
  canManageBranches: boolean;
}

export interface BusinessProfileUpdateInput {
  businessName: string;
  legalName: string;
  businessType: BusinessType;
  industry: string;
  description: string;
  ownerName: string;
  timezone: string;
  currency: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
}

export type BusinessAddressUpdateInput = BusinessAddress;

export interface BusinessContactUpdateInput {
  email: string;
  phone: string;
  website: string;
  supportEmail: string;
  socialLinks: BusinessSocialLinks;
  contacts: Array<{
    id?: string;
    type: BusinessContactType;
    label?: string;
    value: string;
    isPrimary?: boolean;
  }>;
}

export interface BusinessBrandingUpdateInput {
  primaryColor: string;
  secondaryColor: string;
}

export interface BusinessSettingsUpdateInput {
  weekStart: string;
  businessStatus: string;
  autoConfirmOrders: boolean;
  allowOnlineOrdering: boolean;
  requireStaffPin: boolean;
}

export interface BusinessAssetUploadInput {
  assetType: "logo" | "cover" | "favicon";
  originalName: string;
  mimeType: string;
  contentBase64: string;
}

export type BusinessProfileBundle = {
  business: BusinessProfileData;
  profile: SerializedBusinessProfile;
};
