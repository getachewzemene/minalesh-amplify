export type InventoryFilterStatus = 'all' | 'active' | 'inactive' | 'low_stock' | 'out_of_stock';

// Common pattern for boolean filters represented as strings in query params
export type BooleanStringFilter = '' | 'true' | 'false';

// Category filter often nullable/empty for "All"
export type CategoryFilter = string | '';

// Analytics time ranges
export type TimeRange = '7d' | '30d' | '90d' | '1y';

// Admin dashboard period
export type Period = 'weekly' | 'monthly' | 'yearly';
