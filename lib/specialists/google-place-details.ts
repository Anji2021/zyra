const DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json";

const DETAILS_FIELDS =
  "place_id,name,formatted_address,formatted_phone_number,website,rating,user_ratings_total";

export type GooglePlaceDetails = {
  place_id: string | null;
  name: string | null;
  formatted_address: string | null;
  formatted_phone_number: string | null;
  website: string | null;
  rating: number | null;
  user_ratings_total: number | null;
};

export async function fetchGooglePlaceDetails(
  placeId: string,
  apiKey: string,
): Promise<GooglePlaceDetails | null> {
  const trimmed = placeId.trim();
  if (!trimmed) return null;

  const url = new URL(DETAILS_URL);
  url.searchParams.set("place_id", trimmed);
  url.searchParams.set("fields", DETAILS_FIELDS);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), { method: "GET", next: { revalidate: 0 } });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    status?: string;
    result?: {
      place_id?: string;
      name?: string;
      formatted_address?: string;
      formatted_phone_number?: string;
      website?: string;
      rating?: number;
      user_ratings_total?: number;
    };
  };

  if (data.status !== "OK" || !data.result) {
    return null;
  }

  const r = data.result;
  return {
    place_id: typeof r.place_id === "string" ? r.place_id : trimmed,
    name: typeof r.name === "string" ? r.name.trim() || null : null,
    formatted_address:
      typeof r.formatted_address === "string" ? r.formatted_address.trim() || null : null,
    formatted_phone_number:
      typeof r.formatted_phone_number === "string"
        ? r.formatted_phone_number.trim() || null
        : null,
    website: typeof r.website === "string" ? r.website.trim() || null : null,
    rating: typeof r.rating === "number" && !Number.isNaN(r.rating) ? r.rating : null,
    user_ratings_total:
      typeof r.user_ratings_total === "number" && r.user_ratings_total >= 0
        ? r.user_ratings_total
        : null,
  };
}
