# HERD / GRUBBr — Restaurant Discovery

Figma Make prototype turned into a runnable Vite + React app.

## Run locally

```bash
cd restaurant-app
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## What works in this pass

1. Installable project (`react` / `react-dom` are real dependencies).
2. Swipe session: location → survey → cards → shortlist → pick one → Maps.
3. Places-shaped data layer in `src/app/data/places.ts`.
   - Device location when allowed.
   - Memphis, TN fallback when skipped or geolocation fails.
   - Mock deck remapped around that origin so distances look local.
   - `placeToRestaurant()` is the adapter for a future Places API response.

## Wire live Google Places later

Do **not** call Places from the browser. Add a backend route that calls
Nearby Search, then implement the body of `fetchNearbyPlaces()` to hit that route.

Until then, `VITE_GOOGLE_PLACES_API_KEY` is unused except as a reminder.

## Project layout

- `src/app/App.tsx` — session flow
- `src/app/data/mockRestaurants.ts` — current deck
- `src/app/data/places.ts` — location + Place → Restaurant adapter
- `src/app/components/SwipeCard.tsx` — card UI + `Restaurant` type
