/**
 * Deterministic built-in AI fallback engine.
 * Ensures all planner capabilities work offline and without an API key.
 * Strictly relies on domain math functions for any budget calculations.
 */

import { CelebrationPlan, ExpenseCategory } from '@/domain/types';
import { simulateBudgetCut } from '@/domain/scenarios';
import { formatINR } from '@/domain/format';
import { AssistantResponse } from './schemas';

export function runDeterministicFallback(
  query: string,
  plan: CelebrationPlan,
  explicitLockedCategories: ExpenseCategory[] = []
): AssistantResponse {
  const lower = query.toLowerCase();
  const timestamp = new Date().toISOString();

  // Pattern 1: Budget cut (e.g. "cut 10%", "reduce 15%", "save 10% but keep photographer")
  const cutMatch = lower.match(/(?:cut|reduce|trim|save)\s+(\d+)%/);
  if (cutMatch || lower.includes('cut') || lower.includes('reduce')) {
    const cutPercent = cutMatch ? parseInt(cutMatch[1], 10) : 10;

    // Detect mentioned locked categories from text
    const detectedLocked: ExpenseCategory[] = [...explicitLockedCategories];
    if (lower.includes('photograph') && !detectedLocked.includes('photography')) {
      detectedLocked.push('photography');
    }
    if (lower.includes('venue') && !detectedLocked.includes('venue')) {
      detectedLocked.push('venue');
    }
    if (lower.includes('cater') && !detectedLocked.includes('catering')) {
      detectedLocked.push('catering');
    }

    const simulation = simulateBudgetCut(plan.items, cutPercent, detectedLocked);
    const oldFmt = formatINR(simulation.oldTotalBudget);
    const newFmt = formatINR(simulation.newTotalBudget);

    const changedLines = simulation.adjustments
      .filter((a) => a.difference !== 0)
      .map(
        (a) =>
          `• **${a.categoryId.charAt(0).toUpperCase() + a.categoryId.slice(1)}**: ${formatINR(
            a.oldAmount
          )} → ${formatINR(a.newAmount)} (${formatINR(a.difference)})`
      )
      .join('\n');

    const lockedNames =
      detectedLocked.length > 0
        ? detectedLocked.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')
        : 'None';

    const reply = `Here is the proposed change. Totals were recalculated by the planner domain engine, not estimated.\n\n` +
      `**Total Budget:** ${oldFmt} → **${newFmt}** (−${cutPercent}%)\n` +
      `**Locked (Unchanged):** ${lockedNames}\n\n` +
      `**Category Breakdown Adjustments:**\n${changedLines}\n\n` +
      `Click **Apply changes** below to update your event plan.`;

    return {
      reply,
      intent: 'budget_cut',
      proposedBudgetChange: {
        type: 'cut_percentage',
        cutPercentage: cutPercent,
        targetBudget: simulation.newTotalBudget,
        lockedCategories: detectedLocked,
      },
      source: 'built-in',
      modelUsed: 'deterministic-rule-engine-v1',
      timestamp,
    };
  }

  // Pattern 2: Photographer or Vendor inquiry
  if (lower.includes('photo') || lower.includes('vendor') || lower.includes('book')) {
    const photogVendor = plan.vendors.find((v) => v.category === 'photography');
    const budgetFmt = photogVendor ? formatINR(photogVendor.allocatedBudget) : 'allocated amount';
    const deadline = photogVendor ? photogVendor.deadlineDate : '4 months before event';

    return {
      reply: `For wedding and celebration photography, experienced candids fill up rapidly.\n\n` +
        `• **Current Allocation:** ${budgetFmt}\n` +
        `• **Recommended Booking Deadline:** ${deadline}\n` +
        `• **Recommendation:** Book a team that covers both traditional family portraits and candid documentary moments. Schedule a pre-wedding consultation to align on key rituals.`,
      intent: 'vendor_advice',
      source: 'built-in',
      modelUsed: 'deterministic-rule-engine-v1',
      timestamp,
    };
  }

  // Pattern 3: Catering / Menu inquiry
  if (lower.includes('cater') || lower.includes('food') || lower.includes('menu')) {
    const cateringItem = plan.items.find((i) => i.category === 'catering');
    const costFmt = cateringItem ? formatINR(cateringItem.allocatedAmount) : 'allocated amount';

    return {
      reply: `Catering is typically 25%–35% of a celebration budget (currently ${costFmt} in your plan).\n\n` +
        `• **Tasting Check:** Schedule tasting 2–3 months in advance to test live counters and regional specialties.\n` +
        `• **Dietary Provisions:** Ensure separate counters for strict Jain, vegetarian, and dietary-restricted guests.\n` +
        `• **Cost Optimization:** Replace static courses with dynamic live stations (chaat, dosas, pasta) to reduce food waste.`,
      intent: 'vendor_advice',
      source: 'built-in',
      modelUsed: 'deterministic-rule-engine-v1',
      timestamp,
    };
  }

  // Default: Celebration Planner advice
  const totalFmt = formatINR(plan.totalBudget);
  return {
    reply: `Your celebration "${plan.title}" is currently planned for **${totalFmt}** with ${plan.guests.length} guests.\n\n` +
      `You can ask me to:\n` +
      `1. *"Cut 10% from the total but keep the photographer"*\n` +
      `2. *"Suggest menu options for 200 guests"*\n` +
      `3. *"What vendors should I book first?"*\n` +
      `4. *"Check reserve protection and contingency buffer"*`,
    intent: 'general_advice',
    source: 'built-in',
    modelUsed: 'deterministic-rule-engine-v1',
    timestamp,
  };
}
