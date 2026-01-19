// User roles
export type UserRole = 'Tenant' | 'Landlord' | 'PropertyManager' | 'OrgAdmin' | 'PlatformAdmin';

// Entity statuses
export type EntityStatus = 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';

// Agreement states
export type AgreementState = 'draft' | 'review' | 'signed' | 'active' | 'suspended' | 'terminated' | 'expired';

// Allocation types
export type AllocationType = 'exclusive' | 'capacity' | 'slot';

// Listing status
export type ListingStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

// Invoice status
export type InvoiceStatus = 'ISSUED' | 'PAID' | 'VOID' | 'OVERDUE';

// Payment status
export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';

// Ledger direction
export type LedgerDirection = 'debit' | 'credit';

// Error codes
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN_SCOPE'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'PROVIDER_ERROR'
  | 'INTERNAL_ERROR';

// API Error Response
export interface ErrorResponse {
  error_code: ErrorCode;
  message: string;
  details?: Array<{
    path: string;
    reason: string;
  }>;
  request_id: string;
}

// JWT Payload
export interface JWTPayload {
  sub: string;
  email: string;
  org_id: string;
  role: UserRole;
  scopes: string[];
  assigned_asset_ids: string[];
  iat: number;
  exp: number;
}
