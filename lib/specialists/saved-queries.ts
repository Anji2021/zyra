import type { SupabaseClient } from "@supabase/supabase-js";

export type SavedSpecialistRow = {
  id: string;
  user_id: string;
  name: string | null;
  address: string | null;
  place_id: string | null;
  /** PostgREST may return string for `numeric`. */
  rating: number | string | null;
  review_count: number | null;
  maps_url: string | null;
  phone: string | null;
  website: string | null;
  specialist_type: string | null;
  search_location: string | null;
  created_at: string;
};

/** Base table from migration 000006 — always safe to select. */
export const SAVED_SPECIALIST_SELECT_MINIMAL =
  "id,user_id,name,address,place_id,rating,created_at" as const;

/** After running 000012_saved_specialists_extended.sql (or equivalent SQL below). */
export const SAVED_SPECIALIST_SELECT_EXTENDED = `${SAVED_SPECIALIST_SELECT_MINIMAL},review_count,maps_url,phone,website,specialist_type,search_location` as const;

/** PostgREST / Postgres when a column is missing from the physical table. */
/** True when Postgres/PostgREST reports a missing column on this table (migrations not applied). */
export function isSavedSpecialistsSchemaMismatchError(message: string | undefined): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  if (!(m.includes("does not exist") || m.includes("could not find the"))) return false;
  return m.includes("saved_specialists") || m.includes("column");
}

function normalizeMinimalRow(row: Record<string, unknown>): SavedSpecialistRow {
  return {
    id: String(row.id ?? ""),
    user_id: String(row.user_id ?? ""),
    name: row.name != null ? String(row.name) : null,
    address: row.address != null ? String(row.address) : null,
    place_id: row.place_id != null ? String(row.place_id) : null,
    rating: row.rating as SavedSpecialistRow["rating"],
    review_count: null,
    maps_url: null,
    phone: null,
    website: null,
    specialist_type: null,
    search_location: null,
    created_at: String(row.created_at ?? ""),
  };
}

function mapExtendedRow(row: Record<string, unknown>): SavedSpecialistRow {
  const base = normalizeMinimalRow(row);
  let reviewCount: number | null = null;
  if (typeof row.review_count === "number" && Number.isFinite(row.review_count)) {
    reviewCount = Math.round(row.review_count);
  } else if (typeof row.review_count === "string" && row.review_count.trim() !== "") {
    const n = Number.parseInt(row.review_count, 10);
    if (!Number.isNaN(n)) reviewCount = n;
  }
  return {
    ...base,
    review_count: reviewCount,
    maps_url: row.maps_url != null && String(row.maps_url).trim() ? String(row.maps_url) : null,
    phone: row.phone != null && String(row.phone).trim() ? String(row.phone) : null,
    website: row.website != null && String(row.website).trim() ? String(row.website) : null,
    specialist_type:
      row.specialist_type != null && String(row.specialist_type).trim()
        ? String(row.specialist_type)
        : null,
    search_location:
      row.search_location != null && String(row.search_location).trim()
        ? String(row.search_location)
        : null,
  };
}

async function fetchSavedRowsSelect(
  supabase: SupabaseClient,
  userId: string,
  limit: number | undefined,
  selectClause: string,
): Promise<{ data: SavedSpecialistRow[]; errorMessage: string | null }> {
  let q = supabase.from("saved_specialists").select(selectClause).eq("user_id", userId).order("created_at", {
    ascending: false,
  });
  if (typeof limit === "number") {
    q = q.limit(limit);
  }
  const { data, error } = await q;
  if (error) {
    return { data: [], errorMessage: error.message };
  }
  const rows = Array.isArray(data) ? data : [];
  const asRow = (r: (typeof rows)[number]) => r as unknown as Record<string, unknown>;
  if (selectClause === SAVED_SPECIALIST_SELECT_MINIMAL) {
    return {
      data: rows.map((r) => normalizeMinimalRow(asRow(r))),
      errorMessage: null,
    };
  }
  return {
    data: rows.map((r) => mapExtendedRow(asRow(r))),
    errorMessage: null,
  };
}

export async function fetchSavedSpecialistsForUser(
  supabase: SupabaseClient,
  userId: string,
  limit?: number,
): Promise<SavedSpecialistRow[]> {
  const ext = await fetchSavedRowsSelect(supabase, userId, limit, SAVED_SPECIALIST_SELECT_EXTENDED);
  if (!ext.errorMessage) {
    return ext.data;
  }
  if (!isSavedSpecialistsSchemaMismatchError(ext.errorMessage)) {
    console.error("[saved_specialists] fetch", ext.errorMessage);
    return [];
  }
  console.warn("[saved_specialists] extended columns missing; using minimal select. Apply saved_specialists extension SQL.");
  const min = await fetchSavedRowsSelect(supabase, userId, limit, SAVED_SPECIALIST_SELECT_MINIMAL);
  if (min.errorMessage) {
    console.error("[saved_specialists] fetch minimal", min.errorMessage);
    return [];
  }
  return min.data;
}

export async function countSavedSpecialistsForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("saved_specialists")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.error("[saved_specialists] count", error.message);
    return 0;
  }

  return count ?? 0;
}

export async function fetchSavedPlaceIdsForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<Set<string>> {
  const rows = await fetchSavedSpecialistsForUser(supabase, userId);
  const set = new Set<string>();
  for (const r of rows) {
    if (r.place_id && r.place_id.trim()) set.add(r.place_id.trim());
  }
  return set;
}
