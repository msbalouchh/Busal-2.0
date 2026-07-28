import type {
  ImportExportAuditEventType,
  ImportExportFormat,
  ImportExportJobStatus,
  ImportExportJobType,
  ImportExportScheduleFrequency,
} from "@prisma/client";

export interface SchemaFieldDefinition {
  key: string;
  label: string;
  type: "string" | "number" | "boolean" | "date" | "email";
  required?: boolean;
  uniqueKey?: boolean;
}

export interface RegisteredImportExportSchemaDefinition {
  schemaKey: string;
  module: string;
  name: string;
  fields: SchemaFieldDefinition[];
  importFormats: ImportExportFormat[];
  exportFormats: ImportExportFormat[];
  isActive: boolean;
}

export interface FieldMappingDefinition {
  sourceField: string;
  targetField: string;
}

export interface ImportJobInput {
  schemaKey: string;
  format: ImportExportFormat;
  fileName?: string;
  content: string;
  fieldMappings?: FieldMappingDefinition[];
  source?: string;
}

export interface ExportJobInput {
  schemaKey: string;
  format: ImportExportFormat;
  fileName?: string;
  fieldMappings?: FieldMappingDefinition[];
  records?: Array<Record<string, unknown>>;
  source?: string;
}

export interface TemplateInput {
  schemaKey: string;
  name: string;
  format: ImportExportFormat;
  fieldMappings: FieldMappingDefinition[];
  isDefault?: boolean;
}

export interface ScheduleInput {
  schemaKey: string;
  name: string;
  jobType: ImportExportJobType;
  format: ImportExportFormat;
  frequency: ImportExportScheduleFrequency;
  fieldMappings?: FieldMappingDefinition[];
}

export interface ValidationResult {
  valid: boolean;
  errors: Array<{ rowIndex: number; field: string; message: string }>;
}

export interface DuplicateDetectionResult {
  duplicates: number;
  uniqueRecords: Array<Record<string, unknown>>;
}

export interface BatchProcessResult {
  processed: number;
  successCount: number;
  failureCount: number;
  duplicateCount: number;
  progressPct: number;
}

export interface ImportExportPlatformDashboardMetrics {
  totalSchemas: number;
  registeredSchemas: number;
  totalTemplates: number;
  totalImportJobs: number;
  totalExportJobs: number;
  completedJobs: number;
  failedJobs: number;
  activeSchedules: number;
  totalRecordsProcessed: number;
}

export interface SchemaView {
  id: string;
  schemaKey: string;
  module: string;
  name: string;
  fieldCount: number;
  isActive: boolean;
}

export interface TemplateView {
  id: string;
  name: string;
  schemaKey: string;
  format: ImportExportFormat;
  isDefault: boolean;
}

export interface JobView {
  id: string;
  jobType: ImportExportJobType;
  format: ImportExportFormat;
  status: ImportExportJobStatus;
  module: string;
  fileName: string | null;
  source: string;
  progressPct: number;
  totalRecords: number;
  successCount: number;
  failureCount: number;
  duplicateCount: number;
  createdAt: string;
  completedAt: string | null;
}

export interface ScheduleView {
  id: string;
  name: string;
  jobType: ImportExportJobType;
  format: ImportExportFormat;
  module: string;
  frequency: ImportExportScheduleFrequency;
  isActive: boolean;
  nextRunAt: string | null;
}

export interface JobRecordView {
  id: string;
  rowIndex: number;
  status: string;
  isDuplicate: boolean;
  errorMessage: string | null;
}

export interface ImportExportAuditLogView {
  id: string;
  eventType: ImportExportAuditEventType;
  createdAt: string;
}

export interface ImportPreviewResult {
  jobId: string;
  previewRows: Array<Record<string, unknown>>;
  totalRecords: number;
  validationErrors: ValidationResult["errors"];
}

export interface ExportPayloadResult {
  jobId: string;
  content: string;
  mimeType: string;
  fileName: string;
}
