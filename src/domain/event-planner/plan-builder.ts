import {
  GeneratedEventPlan,
  PlanRequestRaw,
  ValidatedPlanInput,
  ValidationError,
} from './types';
import { getEventDefinition } from './registry';
import { validatePlanRequest } from './validation';
import { calculateBudgetSplit } from './budget-math';
import { computeTimelinePlan } from './timeline-math';
import { computeVendorPlan } from './vendors-math';
import { rankAndFilterIdeas } from './ideas-math';
import { computeReadinessScore } from './readiness';

export function buildPlan(input: ValidatedPlanInput, todayUtcStr: string): GeneratedEventPlan {
  const def = getEventDefinition(input.eventType);
  if (!def) {
    throw new Error(`Cannot build plan: unregistered event type "${input.eventType}"`);
  }

  // 1. Pure deterministic math calculations
  const budget = calculateBudgetSplit(
    input.totalBudget,
    def,
    input.budgetTier,
    input.priorities,
    input.venueType
  );

  const timeline = computeTimelinePlan(input.eventDate, todayUtcStr, def, input.venueType);

  const vendors = computeVendorPlan(
    input.eventDate,
    todayUtcStr,
    def,
    budget,
    input.priorities,
    input.venueType
  );

  const ideas = rankAndFilterIdeas(
    def,
    input.guestCount,
    input.budgetTier,
    input.venueType,
    input.theme,
    input.interests
  );

  const readiness = computeReadinessScore(timeline, vendors, budget);

  const planId = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return {
    id: planId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    input,
    budget,
    timeline,
    vendors,
    ideas,
    readiness,
  };
}

export function planFromRequest(
  raw: Partial<PlanRequestRaw>,
  serverTodayUtcStr: string
): { success: true; plan: GeneratedEventPlan } | { success: false; errors: ValidationError[] } {
  const validation = validatePlanRequest(raw, serverTodayUtcStr);
  if (!validation.isValid || !validation.sanitizedInput) {
    return { success: false, errors: validation.errors };
  }

  const todayDateStr = typeof raw.todayDate === 'string' ? raw.todayDate : serverTodayUtcStr;
  const plan = buildPlan(validation.sanitizedInput, todayDateStr);
  return { success: true, plan };
}
