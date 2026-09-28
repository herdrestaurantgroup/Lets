import type { Restaurant } from "../components/SwipeCard";
import { mockRestaurants } from "./mockRestaurants";

/** Memphis fallback when the user skips location or geolocation fails. */
export const MEMPHIS = { lat: 35.1495, lng: -90.0490, label: "Memphis, TN" };

/**
 * Google Places-shaped record.
 * Swap `fetchNearbyPlaces` to call Places API (New) Nearby Search
 * and keep `placeToRestaurant` so SwipeCard does not change.
 */
export interface Place {
  placeId: string;
  name: string;
  primaryType?: string;
  types?: string[];
  rating?: number;
  priceLevel?: number; // 1-4
  photoUrls?: string[];
  location: { lat: number; lng: number };
  vicinity?: string;
  isOpen?: boolean | null;
  mapsUrl?: string;
  editorialSummary?: string;
}

export interface UserLocation {
  lat: number;
  lng: number;
  label?: string;
  source: "device" | "fallback";
}

export interface NearbyResult {
  restaurants: Restaurant[];
  location: UserLocation;
  source: "places" | "mock";
}

function toRadians(deg: number) {
  return (deg * Math.PI) / 180;
}

export function distanceMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 3958.8;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistance(miles: number): string {
  if (miles < 0.1) return "<0.1 mi";
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

function cuisineFromPlace(place: Place): string {
  if (place.primaryType) {
    return place.primaryType
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  const skip = new Set(["restaurant", "food", "point_of_interest", "establishment"]);
  const first = (place.types || []).find((t) => !skip.has(t));
  if (first) {
    return first.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return "Restaurant";
}

function numericIdFromPlaceId(placeId: string): number {
  let hash = 0;
  for (let i = 0; i < placeId.length; i++) {
    hash = (hash * 31 + placeId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 1;
}

export function placeToRestaurant(place: Place, origin: { lat: number; lng: number }): Restaurant {
  const miles = distanceMiles(origin, place.location);
  const photos = place.photoUrls?.filter(Boolean) ?? [];
  const imageUrl = photos[0] || "";
  return {
    id: numericIdFromPlaceId(place.placeId),
    placeId: place.placeId,
    name: place.name,
    cuisine: cuisineFromPlace(place),
    distance: formatDistance(miles),
    rating: place.rating ?? 0,
    priceLevel: Math.min(4, Math.max(1, place.priceLevel ?? 2)),
    imageUrl,
    photos: photos.length
      ? {
          food: photos[0],
          menu: photos[1] || photos[0],
          interior: photos[2] || photos[0],
          exterior: photos[3] || photos[0],
        }
      : undefined,
    description: place.editorialSummary,
    lat: place.location.lat,
    lng: place.location.lng,
    mapsUrl:
      place.mapsUrl ||
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.placeId}`,
    isOpen: place.isOpen ?? null,
    source: "places",
  };
}

const CUISINE_PHOTOS: Record<string, string> = {
  bbq: "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=1080&q=80",
  pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1080&q=80",
  italian: "https://images.unsplash.com/photo-1672636401339-88d7b84cb1df?auto=format&fit=crop&w=1080&q=80",
  mexican: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1080&q=80",
  sushi: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1080&q=80",
  japanese: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1080&q=80",
  chinese: "https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=1080&q=80",
  cafe: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1080&q=80",
  coffee: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1080&q=80",
  burger: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1080&q=80",
  default: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1080&q=80",
};

function photoForCuisine(cuisine: string): string {
  const key = Object.keys(CUISINE_PHOTOS).find((k) => cuisine.toLowerCase().includes(k));
  return CUISINE_PHOTOS[key || "default"];
}

function priceFromTags(tags: Record<string, string>): number {
  const raw = tags["payment:price_range"] || tags.fee || "";
  if (raw.includes("$$$$") || raw === "4") return 4;
  if (raw.includes("$$$") || raw === "3") return 3;
  if (raw.includes("$$") || raw === "2") return 2;
  if (tags.amenity === "fast_food") return 1;
  return 2;
}

function osmToPlace(el: {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}): Place | null {
  const tags = el.tags || {};
  const name = tags.name;
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (!name || lat == null || lng == null) return null;
  const cuisine = tags.cuisine || tags.amenity || "restaurant";
  const photo = photoForCuisine(cuisine);
  return {
    placeId: `osm:${el.id}`,
    name,
    primaryType: cuisine,
    types: [tags.amenity, cuisine].filter(Boolean),
    rating: 0,
    priceLevel: priceFromTags(tags),
    photoUrls: [photo],
    location: { lat, lng },
    vicinity: [tags["addr:street"], tags["addr:city"]].filter(Boolean).join(", "),
    mapsUrl: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`,
    editorialSummary: tags.opening_hours,
  };
}

/**
 * Nearby restaurants from OpenStreetMap (no API key).
 * Photos are public cuisine stand-ins. OSM rarely has the restaurant's own photo.
 */
export async function fetchNearbyPlaces(
  origin: { lat: number; lng: number },
  radiusMeters = 4000
): Promise<Place[] | null> {
  const query = `[out:json][timeout:20];(node["amenity"~"restaurant|cafe|fast_food|bar"]["name"](around:${radiusMeters},${origin.lat},${origin.lng});way["amenity"~"restaurant|cafe|fast_food|bar"]["name"](around:${radiusMeters},${origin.lat},${origin.lng}););out center 40;`;
  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];
  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!response.ok) continue;
      const data = await response.json();
      const places = (data.elements || [])
        .map(osmToPlace)
        .filter((p: Place | null): p is Place => Boolean(p));
      if (places.length > 0) return places.slice(0, 40);
    } catch (error) {
      console.warn("Nearby place fetch failed", url, error);
    }
  }
  return null;
}

function mockAsNearby(origin: { lat: number; lng: number }): Restaurant[] {
  return mockRestaurants.map((r, index) => {
    // Fan restaurants around the origin so distance looks local.
    const angle = (index / Math.max(1, mockRestaurants.length)) * Math.PI * 2;
    const radiusMiles = 0.3 + (index % 8) * 0.35;
    const dLat = (radiusMiles / 69) * Math.cos(angle);
    const dLng = (radiusMiles / (69 * Math.cos(toRadians(origin.lat)))) * Math.sin(angle);
    const lat = origin.lat + dLat;
    const lng = origin.lng + dLng;
    const miles = distanceMiles(origin, { lat, lng });
    return {
      ...r,
      distance: formatDistance(miles),
      lat,
      lng,
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name + " Memphis")}`,
      source: "mock" as const,
      isOpen: r.id % 7 === 0 ? false : true,
    };
  });
}

export async function getCurrentLocation(timeoutMs = 8000): Promise<UserLocation> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return { ...MEMPHIS, source: "fallback" };
  }
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve({ ...MEMPHIS, source: "fallback" }), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        window.clearTimeout(timer);
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "Current location",
          source: "device",
        });
      },
      () => {
        window.clearTimeout(timer);
        resolve({ ...MEMPHIS, source: "fallback" });
      },
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 60_000 }
    );
  });
}

export async function fetchNearbyRestaurants(options?: {
  useDeviceLocation?: boolean;
  origin?: { lat: number; lng: number };
}): Promise<NearbyResult> {
  const location = options?.origin
    ? { ...options.origin, source: "device" as const }
    : options?.useDeviceLocation
      ? await getCurrentLocation()
      : { ...MEMPHIS, source: "fallback" as const };

  const places = await fetchNearbyPlaces(location);
  if (places && places.length > 0) {
    return {
      restaurants: places.map((p) => placeToRestaurant(p, location)),
      location,
      source: "places",
    };
  }

  return {
    restaurants: mockAsNearby(location),
    location,
    source: "mock",
  };
}
