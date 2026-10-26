/**
 * Pure domain logic for celebration what-if scenario simulations.
 * Zero external dependencies.
 */

import { BudgetItem, CelebrationPlan, ExpenseCategory, ScenarioAdjustment, ScenarioSimulation } from './types';
import { rebalanceBudget, roundCurrency } from './budget';

export function createScenarioSimulation(
  id: string,
  name: string,
  description: string,
  currentItems: BudgetItem[],
  newTotalBudget: number,
  lockedCategories: ExpenseCategory[] = []
): ScenarioSimulation {
  const currentTotal = currentItems.reduce(
    (sum, item) => sum + roundCurrency(item.allocatedAmount),
    0
  );
  const rebalancedItems = rebalanceBudget(currentItems, newTotalBudget, lockedCategories);

  const adjustments: ScenarioAdjustment[] = currentItems.map((oldItem, idx) => {
    const newItem = rebalancedItems[idx];
    const oldAmount = roundCurrency(oldItem.allocatedAmount);
    const newAmount = newItem ? roundCurrency(newItem.allocatedAmount) : 0;
    return {
      categoryId: oldItem.category,
      oldAmount,
      newAmount,
      difference: newAmount - oldAmount,
    };
  });

  return {
    id,
    name,
    description,
    oldTotalBudget: currentTotal,
    newTotalBudget,
    totalDifference: newTotalBudget - currentTotal,
    adjustments,
    lockedCategories,
  };
}

export function simulateBudgetCut(
  currentItems: BudgetItem[],
  cutPercent: number, // e.g. 10 for 10% cut
  lockedCategories: ExpenseCategory[] = []
): ScenarioSimulation {
  const currentTotal = currentItems.reduce(
    (sum, item) => sum + roundCurrency(item.allocatedAmount),
    0
  );
  const safePercent = Math.max(0, Math.min(90, cutPercent));
  const cutAmount = roundCurrency(currentTotal * (safePercent / 100));
  const newTarget = Math.max(0, currentTotal - cutAmount);

  return createScenarioSimulation(
    `scenario-cut-${safePercent}`,
    `Cut ${safePercent}% from Total`,
    `Reduce total budget by ${safePercent}% while keeping locked categories preserved.`,
    currentItems,
    newTarget,
    lockedCategories
  );
}

export function simulateGuestCountChange(
  currentItems: BudgetItem[],
  currentGuestCount: number,
  newGuestCount: number,
  lockedCategories: ExpenseCategory[] = []
): ScenarioSimulation {
  const currentTotal = currentItems.reduce(
    (sum, item) => sum + roundCurrency(item.allocatedAmount),
    0
  );
  const safeOldCount = Math.max(1, currentGuestCount);
  const safeNewCount = Math.max(1, newGuestCount);
  const ratio = safeNewCount / safeOldCount;

  // Scale per-head variable categories (catering, gifts, invitations)
  const variableCategories = new Set<ExpenseCategory>(['catering', 'gifts', 'invitations']);
  const lockedSet = new Set(lockedCategories);

  let newTarget = 0;
  for (const item of currentItems) {
    const amt = roundCurrency(item.allocatedAmount);
    if (variableCategories.has(item.category) && !lockedSet.has(item.category)) {
      newTarget += roundCurrency(amt * ratio);
    } else {
      newTarget += amt;
    }
  }

  return createScenarioSimulation(
    `scenario-guests-${newGuestCount}`,
    `Adjust Headcount to ${newGuestCount} Guests`,
    `Scale catering, gifts, and invitations proportionally for ${newGuestCount} guests.`,
    currentItems,
    newTarget,
    lockedCategories
  );
}

export function applyScenarioToPlan(
  plan: CelebrationPlan,
  scenario: ScenarioSimulation
): CelebrationPlan {
  const updatedItems = rebalanceBudget(
    plan.items,
    scenario.newTotalBudget,
    scenario.lockedCategories
  );

  return {
    ...plan,
    totalBudget: scenario.newTotalBudget,
    items: updatedItems,
  };
}
