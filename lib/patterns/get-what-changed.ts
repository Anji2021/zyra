import { fetchCyclesForUser } from "@/lib/cycles/queries";
import { fetchMedicinesForUser } from "@/lib/medicines/queries";
import { fetchSymptomsForUser } from "@/lib/symptoms/queries";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildWhatChangedInsightSet, type WhatChangedInsightSet } from "@zyra/shared";

/**
 * Server-side snapshot for “What changed?” — uses the same tables as timeline/insights.
 */
export async function getWhatChangedForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<WhatChangedInsightSet> {
  try {
    const [cycles, symptoms, medicines] = await Promise.all([
      fetchCyclesForUser(supabase, userId, 24),
      fetchSymptomsForUser(supabase, userId, 250),
      fetchMedicinesForUser(supabase, userId, 100),
    ]);

    return buildWhatChangedInsightSet({
      cycles,
      symptoms,
      medicines,
      nowInput: new Date(),
    });
  } catch (e) {
    console.error("[getWhatChangedForUser]", e);
    return {
      subtitle: "Compare your recent logs with previous patterns.",
      defaultComparisonKey: "last_7_days",
      options: [
        { key: "last_7_days", label: "Last 7 days vs previous 7 days", available: true },
        { key: "last_30_days", label: "Last 30 days vs previous 30 days", available: true },
        { key: "cycle_vs_previous_cycle", label: "Current cycle vs previous cycle", available: false },
      ],
      results: {
        last_7_days: {
          comparisonKey: "last_7_days",
          comparisonLabel: "Last 7 days vs previous 7 days",
          cards: [],
          emptyReason: "insufficient_data",
        },
        last_30_days: {
          comparisonKey: "last_30_days",
          comparisonLabel: "Last 30 days vs previous 30 days",
          cards: [],
          emptyReason: "insufficient_data",
        },
        cycle_vs_previous_cycle: {
          comparisonKey: "cycle_vs_previous_cycle",
          comparisonLabel: "Current cycle vs previous cycle",
          cards: [],
          emptyReason: "insufficient_data",
        },
      },
      fetchError: "We couldn’t load this comparison right now. Try refreshing in a moment.",
    };
  }
}
