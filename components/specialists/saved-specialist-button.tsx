"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  placeId: string;
  payload: {
    name: string;
    address: string;
    rating: number | null;
    reviewCount: number | null;
    mapsUrl: string;
    phone: string | null;
    website: string | null;
    specialistType: string;
    searchLocation: string;
  };
  initiallySaved?: boolean;
  className?: string;
};

export function SavedSpecialistButton({
  placeId,
  payload,
  initiallySaved = false,
  className = "",
}: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(initiallySaved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pid = placeId.trim();
  const disabled = busy || !pid;

  useEffect(() => {
    setSaved(initiallySaved);
  }, [initiallySaved, pid]);

  async function toggle() {
    if (!pid || busy) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/specialists/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          place_id: pid,
          name: payload.name,
          address: payload.address,
          rating: payload.rating,
          review_count: payload.reviewCount,
          maps_url: payload.mapsUrl,
          phone: payload.phone ?? undefined,
          website: payload.website ?? undefined,
          specialist_type: payload.specialistType,
          search_location: payload.searchLocation,
        }),
      });
      const data = (await res.json()) as { saved?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      const nextSaved = data.saved === true;
      setSaved(nextSaved);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`min-w-0 space-y-1 ${className}`.trim()}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => void toggle()}
        className={`flex min-h-10 w-full items-center justify-center rounded-full px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-11 sm:text-sm ${
          saved
            ? "border border-border bg-soft-rose/40 text-accent hover:border-red-200/70 hover:bg-red-50/50"
            : "border border-border bg-background text-foreground hover:border-accent/35 hover:bg-soft-rose/25"
        }`}
      >
        {busy ? (saved ? "Removing…" : "Saving…") : saved ? "Remove from saved" : "Save"}
      </button>
      {error ? (
        <p className="text-center text-[10px] leading-snug text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
