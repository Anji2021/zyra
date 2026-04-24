export function buildGoogleMapsUrl(placeId: string, name: string, address: string): string {
  const trimmedId = placeId.trim();
  if (trimmedId) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=${encodeURIComponent(trimmedId)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${address}`.trim())}`;
}
