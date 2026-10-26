/**
 * Pure domain logic for vendor checklist management.
 * Zero external dependencies.
 */

import { ExpenseCategory, VendorItem, VendorStatus } from './types';
import { calculateDaysRemaining } from './timeline';

export interface VendorStatusMeta {
  label: string;
  tone: 'green' | 'amber' | 'neutral';
}

export function getVendorStatusMeta(
  status: VendorStatus,
  deadlineDate: string,
  currentDate = new Date()
): VendorStatusMeta {
  if (status === 'booked') {
    return { label: 'Booked', tone: 'green' };
  }

  const daysRemaining = calculateDaysRemaining(deadlineDate, currentDate);

  if (daysRemaining < 0) {
    return { label: `Overdue by ${Math.abs(daysRemaining)}d`, tone: 'amber' };
  }

  if (daysRemaining <= 7) {
    return { label: `Due in ${daysRemaining} days`, tone: 'amber' };
  }

  switch (status) {
    case 'tasting_set':
      return { label: 'Tasting set', tone: 'neutral' };
    case 'quote_received':
      return { label: 'Quote received', tone: 'amber' };
    case 'contacted':
      return { label: 'In discussions', tone: 'neutral' };
    case 'not_started':
    default:
      return { label: 'Not started', tone: 'neutral' };
  }
}

export function updateVendorStatus(
  vendors: VendorItem[],
  vendorId: string,
  newStatus: VendorStatus,
  vendorName?: string
): VendorItem[] {
  return vendors.map((v) => {
    if (v.id !== vendorId) return v;
    return {
      ...v,
      status: newStatus,
      name: vendorName !== undefined ? vendorName : v.name,
    };
  });
}

export function calculateVendorBudgetSummary(vendors: VendorItem[]): {
  totalAllocated: number;
  bookedCount: number;
  pendingCount: number;
  totalVendors: number;
} {
  let totalAllocated = 0;
  let bookedCount = 0;
  let pendingCount = 0;

  for (const v of vendors) {
    totalAllocated += Math.max(0, Math.round(v.allocatedBudget));
    if (v.status === 'booked') {
      bookedCount++;
    } else {
      pendingCount++;
    }
  }

  return {
    totalAllocated,
    bookedCount,
    pendingCount,
    totalVendors: vendors.length,
  };
}

export function filterVendorsByCategory(
  vendors: VendorItem[],
  category: ExpenseCategory | 'all'
): VendorItem[] {
  if (category === 'all') return [...vendors];
  return vendors.filter((v) => v.category === category);
}
