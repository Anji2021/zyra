"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { buildGoogleMapsUrl } from "@/lib/specialists/maps-url";
import type { SavedSpecialistRow } from "@/lib/specialists/saved-queries";
import { getSpecialistLabel, isValidSpecialistType } from "@/lib/specialists/search-query";

type SavedSpecialistsListProps = {
  initial: SavedSpecialistRow[];
};

function specialistTypeLabel(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  const t = raw.trim();
  return isValidSpecialistType(t) ? getSpecialistLabel(t) : t;
}

function safeRating(row: SavedSpecialistRow): string | null {
  if (row.rating == null) return null;
  const n = Number(row.rating);
  if (Number.isNaN(n)) return null;
  return n.toFixed(1);
}

function websiteHref(raw: string): string {
  const t = raw.trim();
  if (!t) return "#";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

export function SavedSpecialistsList({ initial }: SavedSpecialistsListProps) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRows(initial);
  }, [initial]);

  async function removeRow(row: SavedSpecialistRow) {
    const pid = row.place_id?.trim();
    if (!pid) return;
    setError(null);
    setBusyId(row.id);
    try {
      const res = await fetch("/api/specialists/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ place_id: pid }),
      });
      const data = (await res.json()) as { saved?: boolean; error?: string };
      if (!res.ok) {
        if (data.error) console.error("[SavedSpecialistsList] remove error:", data.error);
        setError("Something went wrong. Please try again.");
        return;
      }
      if (data.saved === false) {
        setRows((prev) => prev.filter((x) => x.id !== row.id));
        router.refresh();
      }
    } catch (err) {
      console.error("[SavedSpecialistsList] remove exception:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-background/65 px-4 py-8 text-center sm:rounded-3xl sm:px-5 sm:py-12">
        <p className="font-serif text-base font-medium text-foreground sm:text-lg">
          You haven&apos;t saved any specialists yet
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Save specialists from search to build a private shortlist here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {error ? (
        <p
          className="rounded-2xl border border-red-200/80 bg-red-50 px-4 py-3 text-center text-sm text-red-950"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <ul className="space-y-3 sm:space-y-4">
        {rows.map((row) => {
          const name = row.name?.trim() || "Unknown practice";
          const address = row.address?.trim() ?? "";
          const pid = row.place_id?.trim() ?? "";
          const mapsUrl = (row.maps_url?.trim() || buildGoogleMapsUrl(pid, name, address)).trim();
          const ratingStr = safeRating(row);
          const typeLbl = specialistTypeLabel(row.specialist_type);

          return (
            <li
              key={row.id}
              className="rounded-xl border border-border/70 bg-background/90 p-4 shadow-sm sm:rounded-2xl sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="font-serif text-base font-semibold tracking-tight text-foreground sm:text-lg">{name}</h2>
              </div>
              {typeLbl ? (
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-accent">{typeLbl}</p>
              ) : null}
              {ratingStr ? (
                <p className="mt-2 text-xs text-muted sm:text-sm">
                  <span className="font-semibold text-foreground">Rating:</span> {ratingStr}
                  {typeof row.review_count === "number" && row.review_count >= 0 ? (
                    <>
                      {" "}
                      ({row.review_count.toLocaleString()} reviews)
                    </>
                  ) : null}
                </p>
              ) : (
                <p className="mt-2 text-xs text-muted">No rating recorded</p>
              )}
              {address ? (
                <p className="mt-2 text-sm leading-snug text-muted sm:leading-relaxed">{address}</p>
              ) : null}
              {row.phone?.trim() ? (
                <p className="mt-2 text-sm">
                  <a
                    href={`tel:${encodeURIComponent(row.phone.trim())}`}
                    className="font-semibold text-accent underline-offset-2 hover:underline"
                  >
                    {row.phone.trim()}
                  </a>
                </p>
              ) : null}
              {row.website?.trim() ? (
                <p className="mt-1.5 text-sm">
                  <a
                    href={websiteHref(row.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-accent underline-offset-2 hover:underline"
                  >
                    Visit website
                  </a>
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-accent transition hover:border-accent/40"
                >
                  Open in Maps
                </a>
                <button
                  type="button"
                  onClick={() => void removeRow(row)}
                  disabled={busyId === row.id}
                  className="inline-flex items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:border-red-200/80 hover:bg-red-50/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busyId === row.id ? "Removing…" : "Remove from saved"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
