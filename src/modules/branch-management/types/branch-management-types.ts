import type { BranchStatus, BranchType } from "@prisma/client";

export interface BranchOpeningHoursDay {
  dayOfWeek: number;
  openTime?: string | null;
  closeTime?: string | null;
  isClosed: boolean;
}

export interface BranchManagementInput {
  name: string;
  code: string;
  type: BranchType;
  phone?: string;
  email?: string;
  website?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  county?: string;
  postcode?: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  timezone: string;
  currency?: string;
  taxNumber?: string;
  openingHours?: BranchOpeningHoursDay[];
  isPrimary?: boolean;
  logo?: string;
  coverImage?: string;
}

export interface BranchSettingsInput {
  settings: Record<string, unknown>;
}

export interface BranchListQuery {
  search?: string;
  status?: BranchStatus | "ALL";
  type?: BranchType | "ALL";
  page?: number;
  pageSize?: number;
}

export interface BranchManagementRecord {
  id: string;
  businessId: string;
  name: string;
  code: string;
  type: BranchType;
  status: BranchStatus;
  phone: string | null;
  email: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  county: string | null;
  postcode: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  currency: string | null;
  taxNumber: string | null;
  openingHours: BranchOpeningHoursDay[];
  isPrimary: boolean;
  isActive: boolean;
  logo: string | null;
  coverImage: string | null;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface BranchListResult {
  items: BranchManagementRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const BRANCH_TYPE_OPTIONS: Array<{ value: BranchType; label: string }> = [
  { value: "RESTAURANT", label: "Restaurant" },
  { value: "SALON", label: "Salon" },
  { value: "CLINIC", label: "Clinic" },
  { value: "RETAIL", label: "Retail Store" },
  { value: "WAREHOUSE", label: "Warehouse" },
  { value: "OFFICE", label: "Office" },
  { value: "HOTEL", label: "Hotel Property" },
  { value: "GYM", label: "Gym Location" },
  { value: "PHARMACY", label: "Pharmacy Branch" },
  { value: "SERVICE_AREA", label: "Service Area" },
  { value: "OTHER", label: "Other" },
];

export const DEFAULT_BRANCH_OPENING_HOURS: BranchOpeningHoursDay[] = [
  { dayOfWeek: 0, isClosed: true, openTime: null, closeTime: null },
  { dayOfWeek: 1, isClosed: false, openTime: "09:00", closeTime: "17:00" },
  { dayOfWeek: 2, isClosed: false, openTime: "09:00", closeTime: "17:00" },
  { dayOfWeek: 3, isClosed: false, openTime: "09:00", closeTime: "17:00" },
  { dayOfWeek: 4, isClosed: false, openTime: "09:00", closeTime: "17:00" },
  { dayOfWeek: 5, isClosed: false, openTime: "09:00", closeTime: "17:00" },
  { dayOfWeek: 6, isClosed: true, openTime: null, closeTime: null },
];
