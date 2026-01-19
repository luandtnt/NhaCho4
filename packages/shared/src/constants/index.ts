export const USER_ROLES = {
  TENANT: 'Tenant',
  LANDLORD: 'Landlord',
  PROPERTY_MANAGER: 'PropertyManager',
  ORG_ADMIN: 'OrgAdmin',
  PLATFORM_ADMIN: 'PlatformAdmin',
} as const;

export const ENTITY_STATUS = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  ARCHIVED: 'ARCHIVED',
} as const;

export const AGREEMENT_STATES = {
  DRAFT: 'draft',
  REVIEW: 'review',
  SIGNED: 'signed',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  TERMINATED: 'terminated',
  EXPIRED: 'expired',
} as const;

export const ALLOCATION_TYPES = {
  EXCLUSIVE: 'exclusive',
  CAPACITY: 'capacity',
  SLOT: 'slot',
} as const;

export const LISTING_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;

export const INVOICE_STATUS = {
  ISSUED: 'ISSUED',
  PAID: 'PAID',
  VOID: 'VOID',
  OVERDUE: 'OVERDUE',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN_SCOPE: 'FORBIDDEN_SCOPE',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
