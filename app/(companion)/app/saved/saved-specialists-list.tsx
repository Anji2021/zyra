"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { buildGoogleMapsUrl } from "@/lib/specialists/maps-url";
import type { SavedSpecialistRow } from "@/lib/specialists/saved-queries";
import { FRIENDLY_TRY_AGAIN } from "@/lib/zyra/user-messages";

type SavedSpecialistsListProps = {
  initial: SavedSpecialistRow[];
};

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
        body: JSON.stringify({
          place_id: pid,
          name: row.name ?? "",
          address: row.address ?? "",
          rating: row.rating,
        }),
      });
      const data = (await res.json()) as { saved?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? FRIENDLY_TRY_AGAIN);
        return;
      }
      if (data.saved === false) {
        setRows((prev) => prev.filter((x) => x.id !== row.id));
        router.refresh();
      }
    } catch {
      setError(FRIENDLY_TRY_AGAIN);
    } finally {
      setBusyId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border/80 bg-background/65 px-5 py-12 text-center">
        <p className="font-serif text-lg font-medium text-foreground">You haven&apos;t saved any specialists yet</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          When you find a provider you want to remember, tap Save from search results — they&apos;ll
          land here, only for you.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-2xl border border-red-200/80 bg-red-50 px-4 py-3 text-center text-sm text-red-950" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="space-y-4">
        {rows.map((row) => {
          const name = row.name ?? "Unknown";
          const address = row.address ?? "";
          const pid = row.place_id?.trim() ?? "";
          const mapsUrl = buildGoogleMapsUrl(pid, name, address);
          return (
            <li
              key={row.id}
              className="rounded-2xl border border-border/70 bg-background/90 p-5 shadow-sm sm:p-6"
            >
              <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground">{name}</h2>
              {address ? (
                <p className="mt-2 text-sm leading-relaxed text-muted">{address}</p>
              ) : null}
              {row.rating != null ? (
                <p className="mt-2 text-xs text-muted sm:text-sm">
                  <span className="font-medium text-foreground">Rating:</span> {Number(row.rating).toFixed(1)}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-accent transition hover:border-accent/40"
                >
                  Open in Google Maps
                </a>
                <button
                  type="button"
                  onClick={() => void removeRow(row)}
                  disabled={busyId === row.id}
                  className="inline-flex items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:border-red-200/80 hover:bg-red-50/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busyId === row.id ? "Removing…" : "Remove"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
